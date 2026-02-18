import { createClient } from '@/lib/supabase/server'
import { SetHandicapForm } from '@/components/handicaps/set-handicap-form'

export default async function HandicapsPage() {
  const supabase = await createClient()

  // All active players with their handicaps and recent scores
  const { data: players } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      handicaps ( current_handicap, rounds_played, last_calculated_at, is_manual_override )
    `)
    .eq('is_active', true)
    .order('full_name')

  // Recent handicap history (last 20 changes)
  const { data: history } = await supabase
    .from('handicap_history')
    .select(`
      id,
      handicap_value,
      calculation_method,
      reason,
      created_at,
      user:user_id ( full_name ),
      changed_by_user:changed_by ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Handicaps</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Player handicap list */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Handicaps</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Player</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Handicap</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Rounds</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Set</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(players ?? []).map((p: any) => {
                  const h = Array.isArray(p.handicaps) ? p.handicaps[0] : p.handicaps
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {p.full_name}
                        {h?.is_manual_override && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {h ? h.current_handicap : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {h?.rounds_played ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <SetHandicapForm
                          userId={p.id}
                          currentHandicap={h?.current_handicap ?? 0}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Changes</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Player</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(history ?? []).map((h: any) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{h.user?.full_name}</td>
                    <td className="px-4 py-2 text-center font-bold">{h.handicap_value}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        h.calculation_method === 'manual'
                          ? 'bg-amber-100 text-amber-800'
                          : h.calculation_method === 'calculated'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {h.calculation_method}
                      </span>
                      {h.reason && <span className="text-gray-400 text-xs ml-2">{h.reason}</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {new Date(h.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
                {(!history || history.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No history yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
