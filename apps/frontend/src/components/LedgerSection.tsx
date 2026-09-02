'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function LedgerSection() {
  const { activeTenant } = useTenantStore();

  const [amountDollars, setAmountDollars] = useState('450.00');
  const [description, setDescription] = useState('Term 1 Tuition Fee');
  const [reference, setReference] = useState('FEE-2026-088');
  const [idempotencyKey, setIdempotencyKey] = useState(`IK-${Date.now().toString().slice(-6)}`);
  const [postedResult, setPostedResult] = useState<any>(null);

  const { data: accountsData } = useQuery({
    queryKey: ['accounts', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/ledger/accounts', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to load accounts');
      return res.json();
    },
  });

  const postFeeMutation = useMutation({
    mutationFn: async () => {
      const accounts = accountsData?.data || [];
      const assetAcc = accounts.find((a: any) => a.type === 'ASSET') || { id: 'acc-1' };
      const revAcc = accounts.find((a: any) => a.type === 'REVENUE') || { id: 'acc-2' };

      const res = await fetch('http://localhost:4000/ledger/fee-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          reference,
          description,
          amount_cents: Math.round(parseFloat(amountDollars || '0') * 100),
          asset_account_id: assetAcc.id,
          revenue_account_id: revAcc.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to post fee transaction');
      return res.json();
    },
    onSuccess: (data) => {
      setPostedResult(data.data);
      setIdempotencyKey(`IK-${Date.now().toString().slice(-6)}`);
    },
  });

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="mb-6 pb-4 border-b border-[#e2ded4]">
        <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
          Fintech Ledger Engine & Accounting Invariants
        </span>
        <h2 className="font-serif text-lg font-semibold text-[#1c1b18]">
          Double-Entry Tuition Fee Accounting
        </h2>
        <p className="text-xs text-[#57544d] mt-1">
          Ensures debits equal credits atomically within tenant isolation boundary &apos;{activeTenant.tenantId}&apos;.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          postFeeMutation.mutate();
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm"
      >
        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">
            Reference No.
          </label>
          <input
            type="text"
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">
            Idempotency Key
          </label>
          <input
            type="text"
            required
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs font-mono text-[#24333c] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">
            Description
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">
            Amount ($ USD)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={amountDollars}
            onChange={(e) => setAmountDollars(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none font-mono"
          />
        </div>

        <div className="md:col-span-2 flex justify-end mt-2">
          <button
            type="submit"
            disabled={postFeeMutation.isPending}
            className="bg-[#24333c] hover:bg-[#1c2830] text-[#faf9f5] px-5 py-2 text-xs font-mono rounded-sm cursor-pointer transition-colors"
          >
            {postFeeMutation.isPending ? 'Executing Atomic Ledger Write...' : 'Post Fee Transaction'}
          </button>
        </div>
      </form>

      {postedResult && (
        <div className="mt-4 p-4 bg-[#eef5f1] border border-[#a8d3b9] rounded-sm">
          <h4 className="text-xs font-mono text-[#2b6e4f] font-semibold uppercase mb-1">
            Balanced Double-Entry Journal Posted
          </h4>
          <p className="text-xs text-[#1c1b18] font-mono">
            Transaction ID: {postedResult.transaction_id} | Reference: {postedResult.reference} | Total Amount: ${(postedResult.amount_cents / 100).toFixed(2)} | Invariant: Debits = Credits
          </p>
        </div>
      )}
    </section>
  );
}
