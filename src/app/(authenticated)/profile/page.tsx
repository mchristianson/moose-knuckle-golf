import { getViewerContext } from '@/lib/viewer'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const ctx = await getViewerContext()
  return <ProfileClient isImpersonating={ctx?.isImpersonating ?? false} />
}
