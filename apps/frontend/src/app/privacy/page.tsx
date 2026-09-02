import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf9f5] text-[#1c1b18] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs font-mono text-[#57544d] hover:underline mb-8 block">
          &larr; Back to Platform Dashboard
        </Link>
        <h1 className="font-serif text-3xl font-semibold mb-2">Privacy Policy & FERPA Compliance</h1>
        <p className="text-xs font-mono text-[#57544d] uppercase mb-8">
          Effective Date: September 2, 2026 | Version 1.2
        </p>

        <div className="space-y-6 text-sm text-[#1c1b18] leading-relaxed">
          <section className="bg-[#f2f0e9] p-6 border border-[#e2ded4] rounded-sm">
            <h2 className="font-serif text-lg font-semibold mb-2">1. Educational Record Protection</h2>
            <p>
              We adhere strictly to FERPA (Family Educational Rights and Privacy Act) and GDPR guidelines. All student records, attendance logs, and financial records are protected by cryptographic transport protocols and tenant-scoped row-level security.
            </p>
          </section>

          <section className="bg-[#f2f0e9] p-6 border border-[#e2ded4] rounded-sm">
            <h2 className="font-serif text-lg font-semibold mb-2">2. Zero Cross-Tenant Data Access</h2>
            <p>
              No tenant administrator, teacher, or student from one school scope can query, mutate, or observe records belonging to another school scope under any circumstance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
