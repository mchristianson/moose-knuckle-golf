'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return { supabase, user }
}

export async function createRound(prevState: any, formData: FormData) {
  const { supabase, user } = await getAdminUser()

  const roundNumber = parseInt(formData.get('roundNumber') as string)
  const roundDate = formData.get('roundDate') as string
  const roundType = formData.get('roundType') as string || 'regular'
  const notes = formData.get('notes') as string
  const seasonYear = parseInt(formData.get('seasonYear') as string) || new Date().getFullYear()

  // Calculate availability deadline (Tuesday before Thursday at 6pm)
  const roundDateObj = new Date(roundDate)
  const availabilityDeadline = new Date(roundDateObj)
  availabilityDeadline.setDate(availabilityDeadline.getDate() - 2) // 2 days before
  availabilityDeadline.setHours(18, 0, 0, 0) // 6pm

  if (!roundNumber || !roundDate) {
    return { error: 'Round number and date are required' }
  }

  const { data: round, error } = await supabase
    .from('rounds')
    .insert({
      round_number: roundNumber,
      round_date: roundDate,
      round_type: roundType,
      season_year: seasonYear,
      availability_deadline: availabilityDeadline.toISOString(),
      notes: notes || null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Create availability records for all team members
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      team_members (
        user_id
      )
    `)
    .eq('season_year', seasonYear)

  if (teams) {
    const availabilityRecords = []
    for (const team of teams) {
      for (const member of team.team_members as any[]) {
        availabilityRecords.push({
          round_id: round.id,
          user_id: member.user_id,
          team_id: team.id,
          status: 'undeclared',
        })
      }
    }

    if (availabilityRecords.length > 0) {
      await supabase.from('round_availability').insert(availabilityRecords)
    }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_created',
    entity_type: 'round',
    entity_id: round.id,
    new_value: round,
  })

  revalidatePath('/admin/rounds')
  redirect('/admin/rounds')
}

export async function updateRoundStatus(roundId: string, newStatus: string) {
  const { supabase, user } = await getAdminUser()

  const { data: oldRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  const { error } = await supabase
    .from('rounds')
    .update({ status: newStatus })
    .eq('id', roundId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_status_updated',
    entity_type: 'round',
    entity_id: roundId,
    old_value: { status: oldRound?.status },
    new_value: { status: newStatus },
  })

  revalidatePath('/admin/rounds')
  revalidatePath(`/admin/rounds/${roundId}`)
  return { success: true }
}

export async function deleteRound(roundId: string) {
  const { supabase, user } = await getAdminUser()

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  const { error } = await supabase
    .from('rounds')
    .delete()
    .eq('id', roundId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_deleted',
    entity_type: 'round',
    entity_id: roundId,
    old_value: round,
  })

  revalidatePath('/admin/rounds')
  return { success: true }
}
