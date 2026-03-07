'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { addTeamMember, removeTeamMember, deleteTeam, updateTeam } from '@/lib/actions/teams'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

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
    <Card>
      <div className="flex justify-between items-start mb-md">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-xs">
            <span className="text-h3 text-primary">
              Team {team.team_number}
            </span>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="flex-1 px-2 py-1 border border-neutral-200 rounded"
              />
              <Button size="small" variant="primary" onClick={handleUpdateName}>
                Save
              </Button>
              <Button
                size="small"
                variant="ghost"
                onClick={() => {
                  setTeamName(team.team_name)
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-h4 font-semibold">{team.team_name}</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="hover:opacity-70 transition-opacity p-1"
                aria-label="Edit team name"
              >
                <Icon icon={PencilIcon} size="md" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="hover:opacity-70 transition-opacity disabled:opacity-50 p-1"
          aria-label="Delete team"
        >
          <Icon icon={TrashIcon} size="md" />
        </button>
      </div>

      <div className="space-y-2 mb-md">
        <div className="text-small font-semibold text-neutral-700">
          Members ({members.length}/2)
        </div>
        {members.length === 0 ? (
          <p className="text-neutral-500 text-small italic">No members assigned</p>
        ) : (
          <ul className="space-y-2">
            {members.map((member: any) => (
              <li key={member.id} className="flex justify-between items-center text-small">
                <span>{member.users?.full_name}</span>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {members.length < 2 && availableUsers.length > 0 && (
        <div>
          <label className="block text-small font-semibold text-neutral-700 mb-2">
            Add Member
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddMember(e.target.value)
                e.target.value = ''
              }
            }}
            className="w-full px-md py-2 border border-neutral-200 rounded-lg text-small"
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
    </Card>
  )
}
