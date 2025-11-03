'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken, clearSession } from '@/lib/auth';

export default function TopNav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // using your current storage keys
    const token = getToken();
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
    if (token && storedEmail) setEmail(storedEmail);
    else setEmail(null);
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 md:px-0">
        <Link href="/" className="text-xl font-bold text-slate-900">
          Star4ce
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/choose-star4ce" className="text-slate-700 hover:text-slate-900">
            Choose Star4ce
          </Link>
          <Link href="/case-studies" className="text-slate-700 hover:text-slate-900">
            Case Studies
          </Link>

          {email ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700 hidden sm:inline">{email}</span>
              <button
                onClick={handleLogout}
                className="rounded bg-slate-800 px-3 py-1.5 text-white text-sm hover:bg-slate-900"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
