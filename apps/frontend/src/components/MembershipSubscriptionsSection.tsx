'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function MembershipSubscriptionsSection() {
  const { activeTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<string>('PLAN_GROWTH');
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelImmediately, setCancelImmediately] = useState<boolean>(false);

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/subscriptions/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      return res.json();
    },
  });

  const { data: currentSubData, isLoading: isSubLoading } = useQuery({
    queryKey: ['current-subscription', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/subscriptions/current', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to load current subscription');
      return res.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch('http://localhost:4000/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          plan_id: planId,
          auto_debit: true,
        }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription', activeTenant.tenantId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:4000/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          cancel_immediately: cancelImmediately,
        }),
      });
      if (!res.ok) throw new Error('Cancellation failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription', activeTenant.tenantId] });
      setCancelModalOpen(false);
    },
  });

  const plans: any[] = plansData?.data || [];
  const currentSub = currentSubData?.data;

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="mb-6 pb-4 border-b border-[#e2ded4] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
            Membership Billing & Auto-Debit Engine (ChatGPT Subscription Model)
          </span>
          <h2 className="font-serif text-lg font-semibold text-[#1c1b18]">
            School Tier Subscriptions & Auto-Debit Recurring Billing
          </h2>
        </div>

        {/* Current Active Plan Badge */}
        {currentSub && (
          <div className="bg-[#f2f0e9] border border-[#e2ded4] p-3 rounded-sm text-xs font-mono">
            <span className="text-[#57544d]">Active Plan:</span>{' '}
            <strong className="text-[#24333c]">{currentSub.plan_name || currentSub.plan_id}</strong>
            <div className="mt-1 flex items-center gap-3 text-[11px]">
              <span className={currentSub.auto_debit_enabled ? 'text-[#2b6e4f]' : 'text-[#8a3a2a]'}>
                {currentSub.auto_debit_enabled ? 'Auto-Debit Active' : 'Auto-Debit Disabled'}
              </span>
              {currentSub.cancel_at_period_end && (
                <span className="text-[#8a3a2a]">Cancels at end of cycle</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ChatGPT-Style Membership Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrent = currentSub?.plan_id === plan.id;
          return (
            <div
              key={plan.id}
              className={`p-6 border rounded-sm flex flex-col justify-between ${
                isCurrent ? 'bg-[#f2f0e9] border-[#24333c]' : 'bg-[#faf9f5] border-[#e2ded4]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif font-semibold text-[#1c1b18]">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-mono uppercase bg-[#24333c] text-[#faf9f5] px-2 py-0.5 rounded-sm">
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="font-serif text-2xl font-semibold text-[#1c1b18]">
                    ${(plan.price_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-xs font-mono text-[#57544d]"> / month</span>
                </div>

                <ul className="space-y-2 text-xs text-[#57544d] mb-6">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#24333c] font-mono">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => subscribeMutation.mutate(plan.id)}
                disabled={isCurrent || subscribeMutation.isPending}
                className={`w-full py-2 text-xs font-mono rounded-sm transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#e2ded4] text-[#57544d] cursor-not-allowed'
                    : 'bg-[#24333c] hover:bg-[#1c2830] text-[#faf9f5]'
                }`}
              >
                {isCurrent
                  ? 'Active Membership'
                  : subscribeMutation.isPending
                  ? 'Processing Auto-Debit...'
                  : `Subscribe (${plan.auto_debit_required ? 'Auto-Debit' : 'Free'})`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cancellation Management (ChatGPT Model) */}
      <div className="bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-serif font-semibold text-[#1c1b18] text-sm">Membership Cancellation Policy</h4>
          <p className="text-xs text-[#57544d] mt-0.5">
            Mirroring ChatGPT: Cancel anytime. If canceled at period end, features remain active until your renewal date with zero future charges.
          </p>
        </div>

        <button
          onClick={() => setCancelModalOpen(true)}
          className="px-4 py-2 border border-[#8a3a2a] text-[#8a3a2a] hover:bg-[#fcedeb] text-xs font-mono rounded-sm cursor-pointer transition-colors whitespace-nowrap"
        >
          Cancel Subscription
        </button>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 max-w-md w-full">
            <h3 className="font-serif text-lg font-semibold text-[#1c1b18] mb-2">Cancel Membership Subscription</h3>
            <p className="text-xs text-[#57544d] mb-4">
              Select how you would like to proceed with cancellation for tenant &apos;{activeTenant.name}&apos;:
            </p>

            <div className="space-y-3 mb-6 text-xs font-mono">
              <label className="flex items-start gap-3 p-3 bg-[#f2f0e9] border border-[#e2ded4] rounded-sm cursor-pointer">
                <input
                  type="radio"
                  name="cancelType"
                  checked={!cancelImmediately}
                  onChange={() => setCancelImmediately(false)}
                  className="mt-0.5"
                />
                <div>
                  <strong className="block text-[#1c1b18]">Cancel at End of Billing Period (Recommended - ChatGPT Model)</strong>
                  <span className="text-[#57544d] text-[11px]">
                    Retain full tier features until end of current 30-day billing cycle. Auto-debit renewal will be disabled.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#f2f0e9] border border-[#e2ded4] rounded-sm cursor-pointer">
                <input
                  type="radio"
                  name="cancelType"
                  checked={cancelImmediately}
                  onChange={() => setCancelImmediately(true)}
                  className="mt-0.5"
                />
                <div>
                  <strong className="block text-[#8a3a2a]">Cancel Immediately</strong>
                  <span className="text-[#57544d] text-[11px]">
                    Instantly terminate membership access and downgrade account to Free Starter tier.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-1.5 border border-[#e2ded4] text-xs font-mono rounded-sm"
              >
                Keep Membership
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-1.5 bg-[#8a3a2a] text-[#faf9f5] text-xs font-mono rounded-sm"
              >
                {cancelMutation.isPending ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
