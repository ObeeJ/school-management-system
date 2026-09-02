'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function StripePaymentsSection() {
  const { activeTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'PAY_IN' | 'PAY_OUT'>('PAY_IN');
  const [amount, setAmount] = useState('1200.00');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('Fall Semester Tuition');
  const [recipientEmail, setRecipientEmail] = useState('teacher@oakwood.edu');
  const [idempotencyKey, setIdempotencyKey] = useState(`IK-PAY-${Date.now().toString().slice(-6)}`);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['payments-history', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/payments', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to load payments history');
      return res.json();
    },
  });

  const payInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:4000/payments/pay-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          amount_cents: Math.round(parseFloat(amount) * 100),
          currency,
          description,
        }),
      });
      if (!res.ok) throw new Error('Pay-in execution failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-history', activeTenant.tenantId] });
      setIdempotencyKey(`IK-PAY-${Date.now().toString().slice(-6)}`);
    },
  });

  const payOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:4000/payments/pay-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          amount_cents: Math.round(parseFloat(amount) * 100),
          currency,
          recipient_email: recipientEmail,
          description,
        }),
      });
      if (!res.ok) throw new Error('Pay-out execution failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-history', activeTenant.tenantId] });
      setIdempotencyKey(`IK-PAY-${Date.now().toString().slice(-6)}`);
    },
  });

  const payments: any[] = historyData?.data || [];

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e2ded4]">
        <div>
          <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
            Stripe Payment Gateway Engine (Pay-In & Pay-Out)
          </span>
          <h2 className="font-serif text-lg font-semibold text-[#1c1b18]">
            Tuition Collections & Payroll Disbursements
          </h2>
        </div>

        <div className="flex items-center gap-2 border border-[#e2ded4] rounded-sm bg-[#f2f0e9] p-1">
          <button
            onClick={() => setActiveTab('PAY_IN')}
            className={`px-3 py-1 text-xs font-mono rounded-sm transition-colors ${
              activeTab === 'PAY_IN' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d]'
            }`}
          >
            Pay-In (Tuition Collection)
          </button>
          <button
            onClick={() => setActiveTab('PAY_OUT')}
            className={`px-3 py-1 text-xs font-mono rounded-sm transition-colors ${
              activeTab === 'PAY_OUT' ? 'bg-[#24333c] text-[#faf9f5]' : 'text-[#57544d]'
            }`}
          >
            Pay-Out (Payroll/Vendor)
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (activeTab === 'PAY_IN') payInMutation.mutate();
          else payOutMutation.mutate();
        }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm mb-6"
      >
        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Idempotency Key</label>
          <input
            type="text"
            required
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs font-mono text-[#24333c]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Amount ($ USD / £ GBP)</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs font-mono text-[#1c1b18]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
          >
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {activeTab === 'PAY_OUT' ? (
          <div>
            <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Recipient Email</label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
            />
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
            />
          </div>
        )}

        <div className="md:col-span-4 flex justify-end mt-2">
          <button
            type="submit"
            disabled={payInMutation.isPending || payOutMutation.isPending}
            className="bg-[#24333c] hover:bg-[#1c2830] text-[#faf9f5] px-5 py-2 text-xs font-mono rounded-sm cursor-pointer transition-colors"
          >
            {activeTab === 'PAY_IN' ? 'Execute Stripe Pay-In' : 'Execute Stripe Pay-Out'}
          </button>
        </div>
      </form>

      {/* Payments History Table */}
      <h3 className="text-xs font-mono uppercase text-[#57544d] mb-3">Stripe Transaction History</h3>
      {isLoading ? (
        <div className="h-24 animate-skeleton rounded-sm" />
      ) : payments.length === 0 ? (
        <p className="text-xs text-[#57544d] font-mono">No payment transactions recorded for tenant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#e2ded4]">
            <thead>
              <tr className="bg-[#f2f0e9] border-b border-[#e2ded4]">
                <th className="px-4 py-2 text-xs font-mono text-[#57544d] uppercase">Type</th>
                <th className="px-4 py-2 text-xs font-mono text-[#57544d] uppercase">Idempotency Key</th>
                <th className="px-4 py-2 text-xs font-mono text-[#57544d] uppercase">Amount</th>
                <th className="px-4 py-2 text-xs font-mono text-[#57544d] uppercase">Stripe Intent ID</th>
                <th className="px-4 py-2 text-xs font-mono text-[#57544d] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ded4] text-xs font-mono">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#f2f0e9]/50">
                  <td className="px-4 py-2 text-[#24333c] font-semibold">{p.type}</td>
                  <td className="px-4 py-2 text-[#57544d]">{p.idempotency_key}</td>
                  <td className={`px-4 py-2 ${p.type === 'PAY_IN' ? 'text-[#2b6e4f]' : 'text-[#8a3a2a]'}`}>
                    ${(p.amount_cents / 100).toFixed(2)} {p.currency}
                  </td>
                  <td className="px-4 py-2 text-[#57544d]">{p.stripe_intent_id}</td>
                  <td className="px-4 py-2 text-[#24333c]">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
