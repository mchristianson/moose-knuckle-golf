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
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-50 border-r p-4 hidden md:block">
      <nav className="space-y-2">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-md transition-colors
                ${isActive
                  ? 'bg-green-100 text-green-900 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
