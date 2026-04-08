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
          <div className="bg-red-950/60 text-red-400 border border-red-800/50 p-3 rounded-md text-sm">
            {sendState.error}
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-200 mb-1">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-zinc-700 rounded-l-md bg-zinc-800 text-zinc-400 text-sm">
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
              className="w-full px-3 py-2 border border-zinc-700 rounded-r-md bg-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Enter your 10-digit US number</p>
        </div>

        <SubmitButton label="Send Code" pendingLabel="Sending..." />
      </form>
    )
  }

  // stage === 'otp'
  return (
    <form action={verifyAction} className="space-y-4">
      {verifyState.error && (
        <div className="bg-red-950/60 text-red-400 border border-red-800/50 p-3 rounded-md text-sm">
          {verifyState.error}
        </div>
      )}

      <input type="hidden" name="phone" value={phone} />

      <div>
        <label htmlFor="token" className="block text-sm font-medium text-zinc-200 mb-1">
          Verification Code
        </label>
        <p className="text-sm text-zinc-400 mb-2">
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
          className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
        />
      </div>

      <SubmitButton label="Verify Code" pendingLabel="Verifying..." />

      <button
        type="button"
        onClick={handleBack}
        className="w-full text-sm text-zinc-500 hover:text-green-400"
      >
        Back — use a different number
      </button>
    </form>
  )
}
