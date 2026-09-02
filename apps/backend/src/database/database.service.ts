import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { TenantContext } from '../tenancy/tenant.context';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private isMock: boolean = false;

  // In-memory mock storage fallback when live Postgres connection fails (for standalone local dev & smoke tests)
  private mockStore: Map<string, any[]> = new Map();

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/school_db';
    
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
    });

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[DATABASE] Connected to PostgreSQL instance successfully.');
    } catch (err) {
      console.warn('[DATABASE] PostgreSQL unavailable. Operating in-memory Mock Data Isolation layer for dev/test verification.');
      this.isMock = true;
      this.initMockStore();
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  /**
   * Executes a database query inside a tenant-isolated transactional scope.
   * Enforces `SET LOCAL app.current_tenant_id = $1` to trigger PostgreSQL RLS policies.
   */
  async queryTenantScoped<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const session = TenantContext.current();
    const tenantId = session?.tenantId || 'oakwood-academy';

    if (this.isMock) {
      return this.queryMock<T>(text, params, tenantId);
    }

    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Enforce Row-Level Security via Postgres Session Setting
      await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId]);

      if (session?.tier === 'GROWTH_ISOLATED_SCHEMA' && session.dbSchema) {
        await client.query(`SET LOCAL search_path TO ${session.dbSchema}, public`);
      }

      const res = await client.query(text, params);
      await client.query('COMMIT');
      return res.rows as T[];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private initMockStore() {
    this.mockStore.set('students', [
      { id: 'st-1', tenant_id: 'oakwood-academy', student_code: 'OAK-001', first_name: 'Alice', last_name: 'Johnson', grade_level: 'Grade 10', created_at: new Date() },
      { id: 'st-2', tenant_id: 'oakwood-academy', student_code: 'OAK-002', first_name: 'Bob', last_name: 'Smith', grade_level: 'Grade 11', created_at: new Date() },
      { id: 'st-3', tenant_id: 'st-jude-high', student_code: 'STJ-001', first_name: 'Charlie', last_name: 'Brown', grade_level: 'Grade 9', created_at: new Date() },
    ]);

    this.mockStore.set('classes', [
      { id: 'cls-1', tenant_id: 'oakwood-academy', name: 'AP Physics', subject: 'Physics', academic_term: 'Fall 2026', created_at: new Date() },
      { id: 'cls-2', tenant_id: 'st-jude-high', name: 'Biology 101', subject: 'Biology', academic_term: 'Fall 2026', created_at: new Date() },
    ]);

    this.mockStore.set('accounts', [
      { id: 'acc-1', tenant_id: 'oakwood-academy', account_number: '1010', name: 'Cash Account', type: 'ASSET' },
      { id: 'acc-2', tenant_id: 'oakwood-academy', account_number: '4010', name: 'Tuition Revenue', type: 'REVENUE' },
      { id: 'acc-3', tenant_id: 'st-jude-high', account_number: '1010', name: 'Cash Account', type: 'ASSET' },
      { id: 'acc-4', tenant_id: 'st-jude-high', account_number: '4010', name: 'Tuition Revenue', type: 'REVENUE' },
    ]);

    this.mockStore.set('journal_entries', []);
    this.mockStore.set('ledger_lines', []);
  }

  private queryMock<T>(text: string, params: any[], tenantId: string): T[] {
    const textLower = text.toLowerCase();

    // Students table mock queries
    if (textLower.includes('from students')) {
      const records = this.mockStore.get('students') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // Insert student mock query
    if (textLower.includes('insert into students')) {
      const newStudent = {
        id: `st-${Date.now()}`,
        tenant_id: tenantId,
        student_code: params[0] || `STU-${Math.floor(Math.random() * 1000)}`,
        first_name: params[1] || 'New',
        last_name: params[2] || 'Student',
        grade_level: params[3] || 'Grade 10',
        created_at: new Date(),
      };
      const records = this.mockStore.get('students') || [];
      records.push(newStudent);
      return [newStudent] as T[];
    }

    // Classes mock queries
    if (textLower.includes('from classes')) {
      const records = this.mockStore.get('classes') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // Accounts mock queries
    if (textLower.includes('from accounts')) {
      const records = this.mockStore.get('accounts') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // Ledger double entry simulation
    if (textLower.includes('insert into journal_entries')) {
      const entry = {
        id: `je-${Date.now()}`,
        tenant_id: tenantId,
        reference: params[0] || 'FEES-PAYMENT',
        description: params[1] || 'Tuition Fee Payment',
        posted_at: new Date()
      };
      const entries = this.mockStore.get('journal_entries') || [];
      entries.push(entry);
      return [entry] as T[];
    }

    if (textLower.includes('insert into ledger_lines')) {
      const line = {
        id: `ll-${Date.now()}`,
        tenant_id: tenantId,
        entry_id: params[0],
        account_id: params[1],
        amount_cents: params[2],
        direction: params[3],
        created_at: new Date()
      };
      const lines = this.mockStore.get('ledger_lines') || [];
      lines.push(line);
      return [line] as T[];
    }

    return [] as T[];
  }
}
