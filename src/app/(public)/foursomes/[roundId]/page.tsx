import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FoursomesList } from "@/components/foursomes/foursomes-list";
import { notFound } from "next/navigation";

export default async function FoursomesPage({ params }: { params: Promise<{ roundId: string }> }) {
  const supabase = await createClient();
  const { roundId } = await params;

  // Get the round
  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round) {
    notFound();
  }

  // Get foursomes with member details
  const { data: foursomes } = await supabase
    .from('foursomes')
    .select(`
      *,
      members:foursome_members (
        *,
        user:user_id (
          id,
          full_name
        ),
        team:team_id (
          id,
          team_name,
          team_number
        )
      )
    `)
    .eq('round_id', roundId)
    .order('tee_time_slot');

  if (!foursomes || foursomes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link href="/leaderboard" className="text-green-600 hover:text-green-700 text-sm">
              ← Back to Leaderboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-2">Round {round.round_number}</h1>
          <p className="text-gray-600 mb-6">
            {new Date(round.round_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">Foursomes have not been assigned yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const roundDate = new Date(round.round_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/leaderboard" className="text-green-600 hover:text-green-700 text-sm">
            ← Back to Leaderboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Foursomes - Round {round.round_number}</h1>
        <p className="text-gray-600 mb-6">{roundDate}</p>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Round Type</div>
              <div className="text-lg font-semibold capitalize">{round.round_type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-lg font-semibold capitalize">{round.status.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Season</div>
              <div className="text-lg font-semibold">{round.season_year}</div>
            </div>
          </div>
        </div>

        <FoursomesList foursomes={foursomes} teeTime={round.tee_time} />
      </div>
    </div>
  );
}
