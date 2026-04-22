import { redirect } from 'next/navigation'
import { getViewerContext } from '@/lib/viewer'
import { SiteHeader } from '@/components/layout/site-header'
import { AppBottomNav } from '@/components/layout/app-bottom-nav'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getViewerContext()
  if (!ctx) redirect('/login')

  const { effectiveProfile, isImpersonating, db: supabase } = ctx

  const isAdmin: boolean = effectiveProfile?.is_admin || false
  const avatarUrl: string | undefined = effectiveProfile?.avatar_url ?? undefined
  let currentRoundId: string | undefined

  // Find the first active round (in_progress or scoring)
  const { data: activeRounds } = await supabase
    .from('rounds')
    .select('id')
    .in('status', ['in_progress', 'scoring'])
    .order('round_date', { ascending: false })
    .limit(1)

  if (activeRounds && activeRounds.length > 0) {
    currentRoundId = activeRounds[0].id
  }

  const navItems = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/manual', label: 'Manual' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const displayName = effectiveProfile?.display_name ?? effectiveProfile?.full_name ?? 'Unknown'

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {isImpersonating && <ImpersonationBanner name={displayName} />}
      <SiteHeader navItems={navItems} isLoggedIn={true} isAdmin={isAdmin} avatarUrl={avatarUrl} />
      <main className="flex-1 flex flex-col min-h-0 container mx-auto px-4 py-0">
        {children}
      </main>
      <AppBottomNav currentRoundId={currentRoundId} avatarUrl={avatarUrl} />
    </div>
  )
}
