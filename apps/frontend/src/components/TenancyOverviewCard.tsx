'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function TenancyOverviewCard() {
  const { activeTenant } = useTenantStore();

  const { data: strategyData, isLoading } = useQuery({
    queryKey: ['tenancy-strategy', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/tenancy/strategy', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch strategy');
      return res.json();
    },
  });

  const strategy = strategyData?.data;

  return (
    <section className="bg-[#f2f0e9] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#e2ded4]">
        <div>
          <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
            Data Isolation Architecture & Context Propagation
          </span>
          <h2 className="font-serif text-xl font-semibold text-[#1c1b18]">
            Active Multi-Tenancy Engine: {activeTenant.name}
          </h2>
        </div>
        <div className="inline-flex items-center px-3 py-1 bg-[#faf9f5] border border-[#e2ded4] rounded-sm text-xs font-mono text-[#24333c]">
          Tier: {activeTenant.tier}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-[#faf9f5] p-4 border border-[#e2ded4] rounded-sm">
          <h3 className="text-xs font-mono uppercase text-[#57544d] mb-1">Isolation Model</h3>
          {isLoading ? (
            <div className="h-5 w-36 animate-skeleton rounded-sm mt-1" />
          ) : (
            <p className="text-sm font-semibold text-[#1c1b18]">
              {strategy?.isolationStrategy || 'PostgreSQL Row-Level Security (RLS)'}
            </p>
          )}
        </div>

        <div className="bg-[#faf9f5] p-4 border border-[#e2ded4] rounded-sm">
          <h3 className="text-xs font-mono uppercase text-[#57544d] mb-1">Runtime RLS Session Variable</h3>
          <p className="text-xs font-mono text-[#24333c] break-all">
            SET LOCAL app.current_tenant_id = &apos;{activeTenant.tenantId}&apos;
          </p>
        </div>

        <div className="bg-[#faf9f5] p-4 border border-[#e2ded4] rounded-sm">
          <h3 className="text-xs font-mono uppercase text-[#57544d] mb-1">Data Boundary & Target Schema</h3>
          <p className="text-xs font-mono text-[#1c1b18]">
            Schema: {strategy?.schemaOrDatabase || 'public'}
          </p>
        </div>
      </div>
    </section>
  );
}
