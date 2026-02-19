import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/layout/site-header'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
  }

  const navItems = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader navItems={navItems} isLoggedIn={!!user} isAdmin={isAdmin} />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
