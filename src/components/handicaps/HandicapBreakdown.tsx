interface Score {
  score_id: string
  round_date: string
  gross_score: number
  is_makeup: boolean
  used_for_handicap: boolean
}

interface Props {
  scores: Score[]
  scoresToUse: number
  currentHandicap?: number | null
  dark?: boolean
}

const PAR = 36

export function HandicapBreakdown({ scores, scoresToUse, currentHandicap, dark = false }: Props) {
  if (scores.length === 0) {
    return (
      <p className={`text-sm text-center py-4 ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>
        No eligible scores yet.
      </p>
    )
  }

  const sorted = [...scores].sort(
    (a, b) => new Date(b.round_date).getTime() - new Date(a.round_date).getTime()
  )

  const usedScores = scores.filter(s => s.used_for_handicap)
  const avgUsed = usedScores.length > 0
    ? usedScores.reduce((sum, s) => sum + s.gross_score, 0) / usedScores.length
    : 0
  const computed = Math.round(Math.max(0, avgUsed - PAR) * 10) / 10

  const th = dark
    ? 'px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500'
    : 'px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500'
  const trBase = dark ? 'border-t border-zinc-700' : 'border-t border-gray-100'

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={th}>Date</th>
            <th className={`${th} text-center`}>Gross</th>
            <th className={`${th} text-center`}>+/- Par</th>
            <th className={`${th} text-center`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => {
            const vsPar = s.gross_score - PAR
            const dateStr = new Date(s.round_date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            return (
              <tr key={s.score_id} className={trBase}>
                <td className={`px-3 py-2 ${dark ? 'text-zinc-300' : 'text-gray-700'}`}>
                  {dateStr}
                  {s.is_makeup && (
                    <span className={`ml-1.5 text-[10px] px-1 py-0.5 rounded ${dark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>
                      Makeup
                    </span>
                  )}
                </td>
                <td className={`px-3 py-2 text-center font-bold ${dark ? 'text-zinc-200' : 'text-gray-800'}`}>
                  {s.gross_score}
                </td>
                <td className={`px-3 py-2 text-center ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {vsPar >= 0 ? `+${vsPar}` : vsPar}
                </td>
                <td className="px-3 py-2 text-center">
                  {s.used_for_handicap ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      ✓ Used
                    </span>
                  ) : (
                    <span className={`text-xs ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Calculation summary */}
      <div className={`mt-3 px-3 py-2.5 rounded-lg text-xs ${dark ? 'bg-zinc-700/50 text-zinc-400' : 'bg-gray-50 text-gray-500'}`}>
        Best <span className={`font-bold ${dark ? 'text-zinc-200' : 'text-gray-700'}`}>{scoresToUse}</span> of{' '}
        <span className={`font-bold ${dark ? 'text-zinc-200' : 'text-gray-700'}`}>{scores.length}</span> scores
        {' → '} avg <span className={`font-bold ${dark ? 'text-zinc-200' : 'text-gray-700'}`}>{avgUsed.toFixed(1)}</span>
        {' → '} {avgUsed.toFixed(1)} − {PAR} = <span className={`font-bold ${dark ? 'text-green-400' : 'text-green-700'}`}>{computed}</span>
        {currentHandicap !== null && currentHandicap !== undefined && Math.abs(computed - currentHandicap) > 0.15 && (
          <span className={`ml-2 ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>(current: {currentHandicap})</span>
        )}
      </div>
    </div>
  )
}
