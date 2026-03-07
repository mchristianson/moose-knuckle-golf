import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/signout-button";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-h2">
                Moose Knuckle Golf
              </h1>
              <span className="text-xs font-semibold bg-primary-dark px-3 py-1 rounded-full">Admin</span>
            </div>
            <nav className="flex gap-4 items-center">
              <Link href="/leaderboard" className="text-sm font-medium hover:text-neutral-100 transition-colors">
                Public View
              </Link>
              <Link href="/dashboard" className="text-sm font-medium hover:text-neutral-100 transition-colors">
                Dashboard
              </Link>
              <SignOutButton />
            </nav>
          </div>
        </div>
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
