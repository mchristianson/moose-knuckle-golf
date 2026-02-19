'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signout } from '@/lib/actions/auth'

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
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        {/* Desktop: logo left, nav right | Mobile: logo centered, hamburger right */}
        <div className="flex items-center justify-between">
          {/* Hamburger (mobile only) — keeps logo centered via flex */}
          <div className="w-10 md:hidden" />

          {/* Logo — centered on mobile, left on desktop */}
          <Link href="/" className="flex items-center gap-3 mx-auto md:mx-0">
            <Image
              src="/logo.png"
              alt="Moose Knuckle Golf League"
              width={56}
              height={56}
              className="rounded-full"
              priority
            />
            <span className="font-bold text-green-800 text-lg leading-tight hidden sm:block">
              Moose Knuckle<br />
              <span className="text-sm font-semibold text-green-600 tracking-wide">Golf League</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <form action={signout}>
                <button
                  type="submit"
                  className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors"
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

          {/* Mobile hamburger button */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="md:hidden mt-3 pb-2 border-t pt-3 flex flex-col gap-1">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2 py-2.5 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <form action={signout} className="mt-1">
                <button
                  type="submit"
                  className="w-full text-left px-2 py-2.5 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="mt-1 px-2 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 rounded-md transition-colors"
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
