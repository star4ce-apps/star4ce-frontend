'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, meApi, clearSession } from '@/lib/auth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    meApi(t)
      .then((r) => {
        if (r?.ok) setAllowed(true);
        else {
          clearSession();
          router.replace('/login');
        }
      })
      .catch(() => {
        clearSession();
        router.replace('/login');
      });
  }, [router]);

  if (!allowed) return null; // could show a spinner
  return <>{children}</>;
}
