'use client'

import { useState } from 'react'
import { formatRoundDate } from '@/lib/utils/date'
import { approveSub } from '@/lib/actions/subs'

interface SubRequest {
  id: string
  status: 'pending' | 'approved' | 'declined'
  created_at: string
  notes?: string
  sub?: {
    id: string
    full_name: string
    email: string
  }
  round?: {
    id: string
    round_number: number
    round_date: string
  }
  team?: {
    id: string
    team_name: string
    team_number: number
  }
  requested_by_user?: {
    id: string
    full_name: string
    email: string
  }
}

interface SubRequestListProps {
  initialRequests: SubRequest[]
}

export function SubRequestList({ initialRequests }: SubRequestListProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (requestId: string) => {
    setLoading(requestId)
    const result = await approveSub(requestId, true)
    if (result.success && result.data) {
      setRequests(requests.filter((r) => r.id !== requestId))
    } else {
      alert(result.error || 'Failed to approve sub')
    }
    setLoading(null)
  }

  const handleDecline = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this sub request?')) return

    setLoading(requestId)
    const result = await approveSub(requestId, false)
    if (result.success && result.data) {
      setRequests(requests.filter((r) => r.id !== requestId))
    } else {
      alert(result.error || 'Failed to decline sub')
    }
    setLoading(null)
  }

  if (requests.length === 0) {
    return <div className="text-gray-600">No pending sub requests</div>
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="bg-white p-4 rounded-lg border border-blue-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Sub</div>
              <div className="font-semibold">{request.sub?.full_name}</div>
              <div className="text-sm text-gray-600">{request.sub?.email}</div>
            </div>

            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Round</div>
              <div className="font-semibold">Round {request.round?.round_number}</div>
              <div className="text-sm text-gray-600">
                {request.round?.round_date &&
                  formatRoundDate(request.round.round_date)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Team</div>
              <div className="font-semibold">{request.team?.team_name}</div>
              <div className="text-sm text-gray-600">Team #{request.team?.team_number}</div>
            </div>

            <div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Requested By</div>
              <div className="font-semibold">{request.requested_by_user?.full_name}</div>
              <div className="text-sm text-gray-600">{request.requested_by_user?.email}</div>
            </div>
          </div>

          {request.notes && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Notes</div>
              <div className="text-sm">{request.notes}</div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleApprove(request.id)}
              disabled={loading === request.id}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading === request.id ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => handleDecline(request.id)}
              disabled={loading === request.id}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading === request.id ? 'Processing...' : 'Decline'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
