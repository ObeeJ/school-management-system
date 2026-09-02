'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

export function AiEngineSection() {
  const { activeTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const [patternName, setPatternName] = useState('Student At-Risk & Fee Default Detector');
  const [instructions, setInstructions] = useState(
    'Analyze student grade trajectory and tuition payment delays. Flag high risk students for administrative review.'
  );
  const [triggerRule, setTriggerRule] = useState('ON_PAYMENT_DEFAULT');

  const { data: patternsData } = useQuery({
    queryKey: ['ai-patterns', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/ai-engine/patterns', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to load AI patterns');
      return res.json();
    },
  });

  const createPatternMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:4000/ai-engine/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          pattern_name: patternName,
          system_instructions: instructions,
          trigger_rule: triggerRule,
        }),
      });
      if (!res.ok) throw new Error('Failed to create pattern');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-patterns', activeTenant.tenantId] });
    },
  });

  const patterns: any[] = patternsData?.data || [];

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="mb-6 pb-4 border-b border-[#e2ded4]">
        <span className="text-[11px] font-mono text-[#8a3a2a] uppercase tracking-wider block mb-1">
          AI Dataset RAG & Instruction Engine
        </span>
        <h2 className="font-serif text-lg font-semibold text-[#1c1b18]">
          Custom Pattern Rules & Institutional Intelligence
        </h2>
        <p className="text-xs text-[#57544d] mt-1">
          Define instructions and automated patterns over tenant datasets within context &apos;{activeTenant.tenantId}&apos;.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPatternMutation.mutate();
        }}
        className="space-y-4 bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Pattern Name</label>
            <input
              type="text"
              required
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Trigger Rule</label>
            <select
              value={triggerRule}
              onChange={(e) => setTriggerRule(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18]"
            >
              <option value="ON_PAYMENT_DEFAULT">On Fee Payment Default</option>
              <option value="ON_GRADE_DROP">On Grade Drop Below C Threshold</option>
              <option value="ON_ATTENDANCE_DROP">On Attendance &lt; 85%</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">System Prompt Instructions</label>
          <textarea
            rows={3}
            required
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-3 text-xs text-[#1c1b18] font-mono"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createPatternMutation.isPending}
            className="bg-[#24333c] hover:bg-[#1c2830] text-[#faf9f5] px-5 py-2 text-xs font-mono rounded-sm cursor-pointer transition-colors"
          >
            {createPatternMutation.isPending ? 'Configuring Pattern...' : 'Save AI Pattern Rule'}
          </button>
        </div>
      </form>

      {/* Pattern Rules List */}
      <h3 className="text-xs font-mono uppercase text-[#57544d] mb-3">Configured AI Patterns</h3>
      {patterns.length === 0 ? (
        <p className="text-xs text-[#57544d] font-mono">No AI pattern rules registered for tenant.</p>
      ) : (
        <div className="space-y-3">
          {patterns.map((p) => (
            <div key={p.id} className="p-4 bg-[#f2f0e9] border border-[#e2ded4] rounded-sm text-xs">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-serif font-semibold text-[#1c1b18]">{p.pattern_name}</h4>
                <span className="font-mono text-[10px] text-[#24333c] bg-[#faf9f5] px-2 py-0.5 border border-[#e2ded4] rounded-sm">
                  {p.trigger_rule}
                </span>
              </div>
              <p className="font-mono text-[#57544d] text-[11px]">{p.system_instructions}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
