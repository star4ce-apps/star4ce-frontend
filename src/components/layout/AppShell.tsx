"use client";
import { ReactNode } from "react";
import TopNav from "../nav/TopNav";
import Footer from "../nav/Footer";
import PageScripts from "../PageScripts";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <main className="flex-1 pt-[120px]">{children}</main>
      <Footer />
      <PageScripts />
    </div>
  );
}
