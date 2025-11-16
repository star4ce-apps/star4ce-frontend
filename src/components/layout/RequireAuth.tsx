'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearSession, API_BASE } from '@/lib/auth';

type Props = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = getToken();

      // No token at all -> send to login
      if (!token) {
        clearSession();
        router.replace('/login?expired=1');
        return;
      }

      try {
        // IMPORTANT: call backend using API_BASE from auth.ts
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Token invalid / unverified / expired -> logout
          clearSession();
          router.replace('/login?expired=1');
          return;
        }

        if (!cancelled) {
          setChecking(false);
        }
      } catch (err) {
        // Network error -> treat as logged out for now
        clearSession();
        router.replace('/login?expired=1');
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
