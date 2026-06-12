'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { getHandicapBreakdown } from '@/lib/actions/scores'
import { HandicapBreakdown } from './HandicapBreakdown'
import { SetHandicapForm } from './set-handicap-form'
import { SetTeeAdjustmentForm } from './SetTeeAdjustmentForm'

interface Player {
  id: string
  full_name: string
  handicaps: { current_handicap: number; rounds_played: number; last_calculated_at: string; is_manual_override: boolean; tee_adjustment: number } | null
}

type Breakdown = Awaited<ReturnType<typeof getHandicapBreakdown>>

export function HandicapPlayerList({ players }: { players: Player[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [breakdowns, setBreakdowns] = useState<Record<string, Breakdown>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function togglePlayer(userId: string) {
    if (expandedId === userId) {
      setExpandedId(null)
      return
    }
    setExpandedId(userId)
    if (!breakdowns[userId]) {
      setLoading(userId)
      const data = await getHandicapBreakdown(userId)
      setBreakdowns(prev => ({ ...prev, [userId]: data }))
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"></th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Player</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Handicap</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Rounds</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Set</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const h = Array.isArray(p.handicaps) ? (p.handicaps as any)[0] : p.handicaps
            const isExpanded = expandedId === p.id
            const breakdown = breakdowns[p.id]
            const isLoading = loading === p.id

            return (
              <>
                <tr
                  key={p.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => togglePlayer(p.id)}
                >
                  <td className="px-4 py-3 text-gray-400">
                    {isExpanded
                      ? <ChevronUpIcon className="w-4 h-4" />
                      : <ChevronDownIcon className="w-4 h-4" />
                    }
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {p.full_name}
                    {h?.is_manual_override && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold">
                    {h ? h.current_handicap : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {h?.rounds_played ?? 0}
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <SetHandicapForm userId={p.id} currentHandicap={h?.current_handicap ?? 0} />
                      <SetTeeAdjustmentForm userId={p.id} currentAdjustment={h?.tee_adjustment ?? 0} />
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${p.id}-breakdown`}>
                    <td colSpan={5} className="bg-gray-50 border-t px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Handicap Calculation — {p.full_name}
                      </p>
                      {isLoading ? (
                        <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          Loading…
                        </div>
                      ) : breakdown ? (
                        <HandicapBreakdown
                          scores={breakdown.scores}
                          scoresToUse={breakdown.scoresToUse}
                          currentHandicap={h?.current_handicap}
                          teeAdjustment={breakdown.teeAdjustment}
                        />
                      ) : null}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
