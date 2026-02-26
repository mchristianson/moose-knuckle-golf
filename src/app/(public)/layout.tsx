import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/layout/site-header'

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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader navItems={navItems} isLoggedIn={!!user} />
      <main className="flex-1 container mx-auto px-4">
        {children}
      </main>
    </div>
  )
}
