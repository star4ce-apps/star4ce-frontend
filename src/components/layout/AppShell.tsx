"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "../nav/Footer";
import PageScripts from "../PageScripts";
import TopNav from "../nav/TopNav";
import { useUxAuditEnabled } from "@/lib/uxAuditFlag";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const uxAuditEnabled = useUxAuditEnabled();

  const isMarketingRoute =
    pathname === '/' ||
    pathname?.startsWith('/pricing') ||
    pathname?.startsWith('/choose-star4ce') ||
    pathname?.startsWith('/case-studies') ||
    pathname?.startsWith('/about') ||
    pathname?.startsWith('/privacy') ||
    pathname?.startsWith('/terms') ||
    pathname?.startsWith('/legal');

  // Dashboard pages have their own layout, so skip Footer
  const isDashboardPage = pathname?.startsWith('/dashboard') ||
                          pathname?.startsWith('/employees') ||
                          pathname?.startsWith('/history') ||
                          pathname?.startsWith('/analytics') ||
                          pathname?.startsWith('/candidates') ||
                          pathname?.startsWith('/standings') ||
                          pathname?.startsWith('/subscription') ||
                          pathname?.startsWith('/users') ||
                          pathname?.startsWith('/support') ||
                          pathname?.startsWith('/surveys') ||
                          pathname?.startsWith('/access-codes') ||
                          pathname?.startsWith('/settings') ||
                          (pathname?.startsWith('/admin') && !pathname?.startsWith('/admin-register') && !pathname?.startsWith('/admin-subscribe'));

  // Public survey entry: no TopNav (avoids admin nav when a manager is still logged in on a shared device).
  const isSurveyPage = pathname === '/survey';

  // Only show footer on home page
  const showFooter = pathname === '/';

  if (isDashboardPage) {
    return <>{children}</>;
  }

  if (isSurveyPage) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 min-h-0">{children}</main>
        <PageScripts />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <main className={`flex-1 ${uxAuditEnabled ? 'pt-[76px]' : 'pt-[110px]'}`}>{children}</main>
      {showFooter && <Footer />}
      <PageScripts />
    </div>
  );
}
