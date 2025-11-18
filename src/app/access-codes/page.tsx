// src/app/access-codes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
import { getToken } from '@/lib/auth';
import { postJsonAuth } from '@/lib/http';

type AccessCodeResponse = {
  ok: boolean;
  id: number;
  code: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

export default function AccessCodesPage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccessCodeResponse | null>(null);

  // Read role from localStorage so we only allow Admins
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      setRole(storedRole);
    }
  }, []);

  async function handleGenerate() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        setError('You are not logged in.');
        return;
      }

      // 7 days = 168 hours
      const data = await postJsonAuth<AccessCodeResponse>(
        '/survey/access-codes',
        { expires_in_hours: 168 },
        token
      );

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create access code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Optional: if we know the user is NOT admin, just show a message
  const isAdmin = role === 'admin';

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-0">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">
          Survey Access Codes
        </h1>

        {!isAdmin && role && (
          <p className="text-red-600 mb-4">
            Only Admin users can create survey access codes.
          </p>
        )}

        {!role && (
          <p className="text-slate-600 mb-4">
            Checking your permissions…
          </p>
        )}

        {isAdmin && (
          <div className="space-y-4 bg-white border rounded-lg p-6">
            <p className="text-sm text-slate-700">
              Generate a one-week survey access code for your dealership. You can
              send this code or the survey link to your employees.
            </p>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-[#0B2E65] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating code…' : 'Create 7-day access code'}
            </button>

            {result && (
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Code:</span>{' '}
                  <code className="bg-slate-100 px-2 py-1 rounded">
                    {result.code}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Survey link:</span>{' '}
                  <code className="bg-slate-100 px-2 py-1 rounded break-all">
                    {`http://localhost:3000/survey?code=${encodeURIComponent(result.code)}`}
                  </code>
                </div>
                {result.expires_at && (
                  <div>
                    <span className="font-semibold">Expires:</span>{' '}
                    {new Date(result.expires_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
