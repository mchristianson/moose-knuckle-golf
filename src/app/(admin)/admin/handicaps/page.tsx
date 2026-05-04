import { createClient } from '@/lib/supabase/server'
import { HandicapPlayerList } from '@/components/handicaps/HandicapPlayerList'

export default async function HandicapsPage() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      handicaps ( current_handicap, rounds_played, last_calculated_at, is_manual_override )
    `)
    .eq('is_active', true)
    .order('full_name')

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

      <div className="space-y-8">
        {/* Player handicap list — expandable */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Handicaps</h2>
          <p className="text-sm text-gray-500 mb-3">Click a player row to see their score breakdown and handicap calculation.</p>
          <HandicapPlayerList players={(players ?? []) as any} />
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
