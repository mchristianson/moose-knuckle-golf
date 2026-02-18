'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { generateFoursomeAssignment } from '@/lib/algorithms/foursome-generator'

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

export async function generateFoursomes(roundId: string) {
  try {
    const { supabase, user } = await getAdminUser()

    // Get the round and verify it exists
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('id, round_number, round_date')
      .eq('id', roundId)
      .single()

    if (roundError || !round) {
      return { error: 'Round not found' }
    }

    // Get all available golfers for this round (those marked 'in')
    const { data: availability, error: availError } = await supabase
      .from('round_availability')
      .select(
        `
        *,
        user:user_id (
          id,
          full_name
        )
      `
      )
      .eq('round_id', roundId)
      .eq('status', 'in')

    if (availError) {
      return { error: 'Failed to load availability' }
    }

    if (!availability || availability.length !== 8) {
      return { error: `Expected 8 available golfers, found ${availability?.length || 0}` }
    }

    // Convert to golfer objects
    const golfers = availability.map((avail) => ({
      userId: avail.user_id,
      teamId: avail.team_id,
      fullName: avail.user?.full_name || 'Unknown',
    }))

    // Get pairing history from past rounds (optional)
    // For now, skip history to keep implementation simple
    const pairingHistory = undefined

    // Generate the optimal foursome assignment
    const { foursomes } = generateFoursomeAssignment(golfers, pairingHistory)

    // Delete any existing foursomes for this round
    await supabase.from('foursomes').delete().eq('round_id', roundId)
    await supabase.from('foursome_members').delete().match({ foursome_id: null })

    // Insert the new foursomes
    const foursome1 = foursomes[0]
    const foursome2 = foursomes[1]

    const { data: f1, error: f1Error } = await supabase
      .from('foursomes')
      .insert({
        round_id: roundId,
        tee_time_slot: 1,
      })
      .select('id')
      .single()

    if (f1Error) {
      return { error: `Failed to create first foursome: ${f1Error.message}` }
    }

    const { data: f2, error: f2Error } = await supabase
      .from('foursomes')
      .insert({
        round_id: roundId,
        tee_time_slot: 2,
      })
      .select('id')
      .single()

    if (f2Error) {
      return { error: `Failed to create second foursome: ${f2Error.message}` }
    }

    // Insert foursome members for first foursome
    const f1Members = [
      ...foursome1.carts.cart1.map((golfer, idx) => ({
        foursome_id: f1.id,
        user_id: golfer.userId,
        team_id: golfer.teamId,
        cart_number: 1 as const,
      })),
      ...foursome1.carts.cart2.map((golfer, idx) => ({
        foursome_id: f1.id,
        user_id: golfer.userId,
        team_id: golfer.teamId,
        cart_number: 2 as const,
      })),
    ]

    const { error: f1MembersError } = await supabase
      .from('foursome_members')
      .insert(f1Members)

    if (f1MembersError) {
      return { error: `Failed to add members to first foursome: ${f1MembersError.message}` }
    }

    // Insert foursome members for second foursome
    const f2Members = [
      ...foursome2.carts.cart1.map((golfer, idx) => ({
        foursome_id: f2.id,
        user_id: golfer.userId,
        team_id: golfer.teamId,
        cart_number: 1 as const,
      })),
      ...foursome2.carts.cart2.map((golfer, idx) => ({
        foursome_id: f2.id,
        user_id: golfer.userId,
        team_id: golfer.teamId,
        cart_number: 2 as const,
      })),
    ]

    const { error: f2MembersError } = await supabase
      .from('foursome_members')
      .insert(f2Members)

    if (f2MembersError) {
      return { error: `Failed to add members to second foursome: ${f2MembersError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'generate_foursomes',
      entity_type: 'foursomes',
      entity_id: roundId,
      new_value: {
        foursome_1: foursomes[0].golfers.map((g) => ({ userId: g.userId, name: g.fullName })),
        foursome_2: foursomes[1].golfers.map((g) => ({ userId: g.userId, name: g.fullName })),
      },
      metadata: { round_id: roundId },
    })

    return {
      success: true,
      data: {
        foursomes: [
          {
            id: f1.id,
            teeTimeSlot: 1,
            golfers: foursome1.golfers,
            carts: foursome1.carts,
          },
          {
            id: f2.id,
            teeTimeSlot: 2,
            golfers: foursome2.golfers,
            carts: foursome2.carts,
          },
        ],
      },
    }
  } catch (error) {
    console.error('Error generating foursomes:', error)
    return { error: 'Failed to generate foursomes' }
  }
}

export async function updateFoursome(
  roundId: string,
  foursome1Members: Array<{ userId: string; teamId: string; cartNumber: 1 | 2 }>,
  foursome2Members: Array<{ userId: string; teamId: string; cartNumber: 1 | 2 }>
) {
  try {
    const { supabase, user } = await getAdminUser()

    // Get the foursomes for this round
    const { data: foursomes, error: fsError } = await supabase
      .from('foursomes')
      .select('id, tee_time_slot')
      .eq('round_id', roundId)
      .order('tee_time_slot')

    if (fsError || !foursomes || foursomes.length !== 2) {
      return { error: 'Could not find foursomes for this round' }
    }

    const foursome1Id = foursomes[0].id
    const foursome2Id = foursomes[1].id

    // Delete old members
    await supabase.from('foursome_members').delete().eq('foursome_id', foursome1Id)
    await supabase.from('foursome_members').delete().eq('foursome_id', foursome2Id)

    // Insert new members for foursome 1
    const f1Data = foursome1Members.map((member) => ({
      foursome_id: foursome1Id,
      user_id: member.userId,
      team_id: member.teamId,
      cart_number: member.cartNumber,
    }))

    const { error: f1Error } = await supabase.from('foursome_members').insert(f1Data)

    if (f1Error) {
      return { error: `Failed to update first foursome: ${f1Error.message}` }
    }

    // Insert new members for foursome 2
    const f2Data = foursome2Members.map((member) => ({
      foursome_id: foursome2Id,
      user_id: member.userId,
      team_id: member.teamId,
      cart_number: member.cartNumber,
    }))

    const { error: f2Error } = await supabase.from('foursome_members').insert(f2Data)

    if (f2Error) {
      return { error: `Failed to update second foursome: ${f2Error.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'update_foursomes',
      entity_type: 'foursomes',
      entity_id: roundId,
      metadata: {
        round_id: roundId,
        method: 'manual_adjustment',
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating foursomes:', error)
    return { error: 'Failed to update foursomes' }
  }
}
