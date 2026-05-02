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

  let isAdmin = false
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = userData?.is_admin ?? false
  }

  const navItems = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/manual', label: 'Manual' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  // Find the first active round (in_progress or scoring) for the leaderboard nav
  let currentRoundId: string | undefined
  let avatarUrl: string | undefined
  if (user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
    avatarUrl = profileData?.avatar_url ?? undefined

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
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <SiteHeader navItems={navItems} isLoggedIn={!!user} avatarUrl={avatarUrl} />
      <main className="flex-1 container mx-auto px-1 pb-6">
        {children}
      </main>
      {user && <AppBottomNav currentRoundId={currentRoundId} avatarUrl={avatarUrl} />}
    </div>
  )
}
