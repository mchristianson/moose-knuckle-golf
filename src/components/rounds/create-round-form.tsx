'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createRound } from '@/lib/actions/rounds'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating...' : 'Create Round'}
    </button>
  )
}

export function CreateRoundForm() {
  const currentYear = new Date().getFullYear()
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(createRound, { error: null })

  // Get next Thursday
  const getNextThursday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7
    const nextThursday = new Date(today)
    nextThursday.setDate(today.getDate() + daysUntilThursday)
    return nextThursday.toISOString().split('T')[0]
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="roundNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Round Number
        </label>
        <input
          id="roundNumber"
          name="roundNumber"
          type="number"
          min="1"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-1">Week number in the season (1, 2, 3...)</p>
      </div>

      <div>
        <label htmlFor="roundDate" className="block text-sm font-medium text-gray-700 mb-1">
          Play Date
        </label>
        <input
          id="roundDate"
          name="roundDate"
          type="date"
          required
          defaultValue={getNextThursday()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-1">Typically Thursday</p>
      </div>

      <div>
        <label htmlFor="roundType" className="block text-sm font-medium text-gray-700 mb-1">
          Round Type
        </label>
        <select
          id="roundType"
          name="roundType"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="regular">Regular</option>
          <option value="makeup">Makeup</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Any special instructions or notes for this round..."
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
