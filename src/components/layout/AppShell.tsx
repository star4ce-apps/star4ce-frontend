"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "../nav/Footer";
import PageScripts from "../PageScripts";
import TopNav from "../nav/TopNav";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Dashboard pages have their own layout, so skip Footer
  const isDashboardPage = pathname?.startsWith('/dashboard') ||
                          pathname?.startsWith('/employees') ||
                          pathname?.startsWith('/analytics') ||
                          pathname?.startsWith('/candidates') ||
                          pathname?.startsWith('/standings') ||
                          pathname?.startsWith('/subscription') ||
                          pathname?.startsWith('/users') ||
                          pathname?.startsWith('/support') ||
                          pathname?.startsWith('/surveys') ||
                          pathname?.startsWith('/access-codes') ||
                          pathname?.startsWith('/settings') ||
                          (pathname?.startsWith('/admin') && !pathname?.startsWith('/admin-register'));

  // Survey page: no footer, no padding
  const isSurveyPage = pathname === '/survey';

  // Only show footer on home page
  const showFooter = pathname === '/';

  if (isDashboardPage) {
    return <>{children}</>;
  }

  if (isSurveyPage) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <TopNav />
        <main className="flex-1 pt-[110px]">{children}</main>
        <PageScripts />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <main className="flex-1 pt-[110px]">{children}</main>
      {showFooter && <Footer />}
      <PageScripts />
    </div>
  );
}
