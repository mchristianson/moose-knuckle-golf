'use client'

import { useActionState, useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/actions/auth'

type Stage = 'phone' | 'otp'
type ActionState = { error: string | null }

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export function PhoneLoginForm() {
  const [stage, setStage] = useState<Stage>('phone')
  const [phone, setPhone] = useState('')
  const [sendAttempted, setSendAttempted] = useState(false)

  const [sendState, sendAction] = useActionState<ActionState, FormData>(
    sendPhoneOtp,
    { error: null }
  )

  const [verifyState, verifyAction] = useActionState<ActionState, FormData>(
    verifyPhoneOtp,
    { error: null }
  )

  // Advance to OTP stage when sendPhoneOtp succeeds (error === null after an attempt)
  useEffect(() => {
    if (sendAttempted && sendState.error === null) {
      setStage('otp')
    }
  }, [sendState, sendAttempted])

  const handleSendSubmit = (formData: FormData) => {
    setSendAttempted(true)
    setPhone(formData.get('phone') as string)
    sendAction(formData)
  }

  const handleBack = () => {
    setStage('phone')
    setSendAttempted(false)
  }

  if (stage === 'phone') {
    return (
      <form action={handleSendSubmit} className="space-y-4">
        {sendState.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {sendState.error}
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm">
              +1
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="3334445555"
              maxLength={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Enter your 10-digit US number</p>
        </div>

        <SubmitButton label="Send Code" pendingLabel="Sending..." />
      </form>
    )
  }

  // stage === 'otp'
  return (
    <form action={verifyAction} className="space-y-4">
      {verifyState.error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {verifyState.error}
        </div>
      )}

      <input type="hidden" name="phone" value={phone} />

      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
          Verification Code
        </label>
        <p className="text-sm text-gray-600 mb-2">
          We sent a 6-digit code to +1{phone}
        </p>
        <input
          id="token"
          name="token"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          maxLength={6}
          autoComplete="one-time-code"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
        />
      </div>

      <SubmitButton label="Verify Code" pendingLabel="Verifying..." />

      <button
        type="button"
        onClick={handleBack}
        className="w-full text-sm text-gray-600 hover:text-green-600"
      >
        Back — use a different number
      </button>
    </form>
  )
}
