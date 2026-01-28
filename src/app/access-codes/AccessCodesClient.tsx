// src/app/access-codes/AccessCodesClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE, getToken } from '@/lib/auth';
import { postJsonAuth } from '@/lib/http';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    900: '#0F172A',
  }
};

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

export default function AccessCodesClient() {
  const search = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AccessCodeCreateResponse | null>(null);
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);
  const [copiedCodeId, setCopiedCodeId] = useState<number | 'latest' | null>(null);
  const [testerCode, setTesterCode] = useState<string | null>(null);
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerError, setTesterError] = useState<string | null>(null);

  const frontendBase =
    typeof window !== 'undefined' ? window.location.origin : '';
  const testerMode = search.get('tester') === 'true';
  const testerEmail = search.get('email') || '';

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

  // Load codes if user has view permission
  useEffect(() => {
    if (role) {
      loadCodes();
    }
  }, [role]);

  useEffect(() => {
    if (!testerMode || !testerEmail) return;
    const loadTesterCode = async () => {
      setTesterLoading(true);
      setTesterError(null);
      try {
        const res = await fetch(`${API_BASE}/survey/dev-latest-access-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testerEmail }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load access code');
        }
        setTesterCode(data.code || null);
      } catch (err: unknown) {
        setTesterError(
          err instanceof Error ? err.message : 'Failed to load access code'
        );
      } finally {
        setTesterLoading(false);
      }
    };
    loadTesterCode();
  }, [testerMode, testerEmail]);

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

  async function handleCopy(text: string, target: number | 'latest') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodeId(target);
      setTimeout(() => setCopiedCodeId(null), 1500);
    } catch {
      setError('Copy failed. Please select and copy manually.');
    }
  }

  if (testerMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: COLORS.gray[50] }}>
        <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2" style={{ color: COLORS.gray[900] }}>
            Tester Access Code
          </h1>
          <p className="text-sm mb-4" style={{ color: COLORS.gray[500] }}>
            Use this code to access the survey.
          </p>
          {!testerEmail && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              Missing email. Add <code>email=you@example.com</code> to the URL.
            </div>
          )}
          {testerError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {testerError}
            </div>
          )}
          {testerLoading && (
            <p className="text-sm" style={{ color: COLORS.gray[500] }}>Loading code…</p>
          )}
          {!testerLoading && testerCode && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Access Code</div>
                <div className="mt-1 font-mono text-2xl text-slate-900">{testerCode}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(testerCode, 'latest')}
                className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {copiedCodeId === 'latest' ? 'Copied' : 'Copy code'}
              </button>
            </div>
          )}
          {!testerLoading && !testerCode && testerEmail && !testerError && (
            <p className="text-sm" style={{ color: COLORS.gray[500] }}>
              No active access code found for this email.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Access Codes</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Generate and manage survey access codes for your dealership
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-5xl">

        {!role && (
          <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <p className="text-base" style={{ color: '#6B7280' }}>
              Checking your permissions…
            </p>
          </div>
        )}

        {role && role !== 'admin' && role !== 'manager' && role !== 'corporate' && (
          <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-base" style={{ color: '#DC2626' }}>
              You do not have permission to create and manage survey access codes.
            </p>
          </div>
        )}

        {(isAdmin || role === 'manager' || role === 'corporate') && (
          <div className="space-y-6 rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-base" style={{ color: '#374151' }}>
              Generate a one-week survey access code for your dealership.
              You can send this code or the survey link to your employees.
            </p>

            <button
              onClick={handleGenerate}
              disabled={loadingCreate}
              className="cursor-pointer inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#4D6DBE',
              }}
              onMouseEnter={(e) => {
                if (!loadingCreate) e.currentTarget.style.backgroundColor = '#3d5a9e';
              }}
              onMouseLeave={(e) => {
                if (!loadingCreate) e.currentTarget.style.backgroundColor = '#4D6DBE';
              }}
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
                    {`${frontendBase}/survey?code=${encodeURIComponent(result.code)}`}
                  </code>
                </div>
              </div>
            )}

            <div className="pt-6 mt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
              {codes.length > 0 && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Latest access code</div>
                      <div className="mt-1 font-mono text-lg text-slate-900">{codes[0].code}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {`Survey link: ${frontendBase}/survey?code=${encodeURIComponent(codes[0].code)}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(codes[0].code, 'latest')}
                      className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {copiedCodeId === 'latest' ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#232E40' }}>
                  Your access codes
                </h2>
                <button
                  onClick={loadCodes}
                  disabled={loadingList}
                  className="cursor-pointer text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:underline"
                  style={{ color: '#4D6DBE' }}
                >
                  {loadingList ? 'Refreshing…' : 'Refresh list'}
                </button>
              </div>

              {loadingList && codes.length === 0 && (
                <p className="text-sm" style={{ color: '#6B7280' }}>Loading access codes…</p>
              )}

              {!loadingList && codes.length === 0 && (
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  No access codes yet. Create your first code above.
                </p>
              )}

              {codes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                    <thead style={{ backgroundColor: '#F9FAFB' }}>
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Code</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Created</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Expires</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Status</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Survey link</th>
                        <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Copy</th>
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
                          <tr key={c.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                            <td className="px-4 py-3 font-mono" style={{ color: '#232E40' }}>{c.code}</td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>{created}</td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>{expires}</td>
                            <td className="px-4 py-3">
                              <span
                                style={{
                                  color: status === 'Active'
                                    ? '#059669'
                                    : status === 'Expired'
                                    ? '#D97706'
                                    : '#6B7280'
                                }}
                                className="font-medium"
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <code className="px-2 py-1 rounded break-all" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                                {`${frontendBase}/survey?code=${encodeURIComponent(c.code)}`}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => handleCopy(c.code, c.id)}
                                className="cursor-pointer text-xs font-semibold text-[#4D6DBE] hover:underline"
                              >
                                {copiedCodeId === c.id ? 'Copied' : 'Copy'}
                              </button>
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
        </main>
      </div>
    </RequireAuth>
  );
}
