'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearSession } from '@/lib/auth';

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  // Re-check on route changes AND when window regains focus or storage changes
  useEffect(() => {
    const check = () => {
      const token = getToken();
      const storedEmail = typeof window !== 'undefined'
        ? localStorage.getItem('email')
        : null;
      setEmail(token && storedEmail ? storedEmail : null);
    };

    check(); // run immediately
    window.addEventListener('focus', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('focus', check);
      window.removeEventListener('storage', check);
    };
  }, [pathname]); // route change triggers a re-check

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
                className="cursor-pointer rounded bg-slate-800 px-3 py-1.5 text-white text-sm hover:bg-slate-900"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
