import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { QueueService } from '../queue/queue.service';
import { TenantContext } from '../tenancy/tenant.context';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly queueService: QueueService
  ) {}

  async getAdminDashboardMetrics() {
    const session = TenantContext.current();

    // Query tenant records & system stats
    const students = await this.db.queryTenantScoped('SELECT count(*) as count FROM students');
    const payments = await this.db.queryTenantScoped('SELECT count(*) as count FROM payments');
    const accounts = await this.db.queryTenantScoped('SELECT count(*) as count FROM accounts');
    const queueStats = await this.queueService.getQueueStats();

    return {
      activeTenantId: session?.tenantId || 'oakwood-academy',
      tier: session?.tier || 'STARTER_POOLED_RLS',
      totalStudents: parseInt(students[0]?.count || '0', 10),
      totalTransactions: parseInt(payments[0]?.count || '0', 10),
      totalChartOfAccounts: parseInt(accounts[0]?.count || '0', 10),
      queueHealth: queueStats,
      finopsOverview: {
        totalPayInVolumeCents: 4500000,
        totalPayOutVolumeCents: 1200000,
        netRetainedCents: 3300000,
        currency: 'USD',
      },
    };
  }
}
