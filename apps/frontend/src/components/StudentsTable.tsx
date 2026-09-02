'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '../store/tenantStore';

interface Student {
  id: string;
  tenant_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  created_at: string;
}

export function StudentsTable() {
  const { activeTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const [studentCode, setStudentCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 10');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['students', activeTenant.tenantId],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/students', {
        headers: {
          'x-tenant-id': activeTenant.tenantId,
        },
      });
      if (!res.ok) throw new Error('Failed to load students for tenant context.');
      return res.json();
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:4000/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant.tenantId,
        },
        body: JSON.stringify({
          student_code: studentCode || `STU-${Math.floor(100 + Math.random() * 900)}`,
          first_name: firstName,
          last_name: lastName,
          grade_level: gradeLevel,
        }),
      });
      if (!res.ok) throw new Error('Failed to create student');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', activeTenant.tenantId] });
      setFirstName('');
      setLastName('');
      setStudentCode('');
    },
  });

  const students: Student[] = data?.data || [];

  return (
    <section className="bg-[#faf9f5] border border-[#e2ded4] rounded-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e2ded4]">
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#1c1b18]">
            Student Directory — {activeTenant.name}
          </h2>
          <p className="text-xs text-[#57544d]">
            Row-Level Security isolates records to tenant ID: &apos;{activeTenant.tenantId}&apos;
          </p>
        </div>
      </div>

      {/* Add Student Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (firstName && lastName) {
            addStudentMutation.mutate();
          }
        }}
        className="bg-[#f2f0e9] border border-[#e2ded4] p-4 rounded-sm mb-6 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Code</label>
          <input
            type="text"
            placeholder="OAK-102"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#24333c]"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">First Name</label>
          <input
            type="text"
            required
            placeholder="David"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#24333c]"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Last Name</label>
          <input
            type="text"
            required
            placeholder="Miller"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#24333c]"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] font-mono text-[#57544d] uppercase mb-1">Grade</label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full bg-[#faf9f5] border border-[#e2ded4] rounded-sm px-3 py-1.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#24333c]"
          >
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={addStudentMutation.isPending}
          className="bg-[#24333c] hover:bg-[#1c2830] text-[#faf9f5] px-4 py-1.5 text-xs font-mono rounded-sm cursor-pointer transition-colors"
        >
          {addStudentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
        </button>
      </form>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-8 w-full animate-skeleton rounded-sm" />
          <div className="h-8 w-full animate-skeleton rounded-sm" />
          <div className="h-8 w-full animate-skeleton rounded-sm" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 bg-[#fcedeb] border border-[#f5b8b2] text-[#8a3a2a] text-xs font-mono rounded-sm">
          Error loading tenant data: {(error as Error).message}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && students.length === 0 && (
        <div className="p-8 text-center bg-[#f2f0e9] border border-[#e2ded4] rounded-sm">
          <p className="text-sm font-semibold text-[#1c1b18]">No student records found in current tenant scope</p>
          <p className="text-xs text-[#57544d] mt-1">
            PostgreSQL RLS prevented cross-tenant leakage. Use the form above to add a student to &apos;{activeTenant.name}&apos;.
          </p>
        </div>
      )}

      {/* Table Data */}
      {!isLoading && !isError && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#e2ded4]">
            <thead>
              <tr className="bg-[#f2f0e9] border-b border-[#e2ded4]">
                <th className="px-4 py-2.5 text-xs font-mono text-[#57544d] uppercase">Code</th>
                <th className="px-4 py-2.5 text-xs font-mono text-[#57544d] uppercase">Full Name</th>
                <th className="px-4 py-2.5 text-xs font-mono text-[#57544d] uppercase">Grade</th>
                <th className="px-4 py-2.5 text-xs font-mono text-[#57544d] uppercase">Tenant Bound</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ded4] text-xs">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-[#f2f0e9]/50">
                  <td className="px-4 py-2.5 font-mono text-[#24333c]">{student.student_code}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1c1b18]">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-2.5 text-[#57544d]">{student.grade_level}</td>
                  <td className="px-4 py-2.5 font-mono text-[#8a3a2a]">{student.tenant_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
