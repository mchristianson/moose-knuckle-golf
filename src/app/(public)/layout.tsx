import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-green-700">
              Moose Knuckle Golf
            </h1>
            <nav className="flex gap-4">
              <Link href="/leaderboard" className="hover:text-green-600">
                Leaderboard
              </Link>
              <Link href="/login" className="hover:text-green-600">
                Login
              </Link>
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
