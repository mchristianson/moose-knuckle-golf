import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/layout/site-header'
import { AppBottomNav } from '@/components/layout/app-bottom-nav'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const navItems = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/manual', label: 'Manual' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ]

  // Find the first active round (in_progress or scoring) for the leaderboard nav
  let currentRoundId: string | undefined
  if (user) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader navItems={navItems} isLoggedIn={!!user} />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      {user && <AppBottomNav currentRoundId={currentRoundId} />}
    </div>
  )
}
