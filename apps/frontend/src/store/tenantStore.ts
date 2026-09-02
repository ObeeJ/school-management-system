import { create } from 'zustand';

export interface TenantInfo {
  tenantId: string;
  name: string;
  subdomain: string;
  tier: 'STARTER_POOLED_RLS' | 'GROWTH_ISOLATED_SCHEMA' | 'ENTERPRISE_DEDICATED_DB';
}

interface TenantState {
  activeTenant: TenantInfo;
  availableTenants: TenantInfo[];
  setTenant: (tenantId: string) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  activeTenant: {
    tenantId: 'oakwood-academy',
    name: 'Oakwood Academy (Starter Tier)',
    subdomain: 'oakwood-academy',
    tier: 'STARTER_POOLED_RLS',
  },
  availableTenants: [
    {
      tenantId: 'oakwood-academy',
      name: 'Oakwood Academy',
      subdomain: 'oakwood-academy',
      tier: 'STARTER_POOLED_RLS',
    },
    {
      tenantId: 'st-jude-high',
      name: 'St. Jude High School',
      subdomain: 'st-jude-high',
      tier: 'STARTER_POOLED_RLS',
    },
    {
      tenantId: 'horizon-prep-schema',
      name: 'Horizon Preparatory (Schema Isolated)',
      subdomain: 'horizon-prep-schema',
      tier: 'GROWTH_ISOLATED_SCHEMA',
    },
    {
      tenantId: 'apex-collegiate-enterprise',
      name: 'Apex Collegiate (Enterprise Dedicated DB)',
      subdomain: 'apex-collegiate-enterprise',
      tier: 'ENTERPRISE_DEDICATED_DB',
    },
  ],
  setTenant: (tenantId: string) => {
    const selected = get().availableTenants.find((t) => t.tenantId === tenantId);
    if (selected) {
      set({ activeTenant: selected });
    }
  },
}));
