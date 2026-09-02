import { AsyncLocalStorage } from 'async_hooks';

export interface TenantSession {
  tenantId: string;
  tier: 'STARTER_POOLED_RLS' | 'GROWTH_ISOLATED_SCHEMA' | 'ENTERPRISE_DEDICATED_DB';
  dbSchema?: string;
  userId?: string;
}

export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantSession>();

  static run<T>(session: TenantSession, callback: () => T): T {
    return this.storage.run(session, callback);
  }

  static current(): TenantSession | undefined {
    return this.storage.getStore();
  }

  static getRequiredTenantId(): string {
    const session = this.current();
    if (!session || !session.tenantId) {
      throw new Error('[TENANCY_VIOLATION] No active tenant context bound to current execution context.');
    }
    return session.tenantId;
  }
}
