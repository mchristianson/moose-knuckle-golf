import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TeamCard } from "@/components/teams/team-card";

export default async function TeamsPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        *,
        users:user_id (*)
      )
    `)
    .order('team_number');

  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('full_name');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Link
          href="/admin/teams/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + Create Team
        </Link>
      </div>

      {!teams || teams.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">No teams created yet</p>
          <Link
            href="/admin/teams/new"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Create Your First Team
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team: any) => (
            <TeamCard key={team.id} team={team} allUsers={allUsers || []} />
          ))}
        </div>
      )}
    </div>
  );
}
