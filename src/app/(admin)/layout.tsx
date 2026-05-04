import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin, avatar_url')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) redirect('/dashboard');

  // Find the first active round (in_progress or scoring)
  let currentRoundId: string | undefined;
  const { data: activeRounds } = await supabase
    .from('rounds')
    .select('id')
    .in('status', ['in_progress', 'scoring'])
    .order('round_date', { ascending: false })
    .limit(1);

  if (activeRounds && activeRounds.length > 0) {
    currentRoundId = activeRounds[0].id;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader isLoggedIn={true} isAdmin={true} avatarUrl={userData?.avatar_url} currentRoundId={currentRoundId} navItems={[]} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
