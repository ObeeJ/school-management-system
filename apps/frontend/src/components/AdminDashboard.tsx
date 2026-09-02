'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function AdminDashboard() {
  const { activeTenant } = useTenantStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/admin/dashboard', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to load admin metrics');
      return res.json();
    },
  });

  const metrics = data?.data;

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e2ded4] mb-6">
        <div>
          <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
            System Administration & Control Plane
          </span>
          <h2 className="font-serif text-xl font-semibold text-[#1c1b18]">
            Multi-Tenant Oversight — {activeTenant.name}
          </h2>
        </div>
        <div className="inline-flex items-center px-3 py-1 bg-[#f2f0e9] border border-[#e2ded4] rounded-sm text-xs font-mono text-[#24333c]">
          Isolation: {metrics?.tier || activeTenant.tier}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-20 animate-skeleton rounded-sm" />
          <div className="h-20 animate-skeleton rounded-sm" />
          <div className="h-20 animate-skeleton rounded-sm" />
          <div className="h-20 animate-skeleton rounded-sm" />
        </div>
      )}

      {isError && (
        <div className="p-4 bg-[#fcedeb] border border-[#f5b8b2] text-[#8a3a2a] text-xs font-mono rounded-sm">
          Failed to fetch administration metrics.
        </div>
      )}

      {!isLoading && !isError && metrics && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#f2f0e9] p-4 border border-[#e2ded4] rounded-sm">
              <span className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Enrolled Students</span>
              <p className="text-2xl font-serif font-semibold text-[#1c1b18]">{metrics.totalStudents}</p>
            </div>

            <div className="bg-[#f2f0e9] p-4 border border-[#e2ded4] rounded-sm">
              <span className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Total Transactions</span>
              <p className="text-2xl font-serif font-semibold text-[#1c1b18]">{metrics.totalTransactions}</p>
            </div>

            <div className="bg-[#f2f0e9] p-4 border border-[#e2ded4] rounded-sm">
              <span className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">FinOps Pay-In Volume</span>
              <p className="text-2xl font-serif font-semibold text-[#2b6e4f]">
                ${(metrics.finopsOverview.totalPayInVolumeCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-[#f2f0e9] p-4 border border-[#e2ded4] rounded-sm">
              <span className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">FinOps Pay-Out Volume</span>
              <p className="text-2xl font-serif font-semibold text-[#8a3a2a]">
                ${(metrics.finopsOverview.totalPayOutVolumeCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Queue & Async Health */}
          <div className="bg-[#f2f0e9] p-4 border border-[#e2ded4] rounded-sm">
            <h3 className="text-xs font-mono uppercase text-[#57544d] mb-3">BullMQ / Async Queue Engine Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-[#faf9f5] p-3 border border-[#e2ded4] rounded-sm">
                <span className="text-[#57544d]">Completed Jobs:</span> {metrics.queueHealth.completed}
              </div>
              <div className="bg-[#faf9f5] p-3 border border-[#e2ded4] rounded-sm">
                <span className="text-[#57544d]">Processing:</span> {metrics.queueHealth.processing}
              </div>
              <div className="bg-[#faf9f5] p-3 border border-[#e2ded4] rounded-sm">
                <span className="text-[#57544d]">Pending:</span> {metrics.queueHealth.pending}
              </div>
              <div className="bg-[#faf9f5] p-3 border border-[#e2ded4] rounded-sm">
                <span className="text-[#57544d]">Dead-Letter Queue (DLQ):</span> {metrics.queueHealth.failed_dlq}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
