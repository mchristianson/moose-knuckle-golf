'use client'

import { createSub } from '@/lib/actions/subs'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'

export function CreateSubForm() {
  const router = useRouter()
  const [state, formAction] = useFormState(createSub, { error: '' })
  const { pending } = useFormStatus()

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      router.push('/admin/subs')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          name="full_name"
          id="full_name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone (Optional)
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {state.error}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? 'Adding...' : 'Add Sub'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
