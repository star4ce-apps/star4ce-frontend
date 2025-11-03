"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/choose-star4ce", label: "Choose Star4ce" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/pricing", label: "Book Now" },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white font-black tracking-wide">★</span>
          <span>Star4ce</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-blue-700 ${pathname===l.href ? "text-blue-700 font-semibold" : "text-slate-700"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="text-slate-700 hover:text-blue-700">Login / Register</Link>
        </nav>
      </div>
    </header>
  );
}
