'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, API_BASE } from '@/lib/auth';

type Props = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          // Corporate users must select an active dealership before using the app
          const role = data?.user?.role || data?.role || null;
          if (role === 'corporate') {
            const selectedId =
              typeof window !== 'undefined'
                ? localStorage.getItem('selected_dealership_id')
                : null;
            const onSelectPage = pathname?.startsWith('/corporate/select-dealership');
            if (!selectedId && !onSelectPage) {
              router.replace('/corporate/select-dealership');
              return;
            }
          }
          // User is authenticated and approved
          setOk(true);
        } else if (res.status === 403 && data.error === 'manager_not_approved') {
          // Manager not approved - allow access so they can see the waiting message
          setOk(true);
        } else if (res.status === 401 || res.status === 403) {
          // Token invalid, expired, or unauthorized - redirect to login
          router.replace('/login');
        } else {
          // Other error - allow access (page will handle it)
          setOk(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // On network error, check if we have a token - if yes, allow access
        if (token) {
          setOk(true);
        } else {
          router.replace('/login');
        }
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3B5998', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#64748B' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!ok) {
    return null;
  }

  return <>{children}</>;
}
