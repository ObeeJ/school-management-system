'use client';

import React from 'react';
import { useTenantStore } from '../store/tenantStore';
import Link from 'next/link';

export function Header() {
  const { activeTenant, availableTenants, setTenant } = useTenantStore();

  return (
    <header className="w-full bg-[#f2f0e9] border-b border-[#e2ded4] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1b18] tracking-tight">
            Scholaria Platform
          </h1>
          <p className="text-xs text-[#57544d] uppercase tracking-wider mt-0.5">
            Multi-Tenant School Management Engine
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[#57544d]">
            <span className="font-mono text-[#24333c]">Tenant Context:</span>
            <select
              value={activeTenant.tenantId}
              onChange={(e) => setTenant(e.target.value)}
              className="bg-[#faf9f5] text-[#1c1b18] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#24333c]"
            >
              {availableTenants.map((t) => (
                <option key={t.tenantId} value={t.tenantId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-[#57544d] border-l border-[#e2ded4] pl-4">
            <Link href="/terms" className="hover:underline text-[#57544d]">
              Terms of Service
            </Link>
            <span className="text-[#e2ded4]">|</span>
            <Link href="/privacy" className="hover:underline text-[#57544d]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
