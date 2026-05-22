import { getViewerContext } from '@/lib/viewer'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const ctx = await getViewerContext()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const calendarUrl = `${siteUrl}/api/calendar`
  const webcalUrl = calendarUrl.replace(/^https?:\/\//, 'webcal://')
  return (
    <ProfileClient
      isImpersonating={ctx?.isImpersonating ?? false}
      webcalUrl={webcalUrl}
      calendarUrl={calendarUrl}
    />
  )
}
