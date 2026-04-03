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
    <div className="relative flex items-center gap-2">
      <a
        href={webcalUrl}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        Subscribe to Calendar
      </a>

      <button
        onClick={() => setShowCopy(!showCopy)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Google Cal
      </button>

      {showCopy && (
        <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-80">
          <p className="text-xs text-gray-500 mb-2">
            In Google Calendar, go to <strong>Settings → Add calendar → From URL</strong> and paste:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded truncate text-gray-700">
              {calendarUrl}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
