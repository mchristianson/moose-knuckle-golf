'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createTeam } from '@/lib/actions/teams'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating...' : 'Create Team'}
    </button>
  )
}

export function CreateTeamForm() {
  const currentYear = new Date().getFullYear()
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(createTeam, { error: null })

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="teamNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Team Number (1-8)
        </label>
        <input
          id="teamNumber"
          name="teamNumber"
          type="number"
          min="1"
          max="8"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-1">This determines the team's display order</p>
      </div>

      <div>
        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
          Team Name
        </label>
        <input
          id="teamName"
          name="teamName"
          type="text"
          required
          placeholder="e.g., The Birdies"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="seasonYear" className="block text-sm font-medium text-gray-700 mb-1">
          Season Year
        </label>
        <input
          id="seasonYear"
          name="seasonYear"
          type="number"
          defaultValue={currentYear}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
