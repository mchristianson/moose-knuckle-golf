import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/layout/site-header'
import { AppBottomNav } from '@/components/layout/app-bottom-nav'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let currentRoundId: string | undefined
  let avatarUrl: string | undefined

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin, avatar_url')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
    avatarUrl = profile?.avatar_url ?? undefined

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
  }

  const navItems = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/manual', label: 'Manual' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <SiteHeader navItems={navItems} isLoggedIn={!!user} isAdmin={isAdmin} avatarUrl={avatarUrl} />
      <main className="flex-1 container mx-auto px-4 py-0">
        {children}
      </main>
      <AppBottomNav currentRoundId={currentRoundId} avatarUrl={avatarUrl} />
    </div>
  )
}
