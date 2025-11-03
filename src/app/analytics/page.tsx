'use client';
import RequireAuth from '@/components/RequireAuth';

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Our Performance</h1>
        <p className="mt-2 text-slate-700">Placeholder analytics. (Protected)</p>
      </div>
    </RequireAuth>
  );
}
