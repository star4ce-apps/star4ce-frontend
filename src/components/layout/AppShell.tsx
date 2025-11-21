"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import TopNav from "../nav/TopNav";
import PageScripts from "../PageScripts";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Dashboard pages have their own layout, so skip TopNav/Footer
  const isDashboardPage = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/employees') ||
                          pathname?.startsWith('/analytics') ||
                          pathname?.startsWith('/candidates') ||
                          pathname?.startsWith('/standings') ||
                          pathname?.startsWith('/subscription') ||
                          pathname?.startsWith('/settings') ||
                          pathname?.startsWith('/users') ||
                          pathname?.startsWith('/support') ||
                          pathname?.startsWith('/surveys');
  
  if (isDashboardPage) {
    return <>{children}</>;
  }

  if (isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <main className="flex-1 pt-[120px]">{children}</main>
      <PageScripts />
    </div>
  );
}
