"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { clearSession } from "@/lib/auth";

// Icon components
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const EmployeeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CandidateIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const PerformanceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const SurveyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StandingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SubscriptionIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

export default function HubSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    clearSession();
    setShowUserMenu(false);
    router.push('/login');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmail(localStorage.getItem('email') ?? null);
      const storedEmail = localStorage.getItem('email');
      if (storedEmail) {
        const emailParts = storedEmail.split('@')[0].split('.');
        const firstName = emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || 'User';
        const lastName = emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || '';
        setName(`${firstName} ${lastName}`.trim() || 'User');
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const mainMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      label: 'Employee Management',
      icon: <EmployeeIcon />,
      children: [
        { label: 'Employee List', href: '/employees' },
        { label: 'Performance Review', href: '/employees/performance' },
        { label: 'Role History', href: '/employees/history' },
      ],
    },
    {
      label: 'Candidate Management',
      icon: <CandidateIcon />,
      children: [
        { label: 'Candidate List', href: '/candidates' },
        { label: 'Score a Candidate', href: '/candidates/score' },
        { label: 'Score Card Editor', href: '/candidates/scorecard' },
      ],
    },
  ];

  const analyticsItems: MenuItem[] = [
    { label: 'Our Performance', href: '/analytics', icon: <PerformanceIcon /> },
    { label: 'Survey', href: '/surveys', icon: <SurveyIcon /> },
    { label: 'Dealership Standings', href: '/standings', icon: <StandingsIcon /> },
  ];

  const paymentItems: MenuItem[] = [
    { label: 'Subscription', href: '/subscription', icon: <SubscriptionIcon /> },
  ];

  const isActive = (href?: string) => href && pathname === href;

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0" style={{ backgroundColor: '#EDEDED', overflow: 'hidden' }}>
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: '#D1D5DB' }}>
        <div className="flex items-center gap-2">
          <span className="text-[#0B2E65] italic font-bold text-xl">Star</span>
          <span className="text-[#e74c3c] italic font-bold text-xl">4ce</span>
        </div>
      </div>

      {/* MAIN MENU */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: '#394B67' }}>MAIN MENU</h3>
        <nav className="space-y-0.5">
          {mainMenuItems.map((item, idx) => (
            <div key={idx}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: isActive(item.href) ? '#4D6DBE' : 'transparent',
                    color: isActive(item.href) ? '#FFFFFF' : '#394B67',
                  }}
                >
                  <span style={{ color: isActive(item.href) ? '#FFFFFF' : '#394B67' }}>
                    {item.icon}
                  </span>
                  <span className="text-left">{item.label}</span>
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap text-left" style={{ color: '#394B67' }}>
                    <span style={{ color: '#394B67' }}>{item.icon}</span>
                    <span className="text-left">{item.label}</span>
                  </div>
                  {item.children && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child, childIdx) => (
                        <Link
                          key={childIdx}
                          href={child.href}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap text-left ${
                            isActive(child.href)
                              ? 'text-white'
                              : ''
                          }`}
                          style={{
                            backgroundColor: isActive(child.href) ? '#4D6DBE' : 'transparent',
                            color: isActive(child.href) ? '#FFFFFF' : '#394B67',
                          }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ANALYTICS */}
      <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: '#D1D5DB' }}>
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: '#394B67' }}>ANALYTICS</h3>
        <nav className="space-y-1">
          {analyticsItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href || '#'}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(item.href)
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: isActive(item.href) ? '#4D6DBE' : 'transparent',
                color: isActive(item.href) ? '#FFFFFF' : '#394B67',
              }}
            >
              <span style={{ color: isActive(item.href) ? '#FFFFFF' : '#394B67' }}>
                {item.icon}
              </span>
              <span className="text-left">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* PAYMENT */}
      <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: '#D1D5DB' }}>
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: '#394B67' }}>PAYMENT</h3>
        <nav className="space-y-1">
          {paymentItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href || '#'}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(item.href)
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: isActive(item.href) ? '#4D6DBE' : 'transparent',
                color: isActive(item.href) ? '#FFFFFF' : '#394B67',
              }}
            >
              <span style={{ color: isActive(item.href) ? '#FFFFFF' : '#394B67' }}>
                {item.icon}
              </span>
              <span className="text-left">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="mt-auto px-4 pb-4 border-t pt-4 relative" style={{ borderColor: '#D1D5DB' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D1D5DB' }}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#394B67' }}>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate whitespace-nowrap text-left" style={{ color: '#394B67' }}>{name || 'User'}</p>
            <p className="text-xs truncate whitespace-nowrap text-left" style={{ color: '#394B67' }}>{email || 'No email'}</p>
          </div>
          <div className="relative user-menu-container">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ color: '#394B67' }}
              className="hover:opacity-70 transition-opacity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {showUserMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  href="/users"
                  onClick={() => setShowUserMenu(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive('/users')
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: isActive('/users') ? '#4D6DBE' : 'transparent',
                    color: isActive('/users') ? '#FFFFFF' : '#394B67',
                  }}
                >
                  <span style={{ color: isActive('/users') ? '#FFFFFF' : '#394B67' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <span className="text-left">User Management</span>
                </Link>
                <Link
                  href="/support"
                  onClick={() => setShowUserMenu(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive('/support')
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: isActive('/support') ? '#4D6DBE' : 'transparent',
                    color: isActive('/support') ? '#FFFFFF' : '#394B67',
                  }}
                >
                  <span style={{ color: isActive('/support') ? '#FFFFFF' : '#394B67' }}>
                    <HelpIcon />
                  </span>
                  <span className="text-left">Help & Support</span>
                </Link>
                <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '4px', marginBottom: '4px' }}></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap w-full text-left hover:bg-gray-50"
                  style={{
                    color: '#DC2626',
                  }}
                >
                  <span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
