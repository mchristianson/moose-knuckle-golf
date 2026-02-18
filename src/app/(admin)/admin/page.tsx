import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get counts
  const { count: teamCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true });

  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: roundCount } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/teams"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="text-gray-600 text-sm mb-1">Teams</div>
          <div className="text-3xl font-bold text-green-700">{teamCount || 0}</div>
          <div className="text-sm text-gray-500 mt-2">Manage teams →</div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="text-gray-600 text-sm mb-1">Users</div>
          <div className="text-3xl font-bold text-green-700">{userCount || 0}</div>
          <div className="text-sm text-gray-500 mt-2">Manage users →</div>
        </Link>

        <Link
          href="/admin/rounds"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="text-gray-600 text-sm mb-1">Rounds</div>
          <div className="text-3xl font-bold text-green-700">{roundCount || 0}</div>
          <div className="text-sm text-gray-500 mt-2">Manage rounds →</div>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">🚀 Getting Started</h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Create 8 teams in the <Link href="/admin/teams" className="underline">Teams</Link> section</li>
          <li>Assign 1-2 golfers to each team</li>
          <li>Create your first round in <Link href="/admin/rounds" className="underline">Rounds</Link></li>
          <li>Golfers can then declare availability and enter scores</li>
        </ol>
      </div>
    </div>
  );
}
