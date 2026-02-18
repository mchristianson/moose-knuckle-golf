import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AvailabilitySummary } from "@/components/availability/availability-summary";
import { TeeTimeEditor } from "@/components/rounds/tee-time-editor";
import { GenerateFoursomesButton } from "@/components/foursomes/generate-foursomes-button";
import { FoursomesList } from "@/components/foursomes/foursomes-list";

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

  // Get foursomes if they exist
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

  // Get tee times if they exist
  const { data: teeTimesData } = await supabase
    .from('rounds')
    .select('tee_time')
    .eq('id', roundId)
    .single();

  const roundDate = new Date(round.round_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const availableCount = availability?.filter(a => a.status === 'in').length || 0;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/rounds" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Rounds
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Round {round.round_number}</h1>
      <p className="text-gray-600 mb-6">{roundDate}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Available</div>
          <div className="text-lg font-semibold">{availableCount} of 8</div>
          <div className="text-xs text-gray-500 mt-1">golfers</div>
        </div>
      </div>

      <div className="mb-6">
        <TeeTimeEditor roundId={roundId} currentTeeTime={round.tee_time} />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Foursome Assignment</h2>
        <GenerateFoursomesButton roundId={roundId} availableCount={availableCount} />
      </div>

      {foursomes && foursomes.length > 0 && (
        <div className="mb-6">
          <FoursomesList foursomes={foursomes} teeTime={teeTimesData?.tee_time} />
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Availability</h2>
        <AvailabilitySummary availability={availability || []} />
      </div>
    </div>
  );
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}
