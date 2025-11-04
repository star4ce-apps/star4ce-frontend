import "./styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Star4ce - Better Hires, Fewer Exits",
  description: "Get your people analytics right the first time and maximize 3X dealership productivity faster than ever before. We are experts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
