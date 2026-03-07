import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
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
      <div className="flex justify-between items-center mb-lg">
        <h1 className="text-h1">Teams</h1>
        <Button variant="primary" asChild>
          <Link href="/admin/teams/new">
            + Create Team
          </Link>
        </Button>
      </div>

      {!teams || teams.length === 0 ? (
        <Card className="text-center py-lg">
          <p className="text-neutral-700 mb-md">No teams created yet</p>
          <Button variant="primary" asChild>
            <Link href="/admin/teams/new">
              Create Your First Team
            </Link>
          </Button>
        </Card>
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
