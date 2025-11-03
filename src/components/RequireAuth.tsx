'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, meApi, clearSession } from '@/lib/auth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login?expired=1');
      return;
    }
    meApi(token)
      .then((r) => {
        if (r?.ok) setOk(true);
        else {
          clearSession();
          router.replace('/login?expired=1');
        }
      })
      .catch(() => {
        clearSession();
        router.replace('/login?expired=1');
      });
  }, [router]);

  if (!ok) return null; // could show spinner
  return <>{children}</>;
}
