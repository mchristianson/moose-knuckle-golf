'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/lib/actions/auth'
import { Icon } from '@/components/Icon'
import { UserCircleIcon } from '@heroicons/react/24/outline'

interface NavItem {
  href: string
  label: string
}

interface SiteHeaderProps {
  navItems: NavItem[]
  isLoggedIn: boolean
  isAdmin?: boolean
  avatarUrl?: string | null
}

export function SiteHeader({ navItems, isLoggedIn, isAdmin, avatarUrl }: SiteHeaderProps) {
  const pathname = usePathname()

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-zinc-900/85 backdrop-blur-xl border-zinc-800/60">
      <div className="container mx-auto px-4 py-3">
        {/* Outer row — relative so the absolute logo can centre within it */}
        <div className="relative flex items-center justify-between">

          {/* Mobile left: spacer (matches right-button width so logo stays centred) */}
          <div className="w-10 shrink-0 md:hidden" />

          {/* Logo — absolute centre on mobile, normal flow left on desktop */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:static md:translate-x-0 md:left-auto md:gap-3"
          >
            <Image
              src="/logo.png"
              alt="Moose Knuckle Golf League"
              width={44}
              height={44}
              className="rounded-full md:w-14 md:h-14"
              priority
            />
            {/* Mobile name */}
            <span className="font-bold text-white text-sm leading-tight md:hidden">
              Moose Knuckle
              <br />
              <span className="text-xs font-semibold text-zinc-400 tracking-wide">Golf League</span>
            </span>
            {/* Desktop name */}
            <span className="hidden md:block font-bold text-white text-lg leading-tight">
              Moose Knuckle
              <br />
              <span className="text-sm font-semibold text-zinc-400 tracking-wide">Golf League</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors relative pb-0.5 ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-green-500 after:rounded-full after:content-['']"
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <form action={signout}>
                <button
                  type="submit"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium bg-green-700 text-white px-4 py-1.5 rounded-full hover:bg-green-800 transition-colors"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile right: avatar button (auth'd) or login CTA (public) */}
          {isLoggedIn ? (
            <Link
              href="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full md:hidden shrink-0"
              aria-label="Profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  <Icon icon={UserCircleIcon} size="sm" className="text-zinc-400" />
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="md:hidden shrink-0 text-xs font-semibold bg-green-700 text-white px-3 py-1.5 rounded-full hover:bg-green-800 transition-colors"
            >
              Login
            </Link>
          )}

        </div>
      </div>
    </header>
  )
}
