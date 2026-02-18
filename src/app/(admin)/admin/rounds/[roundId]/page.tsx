import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AvailabilitySummary } from "@/components/availability/availability-summary";

export default async function RoundDetailPage({ params }: { params: Promise<{ roundId: string }> }) {
  const supabase = await createClient();
  const { roundId } = await params;

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round) {
    return <div>Round not found</div>;
  }

  // Get all availability for this round
  const { data: availability } = await supabase
    .from('round_availability')
    .select(`
      *,
      user:user_id (
        full_name,
        email
      ),
      team:team_id (
        team_number,
        team_name
      )
    `)
    .eq('round_id', roundId)
    .order('team_id');

  const roundDate = new Date(round.round_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/rounds" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Rounds
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Round {round.round_number}</h1>
      <p className="text-gray-600 mb-6">{roundDate}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Status</div>
          <div className="text-lg font-semibold capitalize">{round.status.replace('_', ' ')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Type</div>
          <div className="text-lg font-semibold capitalize">{round.round_type}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Season</div>
          <div className="text-lg font-semibold">{round.season_year}</div>
        </div>
      </div>

      <AvailabilitySummary availability={availability || []} />
    </div>
  );
}
