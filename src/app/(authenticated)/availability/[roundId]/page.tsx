import { createClient } from "@/lib/supabase/server";
import { AvailabilityToggle } from "@/components/availability/availability-toggle";
import { redirect } from "next/navigation";

export default async function AvailabilityPage({ params }: { params: Promise<{ roundId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { roundId } = await params;

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round) {
    return <div>Round not found</div>;
  }

  const { data: myAvailability } = await supabase
    .from('round_availability')
    .select(`
      *,
      team:team_id (
        team_number,
        team_name
      )
    `)
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .single();

  if (!myAvailability) {
    return <div>No availability record found for this round</div>;
  }

  // Get teammate availability if exists
  const { data: teammateAvailability } = await supabase
    .from('round_availability')
    .select(`
      *,
      user:user_id (
        full_name
      )
    `)
    .eq('round_id', roundId)
    .eq('team_id', myAvailability.team_id)
    .neq('user_id', user.id)
    .maybeSingle();

  const roundDate = new Date(round.round_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const deadline = round.availability_deadline
    ? new Date(round.availability_deadline).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Declare Availability</h1>
      <p className="text-gray-600 mb-6">Round {round.round_number} - {roundDate}</p>

      {deadline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800">
            ⏰ Deadline: {deadline}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-1">
            Your Team: Team {myAvailability.team.team_number} - {myAvailability.team.team_name}
          </h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Availability
          </label>
          <AvailabilityToggle
            roundId={roundId}
            currentStatus={myAvailability.status}
          />
        </div>

        {teammateAvailability && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-1">Teammate</p>
            <p className="font-medium">{teammateAvailability.user.full_name}</p>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                teammateAvailability.status === 'in'
                  ? 'bg-green-100 text-green-800'
                  : teammateAvailability.status === 'out'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {teammateAvailability.status === 'in' ? '✓ Playing' :
                 teammateAvailability.status === 'out' ? '✗ Not Playing' :
                 '? Undeclared'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Only one team member needs to declare for the whole team</li>
          <li>Please declare by the deadline above</li>
          <li>If both members are out, you'll need to arrange a substitute</li>
        </ul>
      </div>
    </div>
  );
}
