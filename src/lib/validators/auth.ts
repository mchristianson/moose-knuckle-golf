import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Enter a 10-digit US phone number'),
})

export const otpSchema = z.object({
  phone: z.string(), // hidden field, already validated in step 1
  token: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your text'),
})

export type PhoneInput = z.infer<typeof phoneSchema>
export type OtpInput = z.infer<typeof otpSchema>
