'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 py-2 rounded-lg transition-colors"
        aria-expanded={isOpen}
      >
        <h2 className="text-white text-base font-semibold flex items-center gap-2">
          <span className="text-zinc-500">{isOpen ? '▼' : '▶'}</span>
          <span>{title}</span>
          {count > 0 && (
            <span className="text-zinc-400 text-sm font-normal">({count})</span>
          )}
        </h2>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
