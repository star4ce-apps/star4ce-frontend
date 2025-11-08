'use client';

import RequireAuth from '@/components/auth/RequireAuth';

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      {/* your existing analytics UI here */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-bold text-[#0B2E65] mb-4">
          Analytics
        </h1>
        <p className="text-slate-600">
          View insights, trends, and performance across your dealerships.
        </p>
        {/* keep all your existing charts/cards/tables below */}
      </div>
    </RequireAuth>
  );
}
