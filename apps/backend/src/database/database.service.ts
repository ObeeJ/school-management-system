import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { TenantContext } from '../tenancy/tenant.context';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private isMock: boolean = false;

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

  async queryTenantScoped<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const session = TenantContext.current();
    const tenantId = session?.tenantId || 'oakwood-academy';

    if (this.isMock) {
      return this.queryMock<T>(text, params, tenantId);
    }

    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
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
    this.mockStore.set('kyc_verifications', []);
    this.mockStore.set('payments', []);
    this.mockStore.set('ai_datasets', []);
    this.mockStore.set('ai_patterns', []);
    this.mockStore.set('tenant_subscriptions', []);
  }

  private queryMock<T>(text: string, params: any[], tenantId: string): T[] {
    const textLower = text.toLowerCase();

    // Students
    if (textLower.includes('from students')) {
      const records = (this.mockStore.get('students') || []).filter(r => r.tenant_id === tenantId);
      if (textLower.includes('count(*)')) {
        return [{ count: records.length.toString() }] as T[];
      }
      return records as T[];
    }
    if (textLower.includes('from payments')) {
      const records = (this.mockStore.get('payments') || []).filter(r => r.tenant_id === tenantId);
      if (textLower.includes('count(*)')) {
        return [{ count: records.length.toString() }] as T[];
      }
      return records as T[];
    }
    if (textLower.includes('from accounts')) {
      const records = (this.mockStore.get('accounts') || []).filter(r => r.tenant_id === tenantId);
      if (textLower.includes('count(*)')) {
        return [{ count: records.length.toString() }] as T[];
      }
      return records as T[];
    }
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
      this.mockStore.get('students')?.push(newStudent);
      return [newStudent] as T[];
    }

    // KYC
    if (textLower.includes('insert into kyc_verifications')) {
      const kyc = {
        id: `kyc-${Date.now()}`,
        tenant_id: tenantId,
        user_id: params[0],
        provider: params[1],
        document_type: params[2],
        document_number: params[3],
        country_code: params[4],
        status: params[5],
        verified_at: new Date(),
        created_at: new Date(),
      };
      this.mockStore.get('kyc_verifications')?.push(kyc);
      return [kyc] as T[];
    }
    if (textLower.includes('from kyc_verifications')) {
      const records = this.mockStore.get('kyc_verifications') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // Payments
    if (textLower.includes('insert into payments')) {
      const payment = {
        id: `pay-${Date.now()}`,
        tenant_id: tenantId,
        type: params[0] === 'PAY_IN' ? 'PAY_IN' : 'PAY_OUT',
        idempotency_key: params[0] === 'PAY_IN' ? params[0] : params[0],
        stripe_intent_id: params[1],
        amount_cents: params[2],
        currency: params[3],
        status: params[4],
        recipient_email: params[5] || null,
        created_at: new Date(),
      };
      // Adjusted parameter alignment for pay-in vs pay-out
      if (textLower.includes("'pay_in'")) {
        payment.type = 'PAY_IN';
        payment.idempotency_key = params[0];
        payment.stripe_intent_id = params[1];
        payment.amount_cents = params[2];
        payment.currency = params[3];
        payment.status = params[4];
      } else if (textLower.includes("'pay_out'")) {
        payment.type = 'PAY_OUT';
        payment.idempotency_key = params[0];
        payment.stripe_intent_id = params[1];
        payment.amount_cents = params[2];
        payment.currency = params[3];
        payment.status = params[4];
        payment.recipient_email = params[5];
      }
      this.mockStore.get('payments')?.push(payment);
      return [payment] as T[];
    }
    if (textLower.includes('from payments')) {
      const records = this.mockStore.get('payments') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // AI Datasets
    if (textLower.includes('insert into ai_datasets')) {
      const ds = {
        id: `ds-${Date.now()}`,
        tenant_id: tenantId,
        name: params[0],
        dataset_type: params[1],
        record_count: params[2],
        created_at: new Date(),
      };
      this.mockStore.get('ai_datasets')?.push(ds);
      return [ds] as T[];
    }
    if (textLower.includes('from ai_datasets')) {
      const records = this.mockStore.get('ai_datasets') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // Subscriptions
    if (textLower.includes('from tenant_subscriptions')) {
      const records = (this.mockStore.get('tenant_subscriptions') || []).filter(r => r.tenant_id === tenantId);
      return records as T[];
    }
    if (textLower.includes('insert into tenant_subscriptions')) {
      const existing = (this.mockStore.get('tenant_subscriptions') || []).findIndex(r => r.tenant_id === tenantId);
      const sub = {
        id: `sub-${Date.now()}`,
        tenant_id: tenantId,
        plan_id: params[1],
        stripe_subscription_id: params[2],
        stripe_customer_id: params[3],
        status: 'ACTIVE',
        auto_debit_enabled: params[4],
        current_period_start: params[5],
        current_period_end: params[6],
        cancel_at_period_end: false,
        created_at: new Date(),
      };
      if (existing >= 0) {
        this.mockStore.get('tenant_subscriptions')![existing] = sub;
      } else {
        this.mockStore.get('tenant_subscriptions')?.push(sub);
      }
      return [sub] as T[];
    }
    if (textLower.includes('update tenant_subscriptions')) {
      const records = (this.mockStore.get('tenant_subscriptions') || []).filter(r => r.tenant_id === tenantId);
      if (records.length) {
        if (textLower.includes("cancel_at_period_end = true")) {
          records[0].cancel_at_period_end = true;
          records[0].auto_debit_enabled = false;
        } else if (textLower.includes("status = 'canceled'")) {
          records[0].status = 'CANCELED';
          records[0].auto_debit_enabled = false;
        }
      }
      return records as T[];
    }

    // AI Patterns
    if (textLower.includes('insert into ai_patterns')) {
      const pat = {
        id: `pat-${Date.now()}`,
        tenant_id: tenantId,
        pattern_name: params[0],
        system_instructions: params[1],
        trigger_rule: params[2],
        is_active: true,
        created_at: new Date(),
      };
      this.mockStore.get('ai_patterns')?.push(pat);
      return [pat] as T[];
    }
    if (textLower.includes('from ai_patterns')) {
      const records = this.mockStore.get('ai_patterns') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }

    // Classes & Accounts
    if (textLower.includes('from classes')) {
      const records = this.mockStore.get('classes') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }
    if (textLower.includes('from accounts')) {
      const records = this.mockStore.get('accounts') || [];
      return records.filter(r => r.tenant_id === tenantId) as T[];
    }
    if (textLower.includes('insert into journal_entries')) {
      const entry = {
        id: `je-${Date.now()}`,
        tenant_id: tenantId,
        reference: params[0] || 'FEES-PAYMENT',
        description: params[1] || 'Tuition Fee Payment',
        posted_at: new Date(),
      };
      this.mockStore.get('journal_entries')?.push(entry);
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
        created_at: new Date(),
      };
      this.mockStore.get('ledger_lines')?.push(line);
      return [line] as T[];
    }

    return [] as T[];
  }
}
