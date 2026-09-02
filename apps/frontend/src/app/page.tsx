'use client';

import React from 'react';
import { Header } from '../components/Header';
import { TenancyOverviewCard } from '../components/TenancyOverviewCard';
import { StudentsTable } from '../components/StudentsTable';
import { LedgerSection } from '../components/LedgerSection';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <TenancyOverviewCard />
        <StudentsTable />
        <LedgerSection />
      </main>

      <footer className="w-full bg-[#f2f0e9] border-t border-[#e2ded4] py-6 px-6 mt-12 text-center text-xs text-[#57544d]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Scholaria Architecture Platform. Anti-Vibe-Coded Design System Compliance.</p>
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
