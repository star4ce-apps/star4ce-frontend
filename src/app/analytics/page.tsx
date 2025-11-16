'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';

type Summary =
  | {
      ok: true;
      scope: 'admin';
      dealership_id: number;
      total_answers: number;
    }
  | {
      ok: true;
      scope: 'corporate';
      total_dealerships: number;
      total_answers: number;
    };

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          setError('You are not logged in.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/analytics/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) {
          setError('Analytics are only available to Admin users for each dealership.');
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(`Failed to load analytics (${res.status})`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setSummary(data as Summary);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Could not reach analytics service.');
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Analytics</h1>

        {loading && (
          <p className="text-slate-600 text-sm">Loading analytics…</p>
        )}

        {!loading && error && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <div className="space-y-4">
            {summary.scope === 'admin' && (
              <div className="rounded-lg border p-4 bg-white">
                <h2 className="text-lg font-medium text-slate-900">
                  Dealership Analytics
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Dealership ID: {summary.dealership_id}
                </p>
                <p className="text-3xl font-bold mt-4">
                  {summary.total_answers}
                </p>
                <p className="text-slate-600 text-sm">Total survey responses</p>
              </div>
            )}

            {summary.scope === 'corporate' && (
              <div className="rounded-lg border p-4 bg-white">
                <h2 className="text-lg font-medium text-slate-900">
                  Corporate Analytics (placeholder)
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Total dealerships: {summary.total_dealerships}
                </p>
                <p className="text-3xl font-bold mt-4">
                  {summary.total_answers}
                </p>
                <p className="text-slate-600 text-sm">Total survey responses</p>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
