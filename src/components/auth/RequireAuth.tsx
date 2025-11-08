'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearSession, meApi } from '@/lib/auth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) {
        router.replace('/login?expired=1');
        return;
      }

      try {
        const me = await meApi(token);

        // if backend returns something like { ok: true } or user info,
        // we treat it as valid. Adjust condition if needed.
        if (!me || me.error) {
          clearSession();
          router.replace('/login?expired=1');
          return;
        }
      } catch {
        clearSession();
        router.replace('/login?expired=1');
        return;
      }

      setChecking(false);
    };

    check();
  }, [router]);

  if (checking) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="text-[#0B2E65] text-sm font-medium">
          Checking your session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
