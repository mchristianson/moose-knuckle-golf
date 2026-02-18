import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SubList } from '@/components/subs/sub-list'
import { SubRequestList } from '@/components/subs/sub-request-list'

export default async function SubsPage() {
  const supabase = await createClient()

  // Get all subs
  const { data: subs } = await supabase.from('subs').select('*').order('full_name')

  // Get pending sub requests with details
  const { data: requests } = await supabase
    .from('round_subs')
    .select(
      `
      *,
      sub:sub_id (
        id,
        full_name,
        email
      ),
      round:round_id (
        id,
        round_number,
        round_date
      ),
      team:team_id (
        id,
        team_name,
        team_number
      ),
      requested_by_user:requested_by (
        id,
        full_name,
        email
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Admin
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Substitute Management</h1>

      {/* Pending Requests Section */}
      {requests && requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pending Requests ({requests.length})</h2>
          <SubRequestList initialRequests={requests} />
        </div>
      )}

      {/* Sub Pool Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Sub Pool ({subs?.length || 0})</h2>
          <Link
            href="/admin/subs/new"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            + Add Sub
          </Link>
        </div>
        {subs && subs.length > 0 ? (
          <SubList initialSubs={subs} />
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
            No subs in the pool yet. Add your first sub to get started.
          </div>
        )}
      </div>
    </div>
  )
}
