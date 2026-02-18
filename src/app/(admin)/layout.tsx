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
      <header className="border-b bg-green-700 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                Moose Knuckle Golf
              </h1>
              <span className="text-sm bg-green-800 px-2 py-1 rounded">Admin</span>
            </div>
            <nav className="flex gap-4 items-center">
              <Link href="/leaderboard" className="hover:text-green-200 text-sm">
                Public View
              </Link>
              <Link href="/dashboard" className="hover:text-green-200 text-sm">
                Dashboard
              </Link>
              <SignOutButton />
            </nav>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
