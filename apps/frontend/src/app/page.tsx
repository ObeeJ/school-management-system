'use client';

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { TenancyOverviewCard } from '../components/TenancyOverviewCard';
import { AdminDashboard } from '../components/AdminDashboard';
import { StripePaymentsSection } from '../components/StripePaymentsSection';
import { KycVerificationSection } from '../components/KycVerificationSection';
import { AiEngineSection } from '../components/AiEngineSection';
import { StudentsTable } from '../components/StudentsTable';
import { LedgerSection } from '../components/LedgerSection';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ADMIN' | 'PAYMENTS' | 'KYC' | 'AI_ENGINE'>('OVERVIEW');

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5]">
      <Header />

      {/* Primary Navigation Tabs */}
      <nav className="w-full bg-[#f2f0e9] border-b border-[#e2ded4] px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'OVERVIEW' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d] hover:text-[#1c1b18]'
            }`}
          >
            Overview & Tenancy RLS
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-4 py-2 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ADMIN' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d] hover:text-[#1c1b18]'
            }`}
          >
            Admin Control Plane
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-4 py-2 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'PAYMENTS' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d] hover:text-[#1c1b18]'
            }`}
          >
            Stripe Payments (Pay-In/Out)
          </button>
          <button
            onClick={() => setActiveTab('KYC')}
            className={`px-4 py-2 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'KYC' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d] hover:text-[#1c1b18]'
            }`}
          >
            KYC Compliance (UK & USA)
          </button>
          <button
            onClick={() => setActiveTab('AI_ENGINE')}
            className={`px-4 py-2 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'AI_ENGINE' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d] hover:text-[#1c1b18]'
            }`}
          >
            AI RAG & Pattern Engine
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'OVERVIEW' && (
          <>
            <TenancyOverviewCard />
            <StudentsTable />
            <LedgerSection />
          </>
        )}

        {activeTab === 'ADMIN' && <AdminDashboard />}
        {activeTab === 'PAYMENTS' && <StripePaymentsSection />}
        {activeTab === 'KYC' && <KycVerificationSection />}
        {activeTab === 'AI_ENGINE' && <AiEngineSection />}
      </main>

      <footer className="w-full bg-[#f2f0e9] border-t border-[#e2ded4] py-6 px-6 mt-12 text-center text-xs text-[#57544d]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Scholaria Architecture Platform. Anti-Vibe-Coded Design Compliance.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
