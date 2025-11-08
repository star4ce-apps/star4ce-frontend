'use client';
import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/auth/RequireAuth';
import { getJson } from '@/lib/http';

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<null | boolean>(null);

  useEffect(() => {
    setEmail(localStorage.getItem('email') ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getJson<{ ok: boolean; service: string }>('/health');
        setApiOk(!!data?.ok);
      } catch {
        setApiOk(false);
      }
    })();
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
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
            <p className="mt-2 text-slate-600">Your performance and statistics at a glance.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">406</div>
                <div className="text-slate-600 text-sm">Total Employees</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">90</div>
                <div className="text-slate-600 text-sm">Terminated/Quit</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold">65.2%</div>
                <div className="text-slate-600 text-sm">Turnover Rate</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}
