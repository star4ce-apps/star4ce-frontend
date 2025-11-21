"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employee Management" },
  { href: "/analytics", label: "Analytics" },
  { href: "/access-codes", label: "Access Codes" },
  { href: "/survey", label: "Survey" },
  { href: "/subscription", label: "Subscription" },
  { href: "/standings", label: "Dealership Standings", disabled: true },
  { href: "/settings", label: "Settings", disabled: true },
];

export default function HubSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-64 border-r bg-white">
      <div className="px-4 py-4 font-semibold text-blue-900">Star4ce Hub</div>
      <nav className="px-2 py-2 space-y-1">
        {items.map((i, index) => (
          i.disabled ? (
            <span
              key={`${i.href}-${index}`}
              className="block rounded px-3 py-2 text-sm text-slate-700 pointer-events-none opacity-40"
            >
              {i.label}
            </span>
          ) : (
            <Link
              key={`${i.href}-${index}`}
              href={i.href}
              className={`block rounded px-3 py-2 text-sm ${pathname.startsWith(i.href) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
            >
              {i.label}
            </Link>
          )
        ))}
      </nav>
    </aside>
  );
}
