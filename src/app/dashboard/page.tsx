'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';

type AnalyticsSummary = {
  ok: boolean;
  scope: string;
  dealership_id?: number;
  total_answers: number;
  total_responses: number;
  last_30_days: number;
  by_status: {
    'newly-hired': number;
    termination: number;
    leave: number;
    none: number;
  };
};

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<null | boolean>(null);

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Read email from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmail(localStorage.getItem('email') ?? null);
    }
  }, []);

  // Health check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json().catch(() => ({}));
        setApiOk(res.ok && !!data?.ok);
      } catch {
        setApiOk(false);
      }
    })();
  }, []);

  // Load analytics summary for dashboard tiles
  useEffect(() => {
    (async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        const token = getToken();
        if (!token) {
          setAnalyticsError('Not logged in.');
          setAnalyticsLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/analytics/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = (await res.json().catch(() => ({}))) as AnalyticsSummary | any;

        if (!res.ok) {
          throw new Error(data?.error || `Failed to load analytics (${res.status})`);
        }

        setAnalytics(data as AnalyticsSummary);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load analytics';
        setAnalyticsError(msg);
      } finally {
        setAnalyticsLoading(false);
      }
    })();
  }, []);

  const totalResponses = analytics?.total_responses ?? 0;
  const terminations = analytics?.by_status?.termination ?? 0;
  const last30 = analytics?.last_30_days ?? 0;

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
        {/* Backend status */}
        <div className="mb-4">
          <span className="text-sm">Backend:</span>{' '}
          {apiOk === null ? (
            <span className="text-slate-500">checking…</span>
          ) : apiOk ? (
            <span className="text-green-600 font-medium">online</span>
          ) : (
            <span className="text-red-600 font-medium">offline</span>
          )}
        </div>

        <div className="md:flex md:gap-6">
          <HubSidebar />

          <section className="flex-1 bg-white border rounded-lg p-6">
            <h1 className="text-xl font-semibold text-slate-900">
              {email ? `Welcome, ${email}` : 'Welcome'}
            </h1>
            <p className="mt-2 text-slate-600">
              Your survey performance and statistics at a glance.
            </p>

            {/* Analytics error / loading */}
            <div className="mt-4">
              {analyticsLoading && (
                <p className="text-sm text-slate-500">Loading analytics…</p>
              )}
              {analyticsError && (
                <p className="text-sm text-red-600">{analyticsError}</p>
              )}
            </div>

            {/* KPI tiles */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">
                  Total Survey Responses
                </div>
                <div className="text-2xl font-bold">{totalResponses}</div>
                <div className="text-slate-600 text-xs mt-1">
                  All-time for this dealership
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">
                  Termination Responses
                </div>
                <div className="text-2xl font-bold">{terminations}</div>
                <div className="text-slate-600 text-xs mt-1">
                  Employees who selected “Termination”
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-slate-500 mb-1">
                  Last 30 Days
                </div>
                <div className="text-2xl font-bold">{last30}</div>
                <div className="text-slate-600 text-xs mt-1">
                  New responses in the last 30 days
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}
