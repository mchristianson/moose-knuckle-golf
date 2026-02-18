'use client'

import { useState } from 'react'
import { addTeamMember, removeTeamMember, deleteTeam, updateTeam } from '@/lib/actions/teams'

interface TeamCardProps {
  team: any
  allUsers: any[]
}

export function TeamCard({ team, allUsers }: TeamCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [teamName, setTeamName] = useState(team.team_name)
  const [isDeleting, setIsDeleting] = useState(false)

  const members = team.team_members || []
  const memberUserIds = members.map((m: any) => m.user_id)
  const availableUsers = allUsers.filter(u => !memberUserIds.includes(u.id))

  const handleUpdateName = async () => {
    await updateTeam(team.id, teamName)
    setIsEditing(false)
  }

  const handleAddMember = async (userId: string) => {
    const result = await addTeamMember(team.id, userId)
    if (result?.error) {
      alert(result.error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Remove this member from the team?')) {
      await removeTeamMember(memberId)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Delete Team ${team.team_number}: ${team.team_name}? This cannot be undone.`)) {
      setIsDeleting(true)
      const result = await deleteTeam(team.id)
      if (result?.error) {
        alert(result.error)
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-green-700">
              Team {team.team_number}
            </span>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded"
              />
              <button
                onClick={handleUpdateName}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setTeamName(team.team_name)
                  setIsEditing(false)
                }}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{team.team_name}</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          {isDeleting ? '...' : '🗑️'}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium text-gray-700">
          Members ({members.length}/2)
        </div>
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No members assigned</p>
        ) : (
          <ul className="space-y-1">
            {members.map((member: any) => (
              <li key={member.id} className="flex justify-between items-center text-sm">
                <span>{member.users?.full_name}</span>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {members.length < 2 && availableUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Member
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddMember(e.target.value)
                e.target.value = ''
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select a golfer...</option>
            {availableUsers.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
