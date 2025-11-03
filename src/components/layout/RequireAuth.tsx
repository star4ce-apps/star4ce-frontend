'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      router.replace('/login');
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-slate-700">Checking session…</p>
      </div>
    );
  }
  return <>{children}</>;
}
