'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/Button'
import { linkGoogleAccount, unlinkGoogleAccount } from '@/lib/actions/auth'
import { updateAvatar, removeAvatar } from '@/lib/actions/profile'
import { HandicapBreakdown } from '@/components/handicaps/HandicapBreakdown'
import { HandicapHistoryGraph } from '@/components/handicaps/HandicapHistoryGraph'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function posLabel(p: number) {
  if (p === 1) return '🥇'
  if (p === 2) return '🥈'
  if (p === 3) return '🥉'
  return `${p}th`
}

interface PastRound {
  roundId: string
  roundNumber: number
  roundDate: string
  grossScore: number | null
  netScore: number | null
  finishPosition: number | null
}

interface SeasonStats {
  rounds: number
  avgNet: number | null
  bestNet: number | null
  wins: number
}

// ── Sparkline SVG ─────────────────────────────────────────────
function Sparkline({ netScores }: { netScores: number[] }) {
  if (netScores.length < 2) return null

  const reversed = [...netScores].reverse() // oldest → newest
  const min = Math.min(...reversed)
  const max = Math.max(...reversed)
  const range = max - min || 1

  const W = 300
  const H = 48
  const pad = 4

  const pts = reversed.map((v, i) => {
    const x = (i / (reversed.length - 1)) * (W - pad * 2) + pad
    // Lower net score = better = higher on chart (invert y)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return [x, y] as [number, number]
  })

  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
  const [lastX, lastY] = pts[pts.length - 1]

  return (
    <svg width="100%" height="48" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill="#16a34a" />
    </svg>
  )
}

interface Props {
  isImpersonating: boolean
}

export function ProfileClient({ isImpersonating }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New state for golf data
  const [handicap, setHandicap] = useState<number | null>(null)
  const [teamInfo, setTeamInfo] = useState<{ teamName: string; teamNumber: number } | null>(null)
  const [pastRounds, setPastRounds] = useState<PastRound[]>([])
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history')
  const [eligibleScores, setEligibleScores] = useState<any[]>([])
  const [scoresToUse, setScoresToUse] = useState(0)
  const [handicapHistory, setHandicapHistory] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Parallel: profile + handicap + team membership
      const [
        { data: profileData },
        { data: handicapData },
        { data: teamMemberData },
        { data: scoresData },
      ] = await Promise.all([
        supabase
          .from('users')
          .select('full_name, display_name, avatar_url, is_admin')
          .eq('id', user.id)
          .single(),
        supabase
          .from('handicaps')
          .select('current_handicap')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('team_members')
          .select('team_id, teams(team_name, team_number)')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('scores')
          .select('gross_score, net_score, round_id, rounds(id, round_number, round_date)')
          .eq('user_id', user.id)
          .not('gross_score', 'is', null)
          .limit(10),
      ])

      setProfile(profileData)
      setAvatarUrl(profileData?.avatar_url ?? null)
      setHandicap(handicapData?.current_handicap ?? null)

      const team = (teamMemberData as any)?.teams
      if (team) {
        setTeamInfo({ teamName: team.team_name, teamNumber: team.team_number })
      }

      // Handicap breakdown + history (for graph and score breakdown)
      const [{ data: eligibleRaw }, { data: hcpHistory }] = await Promise.all([
        supabase.rpc('get_eligible_scores_for_handicap', { p_user_id: user.id, p_limit: 10 }),
        supabase
          .from('handicap_history')
          .select('handicap_value, created_at, calculation_method')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(30),
      ])

      const eligible = (eligibleRaw ?? []) as any[]
      const count = eligible.length
      const toUse = Math.min(count, 5)
      const usedIds = new Set(
        [...eligible].sort((a, b) => a.gross_score - b.gross_score).slice(0, toUse).map((s: any) => s.score_id)
      )
      setEligibleScores(eligible.map((s: any) => ({ ...s, used_for_handicap: usedIds.has(s.score_id) })))
      setScoresToUse(toUse)
      setHandicapHistory(hcpHistory ?? [])

      // Fetch round_points for finish positions if we have a team
      const teamId = (teamMemberData as any)?.team_id
      let pointsMap: Record<string, number> = {}

      if (teamId) {
        const { data: roundPointsData } = await supabase
          .from('round_points')
          .select('round_id, finish_position')
          .eq('team_id', teamId)
          .limit(20)

        if (roundPointsData) {
          pointsMap = Object.fromEntries(
            roundPointsData.map((rp: any) => [rp.round_id, rp.finish_position])
          )
        }
      }

      // Build past rounds list
      const rounds: PastRound[] = ((scoresData ?? []) as any[])
        .filter((s) => s.rounds)
        .map((s) => ({
          roundId: s.round_id,
          roundNumber: s.rounds.round_number,
          roundDate: s.rounds.round_date,
          grossScore: s.gross_score,
          netScore: s.net_score,
          finishPosition: pointsMap[s.round_id] ?? null,
        }))
        .sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())

      setPastRounds(rounds)

      // Compute season stats
      const nets = rounds.map((r) => r.netScore).filter((n): n is number => n !== null)
      setSeasonStats({
        rounds: rounds.length,
        avgNet: nets.length > 0 ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 10) / 10 : null,
        bestNet: nets.length > 0 ? Math.min(...nets) : null,
        wins: rounds.filter((r) => r.finishPosition === 1).length,
      })

      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return <div className="p-4 text-zinc-400">Loading...</div>
  }

  if (!user) {
    return <div className="p-4 text-zinc-400">Not authenticated</div>
  }

  const hasPhone = user.identities?.some((id: any) => id.provider === 'phone')
  const hasGoogle = user.identities?.some((id: any) => id.provider === 'google')
  const displayName = profile?.display_name ?? profile?.full_name ?? 'Golfer'
  const isAdmin = profile?.is_admin ?? false

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setAvatarError(null)
    const formData = new FormData()
    formData.append('avatar', file)
    const result = await updateAvatar(formData)
    setAvatarUploading(false)
    if (result.error) {
      setAvatarError(result.error)
    } else {
      setAvatarUrl(result.url ?? null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true)
    setAvatarError(null)
    const result = await removeAvatar()
    setAvatarUploading(false)
    if (result.error) {
      setAvatarError(result.error)
    } else {
      setAvatarUrl(null)
    }
  }

  const handleLinkGoogle = async () => {
    try {
      await linkGoogleAccount()
    } catch (err: any) {
      setError(err.message || 'Failed to link Google account')
    }
  }

  const handleUnlinkGoogle = async () => {
    setUnlinking(true)
    setError(null)
    const result = await unlinkGoogleAccount()
    if (result.error) {
      setError(result.error)
      setUnlinking(false)
    } else {
      const supabase = createClient()
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      setUser(updatedUser)
      setUnlinking(false)
    }
  }

  const netScoresForSparkline = [...pastRounds]
    .sort((a, b) => new Date(a.roundDate).getTime() - new Date(b.roundDate).getTime())
    .map((r) => r.netScore)
    .filter((n): n is number => n !== null)

  // Handicap delta vs previous round
  const prevNet = pastRounds.length > 1 ? pastRounds[1].netScore : null
  const latestNet = pastRounds[0]?.netScore ?? null
  const netDelta = latestNet !== null && prevNet !== null ? Math.round((latestNet - prevNet) * 10) / 10 : null

  return (
    <div className="max-w-md mx-auto py-4 space-y-3">

      {isImpersonating && (
        <div className="mx-4 bg-amber-900/30 border border-amber-700 rounded-xl px-4 py-3">
          <p className="text-amber-300 text-sm">
            You are impersonating another user. This shows your own account settings.
          </p>
        </div>
      )}

      {/* ── Profile header ── */}
      <div className="px-4 flex items-center gap-4">
        {/* Avatar with green ring */}
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: '#1b4d2e', outline: '3px solid #16a34a', outlineOffset: 3 }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-white text-2xl font-extrabold font-condensed">
                {getInitials(displayName)}
              </span>
            )}
          </div>
          {avatarUploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xl font-extrabold leading-tight truncate">{displayName}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {isAdmin && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-600 text-white">Admin</span>
            )}
            {teamInfo && (
              <>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                  Team {teamInfo.teamNumber}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                  {teamInfo.teamName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Edit / upload trigger */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer inline-flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-xl text-zinc-200 transition-colors"
            style={{ background: '#27272a', border: '1px solid #3f3f46' }}
          >
            Edit
          </label>
        </div>
      </div>

      {avatarError && (
        <p className="mx-4 text-red-400 text-xs">{avatarError}</p>
      )}
      {avatarUrl && (
        <div className="px-4">
          <button
            onClick={handleRemoveAvatar}
            disabled={avatarUploading}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
          >
            Remove photo
          </button>
        </div>
      )}

      {/* ── Handicap card with sparkline ── */}
      <div className="mx-4 bg-zinc-800 rounded-2xl px-4 py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Handicap Index</p>
            <p className="text-5xl font-black text-white leading-none mt-1" style={{ letterSpacing: '-0.04em', fontFamily: 'var(--font-barlow-condensed)' }}>
              {handicap ?? '—'}
            </p>
          </div>
          {netDelta !== null && (
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: netDelta < 0 ? '#f87171' : '#4ade80' }}>
                {netDelta < 0 ? '▼' : '▲'} {Math.abs(netDelta)}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">vs last round</p>
            </div>
          )}
        </div>

        {netScoresForSparkline.length >= 2 && (
          <div className="mt-3">
            <Sparkline netScores={netScoresForSparkline} />
            {pastRounds.length > 0 && (
              <div className="flex justify-between mt-1">
                {[...pastRounds].reverse().filter((_, i, arr) => i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1).map((r) => (
                  <span key={r.roundId} className="text-[9px] text-zinc-500">
                    {new Date(r.roundDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {handicapHistory.length >= 2 && (
          <div className="mt-4 pt-3 border-t border-zinc-700">
            <HandicapHistoryGraph history={handicapHistory} />
          </div>
        )}
      </div>

      {/* ── Season stats ── */}
      {seasonStats && (
        <div className="mx-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Rounds', value: seasonStats.rounds },
            { label: 'Avg Net', value: seasonStats.avgNet ?? '—' },
            { label: 'Best Net', value: seasonStats.bestNet ?? '—' },
            { label: 'Wins', value: seasonStats.wins },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-800 rounded-xl py-3 px-1 text-center">
              <p className="text-lg font-extrabold text-white leading-none" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                {s.value}
              </p>
              <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Segmented tabs ── */}
      <div className="mx-4">
        <div className="flex bg-zinc-800 p-1 rounded-full gap-0.5">
          {(['history', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all capitalize"
              style={{
                background: activeTab === tab ? '#3f3f46' : 'transparent',
                color: activeTab === tab ? '#fafafa' : '#52525b',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── History tab ── */}
      {activeTab === 'history' && (
        <div className="mx-4 space-y-2 pb-4">
          {/* Handicap breakdown */}
          {eligibleScores.length > 0 && (
            <div className="bg-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-700">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Handicap Calculation</p>
              </div>
              <div className="px-2 py-2">
                <HandicapBreakdown
                  scores={eligibleScores}
                  scoresToUse={scoresToUse}
                  currentHandicap={handicap}
                  dark
                />
              </div>
            </div>
          )}

          {pastRounds.length === 0 ? (
            <div className="bg-zinc-800 rounded-xl px-4 py-8 text-center text-zinc-500">
              No completed rounds yet.
            </div>
          ) : (
            pastRounds.map((r) => (
              <div key={r.roundId} className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                {/* Position medal */}
                <div className="w-9 text-center shrink-0">
                  {r.finishPosition !== null ? (
                    <span className="text-xl leading-none">{posLabel(r.finishPosition)}</span>
                  ) : (
                    <span className="text-zinc-600 text-sm font-bold">—</span>
                  )}
                </div>

                {/* Round info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">Round {r.roundNumber}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {new Date(r.roundDate + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Scores */}
                <div className="flex items-baseline gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Gross</p>
                    <p className="text-sm font-bold text-zinc-400">{r.grossScore ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Net</p>
                    <p className="text-lg font-black text-green-400 leading-none" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                      {r.netScore ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && (
        <div className="mx-4 space-y-3 pb-6">

          {/* Email */}
          <div className="bg-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-zinc-700">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Email</p>
              <p className="text-white text-sm">{user.email}</p>
            </div>

            {/* Sign-in methods */}
            <div className="px-4 py-3.5 border-b border-zinc-700 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Phone (SMS)</p>
                <p className="text-xs text-zinc-500 mt-0.5">{hasPhone ? 'Active' : 'Not set up'}</p>
              </div>
              {hasPhone && <span className="text-green-400 text-sm font-bold">✓</span>}
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Google</p>
                <p className="text-xs text-zinc-500 mt-0.5">{hasGoogle ? 'Linked' : 'Not linked'}</p>
              </div>
              {hasGoogle && <span className="text-green-400 text-sm font-bold">✓</span>}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Google link/unlink */}
          {!hasGoogle ? (
            <Button onClick={handleLinkGoogle} variant="primary" className="w-full">
              Link Google Account
            </Button>
          ) : (
            <Button
              onClick={handleUnlinkGoogle}
              variant="danger"
              disabled={unlinking || !hasPhone}
              className="w-full"
            >
              {unlinking ? 'Unlinking...' : 'Unlink Google Account'}
            </Button>
          )}

          {hasGoogle && !hasPhone && (
            <p className="text-xs text-zinc-500 text-center">
              You can&apos;t unlink your only sign-in method.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
