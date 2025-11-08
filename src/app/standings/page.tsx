'use client';

import RequireAuth from '@/components/auth/RequireAuth';

export default function StandingsPage() {
  return (
    <RequireAuth>
      {/* your existing standings UI here */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-bold text-[#0B2E65] mb-4">
          Standings
        </h1>
        <p className="text-slate-600">
          Track dealer, team, or individual performance rankings here.
        </p>
        {/* existing tables / cards / charts below */}
      </div>
    </RequireAuth>
  );
}
