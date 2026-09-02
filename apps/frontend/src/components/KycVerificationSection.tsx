'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function KycVerificationSection() {
  const { activeTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const [provider, setProvider] = useState<'PREMBLY' | 'SMILE_ID' | 'STRIPE_IDENTITY'>('STRIPE_IDENTITY');
  const [docType, setDocType] = useState<'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID'>('PASSPORT');
  const [countryCode, setCountryCode] = useState('GB');
  const [docNumber, setDocNumber] = useState('P987654321');

  const { data: recData } = useQuery({
    queryKey: ['kyc-rec'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/kyc/recommendation');
      if (!res.ok) throw new Error('Failed to load recommendation');
      return res.json();
    },
  });

  const verifyKycMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:4000/kyc/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          user_id: `usr-${Date.now()}`,
          provider,
          document_type: docType,
          document_number: docNumber,
          country_code: countryCode,
        }),
      });
      if (!res.ok) throw new Error('KYC verification failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status', activeTenant.tenantId] });
    },
  });

  const rec = recData?.data;

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="mb-6 pb-4 border-b border-[#e2ded4]">
        <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
          Identity Verification & Compliance Engine
        </span>
        <h2 className="font-serif text-lg font-semibold text-[#1c1b18]">
          KYC Verification — UK & USA Compliance
        </h2>
        <p className="text-xs text-[#57544d] mt-1">
          Bypasses key check safely in development; strictly enforces verification in production.
        </p>
      </div>

      {/* Expert Analysis Banner */}
      {rec && (
        <div className="bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm mb-6 text-xs text-[#1c1b18] leading-relaxed">
          <h4 className="font-serif font-semibold text-[#24333c] mb-1">
            Target Market Compliance Analysis: UK & USA
          </h4>
          <p className="mb-2"><strong className="font-mono">Prembly Evaluation:</strong> {rec.premblyEvaluation}</p>
          <p className="mb-2"><strong className="font-mono">Smile ID Evaluation:</strong> {rec.smileIdEvaluation}</p>
          <p className="text-[#8a3a2a] font-semibold"><strong className="font-mono text-[#1c1b18]">Recommended Provider:</strong> {rec.recommendedProvider} — {rec.reasoning}</p>
        </div>
      )}

      {/* KYC Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verifyKycMutation.mutate();
        }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm mb-6"
      >
        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
          >
            <option value="STRIPE_IDENTITY">Stripe Identity (Recommended for UK/US)</option>
            <option value="PREMBLY">Prembly (Identitypass)</option>
            <option value="SMILE_ID">Smile ID</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as any)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
          >
            <option value="PASSPORT">Passport</option>
            <option value="DRIVERS_LICENSE">Drivers License</option>
            <option value="NATIONAL_ID">National ID / SSN</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Country</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
          >
            <option value="GB">United Kingdom (GB)</option>
            <option value="US">United States (US)</option>
            <option value="NG">Nigeria (NG)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Document Number</label>
          <input
            type="text"
            required
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
          />
        </div>

        <div className="md:col-span-4 flex justify-end mt-2">
          <button
            type="submit"
            disabled={verifyKycMutation.isPending}
            className="bg-[#24333c] hover:bg-[#1c2830] text-[#faf9f5] px-5 py-2 text-xs font-mono rounded-sm cursor-pointer transition-colors"
          >
            {verifyKycMutation.isPending ? 'Verifying Identity...' : 'Submit KYC Check'}
          </button>
        </div>
      </form>

      {verifyKycMutation.isSuccess && (
        <div className="p-4 bg-[#eef5f1] border border-[#a8d3b9] rounded-sm text-xs font-mono text-[#2b6e4f]">
          KYC Record Created: Status = {verifyKycMutation.data?.data?.status} (Dev Bypass Mode Active)
        </div>
      )}
    </section>
  );
}
