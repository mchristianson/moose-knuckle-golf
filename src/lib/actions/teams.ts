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

export async function createTeam(prevState: any, formData: FormData) {
  const { supabase, user } = await getAdminUser()

  const teamNumber = parseInt(formData.get('teamNumber') as string)
  const teamName = formData.get('teamName') as string
  const seasonYear = parseInt(formData.get('seasonYear') as string) || new Date().getFullYear()

  if (!teamNumber || !teamName) {
    return { error: 'Team number and name are required' }
  }

  if (teamNumber < 1 || teamNumber > 8) {
    return { error: 'Team number must be between 1 and 8' }
  }

  const { error } = await supabase
    .from('teams')
    .insert({
      team_number: teamNumber,
      team_name: teamName,
      season_year: seasonYear,
    })

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'team_created',
    entity_type: 'team',
    new_value: { team_number: teamNumber, team_name: teamName },
  })

  revalidatePath('/admin/teams')
  redirect('/admin/teams')
}

export async function updateTeam(teamId: string, teamName: string) {
  const { supabase, user } = await getAdminUser()

  const { data: oldTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  const { error } = await supabase
    .from('teams')
    .update({ team_name: teamName })
    .eq('id', teamId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'team_updated',
    entity_type: 'team',
    entity_id: teamId,
    old_value: oldTeam,
    new_value: { team_name: teamName },
  })

  revalidatePath('/admin/teams')
  return { success: true }
}

export async function addTeamMember(teamId: string, userId: string) {
  const { supabase, user } = await getAdminUser()

  // Check if team already has 2 members
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (count && count >= 2) {
    return { error: 'Team already has 2 members' }
  }

  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
    })

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'team_member_added',
    entity_type: 'team_member',
    new_value: { team_id: teamId, user_id: userId },
  })

  revalidatePath('/admin/teams')
  return { success: true }
}

export async function removeTeamMember(teamMemberId: string) {
  const { supabase, user } = await getAdminUser()

  const { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', teamMemberId)
    .single()

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', teamMemberId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'team_member_removed',
    entity_type: 'team_member',
    entity_id: teamMemberId,
    old_value: member,
  })

  revalidatePath('/admin/teams')
  return { success: true }
}

export async function deleteTeam(teamId: string) {
  const { supabase, user } = await getAdminUser()

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'team_deleted',
    entity_type: 'team',
    entity_id: teamId,
    old_value: team,
  })

  revalidatePath('/admin/teams')
  return { success: true }
}
