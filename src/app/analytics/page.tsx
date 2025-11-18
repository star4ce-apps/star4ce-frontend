'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { createSurveyAccessCode, type AccessCodeResponse } from '@/lib/survey';

type SummaryResponse = {
  ok: boolean;
  scope: 'admin' | 'corporate';
  total_dealerships?: number;
  total_answers: number;
  dealership_id?: number;
  message?: string;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const token = getToken();
        if (!token) {
          setSummaryError('Not signed in.');
          setSummaryLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/analytics/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 403) {
            setSummaryError('You do not have permission to view analytics.');
          } else {
            setSummaryError(data.error || 'Failed to load analytics summary.');
          }
          setSummaryLoading(false);
          return;
        }

        setSummary(data as SummaryResponse);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to load analytics summary.';
        setSummaryError(msg);
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">
          Analytics & Survey Access
        </h1>

        {/* Summary Card */}
        <div className="mb-6 rounded-lg border bg-white p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Overview
          </h2>

          {summaryLoading && (
            <p className="text-slate-500 text-sm">Loading summary…</p>
          )}

          {summaryError && (
            <p className="text-red-600 text-sm">{summaryError}</p>
          )}

          {!summaryLoading && !summaryError && summary && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium">Scope:</span>{' '}
                {summary.scope === 'corporate' ? 'Corporate (all dealerships)' : 'Admin (your dealership)'}
              </p>
              {summary.scope === 'corporate' && (
                <p>
                  <span className="font-medium">Total dealerships:</span>{' '}
                  {summary.total_dealerships ?? 0}
                </p>
              )}
              <p>
                <span className="font-medium">Total survey responses:</span>{' '}
                {summary.total_answers}
              </p>
              {summary.message && (
                <p className="text-slate-500">{summary.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
