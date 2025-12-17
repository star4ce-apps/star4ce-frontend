'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, API_BASE } from '@/lib/auth';

type Props = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
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

        if (res.ok) {
          const data = await res.json();
          // Check if user is approved (for managers)
          if (data.error === 'manager_not_approved' || data.is_approved === false) {
            // Allow access but the page will show approval pending message
            setOk(true);
          } else {
            setOk(true);
          }
        } else {
          // Token invalid or expired
          router.replace('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

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
