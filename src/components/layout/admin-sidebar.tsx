'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/teams", label: "Teams", icon: "⛳" },
  { href: "/admin/rounds", label: "Rounds", icon: "📅" },
  { href: "/admin/handicaps", label: "Handicaps", icon: "🎯" },
  { href: "/admin/subs", label: "Subs", icon: "👥" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "📝" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/admin-manual", label: "Admin Manual", icon: "📖" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-50 border-r border-neutral-100 p-md hidden md:block">
      <nav className="space-y-xs">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-md py-2 rounded-lg transition-all
                ${isActive
                  ? 'bg-primary text-white font-semibold border-l-4 border-l-primary'
                  : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200'
                }
              `}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
