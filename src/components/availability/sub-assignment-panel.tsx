'use client'

import { useState, useEffect, useTransition } from 'react'
import { assignSubToTeam, getSubOptions } from '@/lib/actions/subs'
import type { SubOption } from '@/lib/actions/subs'

interface SubAssignmentPanelProps {
  roundId: string
  teamId: string
  existingSubName?: string | null
  existingRoundSubId?: string | null
}

export function SubAssignmentPanel({
  roundId,
  teamId,
  existingSubName,
  existingRoundSubId,
}: SubAssignmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<SubOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOption, setSelectedOption] = useState<SubOption | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) return
    getSubOptions().then((res) => {
      if (res.error) {
        setLoadError(res.error)
      } else {
        setOptions(res.data ?? [])
      }
    })
  }, [isOpen])

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const subOptions = filtered.filter((o) => o.source === 'sub')
  const userOptions = filtered.filter((o) => o.source === 'user')

  const handleSave = () => {
    if (!selectedOption) return
    setSaveError(null)
    startTransition(async () => {
      const result = await assignSubToTeam(
        roundId,
        teamId,
        selectedOption.subId || '', // empty string when user has no subs row yet; real UUID for subs pool
        selectedOption.userId
      )
      if (result.error) {
        setSaveError(result.error)
      } else {
        setIsOpen(false)
        setSelectedOption(null)
        setSearchQuery('')
      }
    })
  }

  const handleRemove = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await assignSubToTeam(roundId, teamId, null, null, true)
      if (result.error) {
        setSaveError(result.error)
      }
    })
  }

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {existingSubName ? (
          <>
            <span className="text-sm text-purple-700 font-medium">
              Sub: {existingSubName}
            </span>
            <button
              onClick={() => setIsOpen(true)}
              disabled={isPending}
              className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
            >
              Change
            </button>
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              title="Remove sub assignment"
            >
              ✕ Remove
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            disabled={isPending}
            className="text-xs bg-purple-100 text-purple-800 px-3 py-1.5 rounded hover:bg-purple-200 font-medium disabled:opacity-50"
          >
            + Assign Sub
          </button>
        )}
        {saveError && <p className="text-xs text-red-600 w-full">{saveError}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search by name…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        autoFocus
      />

      {loadError && <p className="text-xs text-red-600">{loadError}</p>}

      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
        {subOptions.length > 0 && (
          <>
            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              Subs Pool
            </p>
            {subOptions.map((opt) => (
              <button
                key={opt.subId}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                  selectedOption?.subId === opt.subId && selectedOption?.source === opt.source
                    ? 'bg-purple-100 font-medium text-purple-900'
                    : 'text-gray-800'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </>
        )}

        {userOptions.length > 0 && (
          <>
            <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              League Members
            </p>
            {userOptions.map((opt) => (
              <button
                key={opt.userId}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                  selectedOption?.userId === opt.userId && selectedOption?.source === opt.source
                    ? 'bg-purple-100 font-medium text-purple-900'
                    : 'text-gray-800'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-gray-500 text-center">No results</p>
        )}
      </div>

      {saveError && <p className="text-xs text-red-600">{saveError}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!selectedOption || isPending}
          className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => {
            setIsOpen(false)
            setSelectedOption(null)
            setSearchQuery('')
            setSaveError(null)
          }}
          disabled={isPending}
          className="text-sm bg-gray-200 text-gray-700 px-4 py-1.5 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
