'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE } from '@/lib/auth';

type SummaryResponse = {
  ok: boolean;
  scope: 'admin' | 'corporate';
  dealership_id?: number;
  total_answers: number;
  total_dealerships?: number;
  message?: string;
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('star4ce_token')
            : null;

        if (!token) {
          setError('Missing session token.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/analytics/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg =
            json?.error ||
            (res.status === 403
              ? 'You do not have permission to view analytics.'
              : 'Could not load analytics.');
          setError(msg);
        } else {
          setData(json as SummaryResponse);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load analytics.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0 md:flex md:gap-6">
        <HubSidebar />
        <section className="flex-1 bg-white border rounded-lg p-6">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Analytics Overview
          </h1>
          <p className="text-slate-600 mb-4">
            High-level view of survey activity for your scope.
          </p>

          {loading && (
            <div className="text-slate-500 text-sm">
              Loading analytics…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {data.scope === 'corporate' && (
                <div className="rounded-lg border p-4">
                  <div className="text-xs font-medium text-slate-500 uppercase">
                    Total Dealerships
                  </div>
                  <div className="text-2xl font-bold">
                    {data.total_dealerships ?? 0}
                  </div>
                </div>
              )}

              <div className="rounded-lg border p-4">
                <div className="text-xs font-medium text-slate-500 uppercase">
                  Total Survey Responses
                </div>
                <div className="text-2xl font-bold">
                  {data.total_answers}
                </div>
                {data.message && (
                  <p className="mt-2 text-xs text-slate-500">
                    {data.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </RequireAuth>
  );
}
