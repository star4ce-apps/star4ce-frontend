"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import TopNav from "../nav/TopNav";
import Footer from "../nav/Footer";
import PageScripts from "../PageScripts";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Dashboard pages have their own layout, so skip TopNav/Footer
  // Note: /admin-register should show TopNav (it's a registration page, not a dashboard)
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
  
  // Survey page should not have footer and should not have padding
  const isSurveyPage = pathname === '/survey';
  
  // Only show footer on home page
  const showFooter = pathname === '/';
  
  if (isDashboardPage) {
    return <>{children}</>;
  }

  // Survey page has TopNav but no footer and no padding
  if (isSurveyPage) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <TopNav />
        <main className="flex-1">{children}</main>
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
