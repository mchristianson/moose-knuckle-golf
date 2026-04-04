'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signout } from '@/lib/actions/auth'
import { Icon } from '@/components/Icon'
import { Bars3Icon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline'

interface NavItem {
  href: string
  label: string
}

interface SiteHeaderProps {
  navItems: NavItem[]
  isLoggedIn: boolean
  isAdmin?: boolean
}

export function SiteHeader({ navItems, isLoggedIn, isAdmin }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="border-b bg-zinc-900 border-zinc-800">
      <div className="container mx-auto px-4 py-3">
        {/* Outer row — relative so the absolute logo can centre within it */}
        <div className="relative flex items-center justify-between">

          {/* Mobile left: spacer (matches right-buttons width so logo stays centred) */}
          <div className="w-20 shrink-0 md:hidden" />

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
            {/* Mobile name (white) */}
            <span className="font-bold text-white text-sm leading-tight md:hidden">
              Moose Knuckle
              <br />
              <span className="text-xs font-semibold text-zinc-400 tracking-wide">Golf League</span>
            </span>
            {/* Desktop name (green) */}
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
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <form action={signout}>
                <button
                  type="submit"
                  className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
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

          {/* Mobile right: Bell + Hamburger */}
          <div className="flex items-center gap-1 shrink-0 md:hidden">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-zinc-800"
              aria-label="Notifications"
            >
              <Icon icon={BellIcon} size="sm" />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-zinc-800"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <Icon icon={XMarkIcon} size="sm" /> : <Icon icon={Bars3Icon} size="sm" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="md:hidden mt-3 pb-2 border-t border-zinc-700 pt-3 flex flex-col gap-1">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <form action={signout} className="mt-1">
                <button
                  type="submit"
                  className="w-full text-left px-2 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  Logout
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="mt-1 px-2 py-2.5 text-sm font-medium text-green-400 hover:bg-zinc-800 rounded-md transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
