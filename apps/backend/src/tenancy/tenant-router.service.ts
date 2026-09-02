import { Injectable } from '@nestjs/common';
import { TenantContext, TenantSession } from './tenant.context';

export interface TenancyArchitectureConfig {
  tenantId: string;
  tier: TenantSession['tier'];
  isolationStrategy: string;
  dbConnectionString: string;
  schemaOrDatabase: string;
  rowLevelSecurityActive: boolean;
}

@Injectable()
export class TenantRouterService {
  /**
   * Evaluates dynamic database routing configuration based on tenant subscription tier.
   */
  getTenantRoutingStrategy(): TenancyArchitectureConfig {
    const session = TenantContext.current();
    const tenantId = session?.tenantId || 'oakwood-academy';
    const tier = session?.tier || 'STARTER_POOLED_RLS';

    switch (tier) {
      case 'ENTERPRISE_DEDICATED_DB':
        return {
          tenantId,
          tier,
          isolationStrategy: 'Physical Database-per-Tenant (Isolated Pool)',
          dbConnectionString: `postgresql://db_user:secret@enterprise-${tenantId}.railway.app:5432/${tenantId}_db`,
          schemaOrDatabase: `db_${tenantId.replace(/-/g, '_')}`,
          rowLevelSecurityActive: false, // Physical DB guarantees zero cross-tenant contamination
        };

      case 'GROWTH_ISOLATED_SCHEMA':
        return {
          tenantId,
          tier,
          isolationStrategy: 'Logical Schema-per-Tenant (Search Path Partitioning)',
          dbConnectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/school_db',
          schemaOrDatabase: `schema_${tenantId.replace(/-/g, '_')}`,
          rowLevelSecurityActive: true,
        };

      case 'STARTER_POOLED_RLS':
      default:
        return {
          tenantId,
          tier,
          isolationStrategy: 'Shared Database & Shared Schema (Row-Level Security RLS)',
          dbConnectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/school_db',
          schemaOrDatabase: 'public',
          rowLevelSecurityActive: true,
        };
    }
  }
}
