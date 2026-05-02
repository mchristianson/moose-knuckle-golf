import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/signout-button";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-primary text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <h1 className="text-lg font-bold leading-tight md:text-h2">
                  Moose Knuckle Golf
                </h1>
              </Link>
              <span className="text-xs font-semibold bg-primary-dark px-2 py-0.5 rounded-full shrink-0">Admin</span>
            </div>
            <nav className="flex gap-4 items-center">
              <Link href="/leaderboard" className="hidden md:inline text-sm font-medium hover:text-neutral-100 transition-colors">
                Leaderboard
              </Link>
              <Link href="/dashboard" className="hidden md:inline text-sm font-medium hover:text-neutral-100 transition-colors">
                Dashboard
              </Link>
              <SignOutButton />
            </nav>
          </div>
        </div>
        <AdminMobileNav />
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
