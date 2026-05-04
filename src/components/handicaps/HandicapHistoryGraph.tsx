interface HistoryPoint {
  handicap_value: number
  created_at: string
  calculation_method: string
}

interface Props {
  history: HistoryPoint[]
}

export function HandicapHistoryGraph({ history }: Props) {
  if (history.length < 2) return null

  const W = 300
  const H = 64
  const padX = 4
  const padY = 6

  const values = history.map(h => h.handicap_value)
  const min = Math.max(0, Math.min(...values) - 1)
  const max = Math.max(...values) + 1
  const range = max - min || 1

  const pts = history.map((h, i) => {
    const x = (i / (history.length - 1)) * (W - padX * 2) + padX
    // Higher handicap = higher on chart (not inverted — handicap going down is improvement)
    const y = H - padY - ((h.handicap_value - min) / range) * (H - padY * 2)
    return { x, y, h }
  })

  const linePath = pts.map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`
  const last = pts[pts.length - 1]

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Handicap Trend</p>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="hcpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B4D2E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1B4D2E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hcpGrad)" />
        <path d={linePath} fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots: filled = calculated, open = manual */}
        {pts.map(({ x, y, h }, i) => (
          h.calculation_method === 'manual' ? (
            <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="#18181b" stroke="#1B4D2E" strokeWidth="1.5" />
          ) : (
            <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill="#1B4D2E" />
          )
        ))}
        {/* Latest value label */}
        <text
          x={(last.x - 2).toFixed(1)}
          y={(last.y - 7).toFixed(1)}
          fill="#4ade80"
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
        >
          {last.h.handicap_value}
        </text>
      </svg>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-zinc-600">
          {new Date(history[0].created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
        </span>
        <span className="text-[9px] text-zinc-600">
          {new Date(history[history.length - 1].created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
