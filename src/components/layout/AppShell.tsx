"use client";
import { ReactNode } from "react";
import TopNav from "../nav/TopNav";
import Footer from "../nav/Footer";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
