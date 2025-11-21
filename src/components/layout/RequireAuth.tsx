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
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // Token invalid / unverified / expired -> logout
          clearSession();
          // Only show expired message if it's actually expired, not network errors
          if (data.error === 'token expired' || res.status === 401) {
            router.replace('/login?expired=1');
          } else {
            router.replace('/login');
          }
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!data.ok) {
          clearSession();
          router.replace('/login');
          return;
        }

        if (!cancelled) {
          setChecking(false);
        }
      } catch (err) {
        // Network error - don't logout immediately, might be temporary
        console.error('Auth check failed:', err);
        
        // Handle timeout/abort errors
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
          console.error('Auth check timed out - backend may be slow or unreachable');
          // Show error but allow access (user can still try to use the app)
          if (!cancelled) {
            setChecking(false);
          }
          return;
        }
        
        // Handle any other errors - don't block the user
        if (!cancelled) {
          setChecking(false);
        }
        
        // Only logout if it's clearly an auth error, not a network issue
        if (err instanceof TypeError && err.message.includes('fetch')) {
          // Network error - keep session but show error
          if (!cancelled) {
            setChecking(false);
          }
        } else {
          clearSession();
          router.replace('/login');
        }
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
