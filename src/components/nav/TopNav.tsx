'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearSession } from '@/lib/auth';

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="fixed w-full top-0 z-[1000] shadow-md">
      {/* Utility Bar */}
      <div className="bg-[#0B2E65] text-white py-2">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex justify-between items-center">
            <div></div>
            <div className="flex items-center gap-6 text-sm">
              <button className="cursor-pointer p-1 text-white">
                <img src="/images/search.png" alt="Search" className="w-5 h-5" />
              </button>
              <Link href="#" className="text-white hover:underline font-medium">Support</Link>
              <button className="flex items-center gap-1 cursor-pointer text-white">
                <img src="/images/language.png" alt="Language" className="w-5 h-5" />
              </button>
              <span className="text-white/70">|</span>
              <Link href={email ? "/dashboard" : "/login"} className="text-white hover:underline">
                {email ? email : "Login / Register"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-[#f5f5f5] py-3">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center hover:scale-[1.02] transition-transform">
              <img src="/images/Logo 4.png" alt="Star4ce" className="h-12 md:h-[50px] w-auto" />
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              <Link href="/#about" className="text-[#0B2E65] font-bold text-[0.95rem] hover:text-[#2c5aa0] transition-colors">
                About Us
              </Link>
              <Link href="/choose-star4ce" className="text-[#0B2E65] font-bold text-[0.95rem] hover:text-[#2c5aa0] transition-colors">
                Choose Star4ce
              </Link>
              <Link href="/case-studies" className="text-[#0B2E65] font-bold text-[0.95rem] hover:text-[#2c5aa0] transition-colors">
                Case Studies
              </Link>
              <Link href="/survey" className="text-[#0B2E65] font-bold text-[0.95rem] hover:text-[#2c5aa0] transition-colors">
                Survey
              </Link>
            </nav>

            <button
              className="md:hidden text-[#0B2E65] text-2xl font-bold p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>

            <Link
              href="#contact"
              className="hidden md:block bg-[#e74c3c] text-white px-5 py-2.5 rounded uppercase text-sm font-bold hover:bg-[#c0392b] transition-all hover:-translate-y-0.5"
            >
              BOOK NOW
            </Link>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 md:hidden">
                <div className="flex flex-col py-4">
                  <Link href="/#about" className="px-8 py-4 text-[#0B2E65] font-bold hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    About Us
                  </Link>
                  <Link href="/choose-star4ce" className="px-8 py-4 text-[#0B2E65] font-bold hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    Choose Star4ce
                  </Link>
                  <Link href="/case-studies" className="px-8 py-4 text-[#0B2E65] font-bold hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    Case Studies
                  </Link>
                  <Link href="/survey" className="px-8 py-4 text-[#0B2E65] font-bold hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    Survey
                  </Link>
                  <div className="px-8 py-4">
                    <Link
                      href="#contact"
                      className="block bg-[#e74c3c] text-white px-5 py-2.5 rounded text-center uppercase text-sm font-bold hover:bg-[#c0392b]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      BOOK NOW
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
