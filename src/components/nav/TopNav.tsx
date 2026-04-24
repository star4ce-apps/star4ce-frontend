'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearSession } from '@/lib/auth';
import Image from "next/image";
import Logo from "@/components/Logo";
import { isRegistrationEnabled } from "@/lib/registration";
import { useUxAuditEnabled } from '@/lib/uxAuditFlag';

export default function TopNav()
{
  const router = useRouter();
  const pathname = usePathname();
  const uxAuditEnabled = useUxAuditEnabled();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Re-check on route changes AND when window regains focus or storage changes
  useEffect(() =>
  {
    const check = () =>
    {
      const token = getToken();
      const storedEmail = typeof window !== 'undefined'
        ? localStorage.getItem('email')
        : null;
      setEmail(token && storedEmail ? storedEmail : null);
    };

    check(); // run immediately
    window.addEventListener('focus', check);
    window.addEventListener('storage', check);
    return () =>
    {
      window.removeEventListener('focus', check);
      window.removeEventListener('storage', check);
    };
  }, [pathname]); // route change triggers a re-check

  function handleLogout()
  {
    clearSession();
    router.push('/login');
  }

  // UX audit: single marketing header (no utility bar) for all non-dashboard routes.
  // (Dashboard routes don't render TopNav via AppShell; survey route doesn't render TopNav either.)
  if (uxAuditEnabled) {
    return (
      <header className="fixed w-full top-0 z-[1000] shadow-md bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="h-[76px] flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center hover:scale-[1.02] transition-transform flex-shrink-0">
              <Logo size="lg" />
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
              <Link
                href="/"
                className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                  pathname === '/' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                }`}
              >
                Home
              </Link>
              <Link
                href="/choose-star4ce"
                className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                  pathname === '/choose-star4ce' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                }`}
              >
                Choose Star4ce
              </Link>
              <Link
                href="/case-studies"
                className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                  pathname === '/case-studies' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                }`}
              >
                Case Studies
              </Link>
              <Link
                href="/pricing"
                className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                  pathname === '/pricing' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                }`}
              >
                Pricing
              </Link>
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0">
              {email ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <Link href="/dashboard" className="text-xs font-medium text-slate-700 hover:underline">
                      {email}
                    </Link>
                    <span className="text-slate-300">|</span>
                    <button onClick={handleLogout} className="cursor-pointer text-xs font-medium text-slate-700 hover:underline">
                      Logout
                    </button>
                  </div>
                  <Link
                    href="/dashboard"
                    className="hidden lg:block cursor-pointer bg-[#0B2E65] text-white px-4 py-2 rounded uppercase font-bold hover:bg-[#2c5aa0] transition-colors whitespace-nowrap shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block cursor-pointer text-[#0B2E65] font-semibold hover:underline whitespace-nowrap">
                    Login
                  </Link>
                  {isRegistrationEnabled() ? (
                    <Link href="/register" className="hidden sm:block cursor-pointer text-[#0B2E65] font-semibold hover:underline whitespace-nowrap">
                      Register
                    </Link>
                  ) : null}
                  <Link
                    href="/pricing"
                    className="hidden lg:block cursor-pointer bg-[#0B2E65] text-white px-4 py-2 rounded uppercase font-bold hover:bg-[#2c5aa0] transition-colors whitespace-nowrap shadow-sm"
                  >
                    Explore Plans
                  </Link>
                </>
              )}

              <button
                className="cursor-pointer lg:hidden text-[#0B2E65] text-2xl font-bold p-2 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-slate-200 lg:hidden">
              <div className="flex flex-col py-2">
                <Link href="/" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link href="/choose-star4ce" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                  Choose Star4ce
                </Link>
                <Link href="/case-studies" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                  Case Studies
                </Link>
                <Link href="/pricing" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Link>
                <div className="border-t border-slate-200 my-2" />
                {email ? (
                  <>
                    <Link href="/dashboard" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="cursor-pointer px-4 py-3 text-left text-red-600 font-semibold hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                    {isRegistrationEnabled() ? (
                      <Link href="/register" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                        Register
                      </Link>
                    ) : null}
                    <Link href="/pricing" className="px-4 py-3 text-[#0B2E65] font-semibold hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>
                      Explore Plans
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    );
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

              <Link href="/support" className="cursor-pointer text-white hover:underline font-medium">
                Support
              </Link>

              <button className="flex items-center gap-1 cursor-pointer text-white">
                <img src="/images/language.png" alt="Language" className="w-5 h-5" />
              </button>

              <span className="text-white/70">|</span>

              {email ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="cursor-pointer text-white hover:underline">
                    {email}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer rounded bg-white/10 px-3 py-1 text-white text-sm hover:bg-white/20"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="cursor-pointer text-white hover:underline">
                    Login
                  </Link>
                  {isRegistrationEnabled() ? (
                    <>
                      <span className="text-white/70">/</span>
                      <Link href="/register" className="cursor-pointer text-white hover:underline">
                        Register
                      </Link>
                    </>
                  ) : null}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-[#f5f5f5] py-4">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex justify-between items-center gap-4">
            <Link href="/" className="flex items-center hover:scale-[1.02] transition-transform flex-shrink-0">
              <Logo size="lg" />
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 flex-wrap">
              {email ? (
                <>
                  <Link 
                    href="/" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/dashboard' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/employees" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/employees' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Employees
                  </Link>
                  <Link 
                    href="/analytics" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/analytics' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Analytics
                  </Link>
                  <Link 
                    href="/access-codes" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/access-codes' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Access Codes
                  </Link>
                  <Link 
                    href="/survey" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/survey' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Take survey
                  </Link>
                  <Link 
                    href="/subscription" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/subscription' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Subscription
                  </Link>
                  <Link 
                    href="/standings" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/standings' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Standings
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/choose-star4ce" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/choose-star4ce' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Choose Star4ce
                  </Link>
                  <Link 
                    href="/case-studies" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/case-studies' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Case Studies
                  </Link>
                  <Link 
                    href="/survey" 
                    className={`cursor-pointer text-[#0B2E65] font-bold whitespace-nowrap hover:text-[#2c5aa0] transition-colors ${
                      pathname === '/survey' ? 'text-[#2c5aa0] border-b-2 border-[#2c5aa0] pb-1' : ''
                    }`}
                  >
                    Take survey
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/pricing"
                className="hidden lg:block cursor-pointer bg-[#e74c3c] text-white px-4 py-2 rounded uppercase font-bold hover:bg-[#c0392b] transition-colors whitespace-nowrap"
              >
                BOOK NOW
              </Link>
              <button
                className="cursor-pointer lg:hidden text-[#0B2E65] text-2xl font-bold p-2 hover:bg-gray-200 rounded transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>


            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 lg:hidden z-50">
                <div className="flex flex-col py-2 max-h-[80vh] overflow-y-auto">
                  {email ? (
                    <>
                      <Link 
                        href="/" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/dashboard' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/employees" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/employees' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Employees
                      </Link>
                      <Link 
                        href="/analytics" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/analytics' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Analytics
                      </Link>
                      <Link 
                        href="/access-codes" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/access-codes' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Access Codes
                      </Link>
                      <Link 
                        href="/survey" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/survey' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Take survey
                      </Link>
                      <Link 
                        href="/subscription" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/subscription' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Subscription
                      </Link>
                      <Link 
                        href="/standings" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/standings' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Standings
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="cursor-pointer px-6 py-3 text-left text-red-600 font-semibold hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        href="/choose-star4ce" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/choose-star4ce' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Choose Star4ce
                      </Link>
                      <Link 
                        href="/case-studies" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/case-studies' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Case Studies
                      </Link>
                      <Link 
                        href="/survey" 
                        className={`px-6 py-3 text-[#0B2E65] font-semibold hover:bg-gray-50 transition-colors ${
                          pathname === '/survey' ? 'bg-blue-50 text-[#2c5aa0] border-l-4 border-[#2c5aa0]' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Take survey
                      </Link>
                      <div className="px-6 py-4 border-t border-gray-200 mt-2">
                        <Link
                          href="/pricing"
                          className="cursor-pointer block bg-[#e74c3c] text-white px-5 py-2.5 rounded text-center uppercase font-bold hover:bg-[#c0392b] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          BOOK NOW
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
