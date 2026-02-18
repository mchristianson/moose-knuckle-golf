import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single();

  // Get upcoming rounds
  const today = new Date().toISOString().split('T')[0];
  const { data: upcomingRounds } = await supabase
    .from('rounds')
    .select('*')
    .gte('round_date', today)
    .order('round_date', { ascending: true })
    .limit(3);

  // Get my availability for upcoming rounds
  const { data: myAvailability } = await supabase
    .from('round_availability')
    .select(`
      *,
      round:round_id (
        round_number,
        round_date,
        status
      )
    `)
    .eq('user_id', user?.id)
    .in('round_id', upcomingRounds?.map(r => r.id) || []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Welcome, {profile?.full_name || 'Golfer'}!
        </h2>
        <p className="text-gray-600 mb-4">{profile?.email}</p>
        {profile?.is_admin && (
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            Admin
          </span>
        )}
      </div>

      {upcomingRounds && upcomingRounds.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Rounds</h2>
          <div className="space-y-4">
            {upcomingRounds.map((round: any) => {
              const availability = myAvailability?.find(a => a.round_id === round.id);
              const roundDate = new Date(round.round_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={round.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Round {round.round_number}</h3>
                      <p className="text-gray-600">{roundDate}</p>
                    </div>
                    <div className="text-right">
                      {availability ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          availability.status === 'in'
                            ? 'bg-green-100 text-green-800'
                            : availability.status === 'out'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {availability.status === 'in' ? '✓ Playing' :
                           availability.status === 'out' ? '✗ Not Playing' :
                           '⚠ Need to Declare'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {availability && availability.status === 'undeclared' && (
                    <Link
                      href={`/availability/${round.id}`}
                      className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Declare Availability
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600">No upcoming rounds scheduled yet</p>
        </div>
      )}
    </div>
  );
}
