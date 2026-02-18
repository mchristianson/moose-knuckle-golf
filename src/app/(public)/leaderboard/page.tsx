import { createClient } from '@/lib/supabase/server'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const { data: standings } = await supabase
    .rpc('get_season_leaderboard', { p_season_year: currentYear })

  // Get recent round results
  const { data: recentRounds } = await supabase
    .from('rounds')
    .select(`
      id,
      round_number,
      round_date,
      round_points (
        finish_position,
        net_score,
        points_earned,
        is_tied,
        team:team_id ( team_number, team_name )
      )
    `)
    .eq('season_year', currentYear)
    .eq('status', 'completed')
    .eq('round_type', 'regular')
    .order('round_date', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Season Leaderboard</h1>
      <p className="text-gray-500 mb-8">{currentYear} Season</p>

      {/* Season standings */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-10">
        <div className="bg-green-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Season Standings</h2>
        </div>
        {!standings || standings.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No completed rounds yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Rank</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Team</th>
                <th className="text-center px-6 py-3 font-medium text-gray-600">Rounds</th>
                <th className="text-center px-6 py-3 font-medium text-gray-600">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {standings.map((row: any, idx: number) => (
                <tr
                  key={row.team_id}
                  className={idx === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                >
                  <td className="px-6 py-4 font-bold text-lg">
                    {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">Team {row.team_number}</span>
                    <span className="text-gray-500 text-xs ml-2">{row.team_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">{row.rounds_played}</td>
                  <td className="px-6 py-4 text-center font-bold text-green-700 text-lg">
                    {row.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent round results */}
      {recentRounds && recentRounds.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
          <div className="space-y-6">
            {recentRounds.map((round: any) => {
              const date = new Date(round.round_date).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })
              const sorted = (round.round_points ?? []).slice().sort(
                (a: any, b: any) => a.finish_position - b.finish_position
              )
              return (
                <div key={round.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-gray-700 text-white px-4 py-3">
                    <h3 className="font-semibold">Round {round.round_number}</h3>
                    <p className="text-gray-300 text-sm">{date}</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">Pos</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">Team</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-600">Net</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-600">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sorted.map((p: any) => (
                        <tr key={p.team.team_number} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">
                            {p.finish_position}{p.is_tied ? 'T' : ''}
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-medium">Team {p.team.team_number}</span>
                            <span className="text-gray-500 ml-2 text-xs">{p.team.team_name}</span>
                          </td>
                          <td className="px-4 py-2 text-center">{p.net_score}</td>
                          <td className="px-4 py-2 text-center font-bold text-green-700">{p.points_earned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
