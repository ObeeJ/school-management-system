import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf9f5] text-[#1c1b18] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs font-mono text-[#57544d] hover:underline mb-8 block">
          &larr; Back to Platform Dashboard
        </Link>
        <h1 className="font-serif text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-xs font-mono text-[#57544d] uppercase mb-8">
          Effective Date: September 2, 2026 | Version 1.2
        </p>

        <div className="space-y-6 text-sm text-[#1c1b18] leading-relaxed">
          <section className="bg-[#f2f0e9] p-6 border border-[#e2ded4] rounded-sm">
            <h2 className="font-serif text-lg font-semibold mb-2">1. Multi-Tenant Data Boundaries</h2>
            <p>
              Subscribers agree that tenant data isolation is enforced via database-level session context and row-level security policies. Each educational institution is assigned a distinct tenant identifier.
            </p>
          </section>

          <section className="bg-[#f2f0e9] p-6 border border-[#e2ded4] rounded-sm">
            <h2 className="font-serif text-lg font-semibold mb-2">2. Acceptable Use & Educational Integrity</h2>
            <p>
              The platform must strictly be utilized for lawful educational institution administration, student management, and financial fee reconciliation.
            </p>
          </section>

          <section className="bg-[#f2f0e9] p-6 border border-[#e2ded4] rounded-sm">
            <h2 className="font-serif text-lg font-semibold mb-2">3. Service Level & Data SLA</h2>
            <p>
              Enterprise tiers include dedicated database clusters and isolated search paths. Data backup and point-in-time recovery are guaranteed according to tier entitlements.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
