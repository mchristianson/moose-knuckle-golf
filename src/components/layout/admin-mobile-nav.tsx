'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/rounds", label: "Rounds" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/handicaps", label: "Handicaps" },
  { href: "/admin/subs", label: "Subs" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden overflow-x-auto border-t border-primary-dark">
      <div className="flex px-4 py-2 gap-1 min-w-max">
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-white text-primary"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
