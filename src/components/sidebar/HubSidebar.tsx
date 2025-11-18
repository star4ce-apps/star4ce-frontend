"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employee", label: "Employee Management", disabled: true },
  { href: "/candidate", label: "Candidate Management", disabled: true },
  { href: "/analytics", label: "Analytics" },
  { href: "/access-codes", label: "Access Codes" },
  { href: "/survey", label: "Survey" },
  { href: "/standings", label: "Dealership Standings" },
  { href: "/settings", label: "Settings" },
  { href: "/access-codes", label: "Access Codes" },
];

export default function HubSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-64 border-r bg-white">
      <div className="px-4 py-4 font-semibold text-blue-900">Star4ce Hub</div>
      <nav className="px-2 py-2 space-y-1">
        {items.map(i => (
          <Link
            key={i.href}
            href={i.disabled ? "#" : i.href}
            className={`block rounded px-3 py-2 text-sm ${pathname.startsWith(i.href) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"} ${i.disabled ? "pointer-events-none opacity-40" : ""}`}
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
