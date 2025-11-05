'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearSession } from '@/lib/auth';

type Props = { children: React.ReactNode; verify?: boolean };

export default function RequireAuth({ children, verify = true }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login?expired=1');
      return;
    }

    if (!verify) {
      setOk(true);
      return;
    }

    // Optional server verification
    const doVerify = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error('bad token');
        setOk(true);
      } catch {
        clearSession();
        router.replace('/login?expired=1');
      }
    };

    doVerify();
  }, [router, verify]);

  if (!ok) {
    return (
      <div className="mt-24 flex items-center justify-center text-slate-600">
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
