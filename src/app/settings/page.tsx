'use client';

import RequireAuth from '@/components/auth/RequireAuth';

export default function SettingsPage() {
  return (
    <RequireAuth>
      {/* your existing settings UI here */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-bold text-[#0B2E65] mb-4">
          Settings
        </h1>
        <p className="text-slate-600 mb-4">
          Manage your Star4ce account, company, and notification preferences.
        </p>
        {/* existing forms / toggles / etc. */}
      </div>
    </RequireAuth>
  );
}
