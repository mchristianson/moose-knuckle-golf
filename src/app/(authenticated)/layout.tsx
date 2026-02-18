import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/signout-button";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.is_admin || false;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-green-700">
              Moose Knuckle Golf
            </h1>
            <nav className="flex gap-4 items-center">
              <Link href="/leaderboard" className="hover:text-green-600">
                Leaderboard
              </Link>
              <Link href="/dashboard" className="hover:text-green-600">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-green-600">
                  Admin
                </Link>
              )}
              <SignOutButton />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
