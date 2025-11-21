// src/app/access-codes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { postJsonAuth } from '@/lib/http';

type AccessCodeItem = {
  id: number;
  code: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

type AccessCodeCreateResponse = {
  ok: boolean;
  id: number;
  code: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

export default function AccessCodesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AccessCodeCreateResponse | null>(null);
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);

  // Read role from localStorage so we only allow Admins
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      setRole(storedRole);
    }
  }, []);

  const isAdmin = role === 'admin';

  async function loadCodes() {
    setLoadingList(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('You are not logged in.');
        setCodes([]);
        return;
      }

      const res = await fetch(`${API_BASE}/survey/access-codes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({})) as {
        ok?: boolean;
        items?: AccessCodeItem[];
        error?: string;
      };

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Failed to load access codes (${res.status})`);
      }

      setCodes(data.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load access codes';
      setError(msg);
    } finally {
      setLoadingList(false);
    }
  }

  // Once we know user is admin, load existing codes
  useEffect(() => {
    if (isAdmin) {
      loadCodes();
    }
  }, [isAdmin]);

  async function handleGenerate() {
    setError(null);
    setResult(null);
    setLoadingCreate(true);

    try {
      // 7 days = 168 hours
      const data = await postJsonAuth<AccessCodeCreateResponse>(
        '/survey/access-codes',
        { expires_in_hours: 168 }
      );

      setResult(data);
      // refresh list to include new code at top
      await loadCodes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create access code';
      setError(msg);
    } finally {
      setLoadingCreate(false);
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">
          Survey Access Codes
        </h1>

        {!role && (
          <p className="text-slate-600 mb-4">
            Checking your permissions…
          </p>
        )}

        {role && !isAdmin && (
          <p className="text-red-600 mb-4">
            Only Admin users can create and manage survey access codes.
          </p>
        )}

        {isAdmin && (
          <div className="space-y-6 bg-white border rounded-lg p-6">
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-sm text-slate-700">
              Generate a one-week survey access code for your dealership.
              You can send this code or the survey link to your employees.
            </p>

            <button
              onClick={handleGenerate}
              disabled={loadingCreate}
              className="cursor-pointer inline-flex items-center rounded-md bg-[#0B2E65] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingCreate ? 'Creating code…' : 'Create 7-day access code'}
            </button>

            {result && (
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Latest code:</span>{' '}
                  <code className="bg-slate-100 px-2 py-1 rounded">
                    {result.code}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Survey link:</span>{' '}
                  <code className="bg-slate-100 px-2 py-1 rounded break-all">
                    {typeof window !== 'undefined' 
                      ? `${window.location.origin}/survey?code=${encodeURIComponent(result.code)}`
                      : `/survey?code=${encodeURIComponent(result.code)}`}
                  </code>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  Your access codes
                </h2>
                <button
                  onClick={loadCodes}
                  disabled={loadingList}
                  className="cursor-pointer text-xs text-[#0B2E65] hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingList ? 'Refreshing…' : 'Refresh list'}
                </button>
              </div>

              {loadingList && codes.length === 0 && (
                <p className="text-sm text-slate-500">Loading access codes…</p>
              )}

              {!loadingList && codes.length === 0 && (
                <p className="text-sm text-slate-500">
                  No access codes yet. Create your first code above.
                </p>
              )}

              {codes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-slate-200 rounded-md overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Code</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Created</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Expires</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Survey link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map(c => {
                        const created = new Date(c.created_at).toLocaleString();
                        const expires = c.expires_at
                          ? new Date(c.expires_at).toLocaleString()
                          : 'No expiry';

                        const isExpired =
                          !!c.expires_at &&
                          new Date(c.expires_at).getTime() < Date.now();

                        const status = !c.is_active
                          ? 'Inactive'
                          : isExpired
                          ? 'Expired'
                          : 'Active';

                        return (
                          <tr key={c.id} className="border-t border-slate-200">
                            <td className="px-3 py-2 font-mono">{c.code}</td>
                            <td className="px-3 py-2">{created}</td>
                            <td className="px-3 py-2">{expires}</td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  status === 'Active'
                                    ? 'text-emerald-700'
                                    : status === 'Expired'
                                    ? 'text-amber-700'
                                    : 'text-slate-500'
                                }
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <code className="bg-slate-100 px-2 py-1 rounded break-all">
                                {typeof window !== 'undefined'
                                  ? `${window.location.origin}/survey?code=${encodeURIComponent(c.code)}`
                                  : `/survey?code=${encodeURIComponent(c.code)}`}
                              </code>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
