import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { RoundCard } from "@/components/rounds/round-card";

export default async function RoundsPage() {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('season_year', currentYear)
    .order('round_date', { ascending: true });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rounds</h1>
        <Link
          href="/admin/rounds/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + Create Round
        </Link>
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">No rounds scheduled yet</p>
          <Link
            href="/admin/rounds/new"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Create Your First Round
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round: any) => (
            <RoundCard key={round.id} round={round} />
          ))}
        </div>
      )}
    </div>
  );
}
