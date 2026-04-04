'use client'

import { useState } from 'react'

interface CalendarSubscribeProps {
  webcalUrl: string
  calendarUrl: string
}

export function CalendarSubscribe({ webcalUrl, calendarUrl }: CalendarSubscribeProps) {
  const [showCopy, setShowCopy] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(calendarUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative flex items-center gap-3">
      <a
        href={webcalUrl}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-800 border border-zinc-700 rounded-full hover:bg-zinc-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        Subscribe to Calendar
      </a>

      <button
        onClick={() => setShowCopy(!showCopy)}
        className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        Google Cal
      </button>

      {showCopy && (
        <div className="absolute right-0 top-10 z-10 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-4 w-80">
          <p className="text-xs text-zinc-400 mb-3">
            In Google Calendar, go to <strong className="text-zinc-200">Settings → Add calendar → From URL</strong> and paste:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-zinc-900 border border-zinc-700 px-2 py-1.5 rounded-lg truncate text-zinc-300">
              {calendarUrl}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
