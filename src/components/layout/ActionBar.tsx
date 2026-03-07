'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ActionBarProps {
  scoreUrl?: string
  statusUrl?: string
}

export function ActionBar({ scoreUrl = '/scores', statusUrl = '/availability' }: ActionBarProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* Action Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 shadow-lg md:hidden z-40">
        <div className="flex h-16">
          <Link
            href={scoreUrl}
            className="flex-1 flex items-center justify-center text-sm font-medium text-primary hover:bg-neutral-50 transition-colors active:bg-neutral-100"
          >
            <span className="text-lg mr-1">📊</span>
            Score
          </Link>
          <Link
            href={statusUrl}
            className="flex-1 flex items-center justify-center text-sm font-medium text-secondary hover:bg-neutral-50 transition-colors active:bg-neutral-100 border-l border-r border-neutral-100"
          >
            <span className="text-lg mr-1">ℹ️</span>
            Status
          </Link>
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex-1 flex items-center justify-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors active:bg-neutral-100"
          >
            <span className="text-lg mr-1">⋯</span>
            More
          </button>
        </div>

        {/* More Menu Dropdown */}
        {showMore && (
          <div className="absolute bottom-16 right-0 left-0 bg-white border-t border-neutral-100 shadow-lg">
            <nav className="flex flex-col">
              <Link
                href="/dashboard"
                className="px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 border-b border-neutral-100 active:bg-neutral-100"
                onClick={() => setShowMore(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/manual"
                className="px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 border-b border-neutral-100 active:bg-neutral-100"
                onClick={() => setShowMore(false)}
              >
                Manual
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100"
                onClick={() => setShowMore(false)}
              >
                Leaderboard
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Spacer to prevent content from hiding under action bar */}
      <div className="h-16 md:hidden" />
    </>
  )
}
