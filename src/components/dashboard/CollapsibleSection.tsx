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
    <div className="mb-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-md p-md rounded-lg hover:bg-neutral-50 transition-colors active:bg-neutral-100"
        aria-expanded={isOpen}
      >
        <h2 className="text-h2 flex items-center gap-2">
          <span>{isOpen ? '▼' : '▶'}</span>
          <span>{title}</span>
          {count > 0 && (
            <span className="text-small font-normal text-neutral-700">
              ({count})
            </span>
          )}
        </h2>
      </button>

      {isOpen && (
        <div className="mt-md space-y-md animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
