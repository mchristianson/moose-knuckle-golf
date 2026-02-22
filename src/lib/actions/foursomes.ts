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

    // Count approved subs — each sub-assigned team removes one "in" slot
    const { count: subCount } = await supabase
      .from('round_subs')
      .select('id', { count: 'exact', head: true })
      .eq('round_id', roundId)
      .eq('status', 'approved')

    const expectedIn = 8 - (subCount ?? 0)

    if (!availability || availability.length !== expectedIn) {
      return { error: `Expected ${expectedIn} available golfers, found ${availability?.length || 0}` }
    }

    // Fetch approved subs for this round
    const { data: roundSubs, error: roundSubsError } = await supabase
      .from('round_subs')
      .select('id, team_id, sub_id, subs(full_name, user_id)')
      .eq('round_id', roundId)
      .eq('status', 'approved')

    if (roundSubsError) {
      return { error: 'Failed to load round subs' }
    }

    // Convert regular golfers to golfer objects
    const regularGolfers = availability.map((avail) => ({
      userId: avail.user_id,
      teamId: avail.team_id,
      fullName: avail.user?.full_name || 'Unknown',
      isSub: false as const,
    }))

    // Convert subs to golfer objects
    const subGolfers = (roundSubs ?? []).map((rs: any) => ({
      userId: rs.subs?.user_id ?? null,
      teamId: rs.team_id,
      fullName: rs.subs?.full_name || 'Unknown Sub',
      subId: rs.sub_id,
      isSub: true as const,
    }))

    const golfers = [...regularGolfers, ...subGolfers]

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
      ...foursome1.carts.cart1.map((golfer) => ({
        foursome_id: f1.id,
        user_id: golfer.userId ?? null,
        team_id: golfer.teamId,
        cart_number: 1 as const,
        is_sub: golfer.isSub ?? false,
        sub_id: golfer.subId ?? null,
      })),
      ...foursome1.carts.cart2.map((golfer) => ({
        foursome_id: f1.id,
        user_id: golfer.userId ?? null,
        team_id: golfer.teamId,
        cart_number: 2 as const,
        is_sub: golfer.isSub ?? false,
        sub_id: golfer.subId ?? null,
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
      ...foursome2.carts.cart1.map((golfer) => ({
        foursome_id: f2.id,
        user_id: golfer.userId ?? null,
        team_id: golfer.teamId,
        cart_number: 1 as const,
        is_sub: golfer.isSub ?? false,
        sub_id: golfer.subId ?? null,
      })),
      ...foursome2.carts.cart2.map((golfer) => ({
        foursome_id: f2.id,
        user_id: golfer.userId ?? null,
        team_id: golfer.teamId,
        cart_number: 2 as const,
        is_sub: golfer.isSub ?? false,
        sub_id: golfer.subId ?? null,
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

/**
 * Patch existing foursomes in place after availability changes (e.g. a sub was added
 * after foursomes were already set). Preserves every golfer's current slot/cart position
 * and only makes the minimum changes needed:
 *   - Removes golfers whose teams now have an approved sub (they are marked 'out')
 *   - Inserts the sub into that same slot/cart position
 *   - Removes golfers marked 'out' who don't have a sub replacement
 *   - Adds any newly-available 'in' golfers not yet in a foursome into vacated slots
 */
export async function patchFoursomes(roundId: string) {
  try {
    const { supabase, user } = await getAdminUser()

    // Load existing foursomes with members
    const { data: existingFoursomes, error: fsError } = await supabase
      .from('foursomes')
      .select(`
        id,
        tee_time_slot,
        members:foursome_members (
          id,
          user_id,
          team_id,
          cart_number,
          is_sub,
          sub_id
        )
      `)
      .eq('round_id', roundId)
      .order('tee_time_slot')

    if (fsError || !existingFoursomes || existingFoursomes.length !== 2) {
      return { error: 'Could not load existing foursomes' }
    }

    // Load current availability (who is 'in')
    const { data: availability } = await supabase
      .from('round_availability')
      .select('user_id, team_id, status')
      .eq('round_id', roundId)

    const inUserIds = new Set(
      (availability ?? []).filter((a) => a.status === 'in').map((a) => a.user_id)
    )

    // Load approved subs (team_id → sub info)
    const { data: roundSubs } = await supabase
      .from('round_subs')
      .select('team_id, sub_id, subs(full_name, user_id)')
      .eq('round_id', roundId)
      .eq('status', 'approved')

    const subByTeam = new Map<string, { subId: string; userId: string | null; fullName: string }>()
    for (const rs of roundSubs ?? []) {
      subByTeam.set(rs.team_id, {
        subId: rs.sub_id,
        userId: (rs.subs as any)?.user_id ?? null,
        fullName: (rs.subs as any)?.full_name ?? 'Unknown Sub',
      })
    }

    // Build the patched member lists for each foursome, preserving slot/cart positions.
    // For each existing member slot:
    //   - If that team now has an approved sub → replace with sub
    //   - If the golfer is now 'out' (no sub) → leave slot vacant
    //   - Otherwise keep as-is
    // Then fill vacant slots with any 'in' golfers not yet assigned.

    // Track which user_ids are already placed (to avoid double-assigning)
    const alreadyPlaced = new Set<string>()
    // Track which sub team_ids are already placed
    const subTeamsPlaced = new Set<string>()

    type PatchedMember = {
      foursome_id: string
      user_id: string | null
      team_id: string
      cart_number: 1 | 2
      is_sub: boolean
      sub_id: string | null
    }

    const patchedByFoursome: PatchedMember[][] = existingFoursomes.map((fs) => {
      const members: PatchedMember[] = []
      for (const m of fs.members) {
        const sub = subByTeam.get(m.team_id)
        if (sub) {
          // This team has a sub — put the sub in this slot
          if (!subTeamsPlaced.has(m.team_id)) {
            members.push({
              foursome_id: fs.id,
              user_id: sub.userId,
              team_id: m.team_id,
              cart_number: m.cart_number as 1 | 2,
              is_sub: true,
              sub_id: sub.subId,
            })
            subTeamsPlaced.add(m.team_id)
            if (sub.userId) alreadyPlaced.add(sub.userId)
          }
          // else: sub already placed (shouldn't happen — one member per team)
        } else if (m.is_sub) {
          // Previously a sub slot but sub was removed — treat as vacant (skip)
        } else if (m.user_id && inUserIds.has(m.user_id)) {
          // Regular golfer still 'in' — keep in place
          members.push({
            foursome_id: fs.id,
            user_id: m.user_id,
            team_id: m.team_id,
            cart_number: m.cart_number as 1 | 2,
            is_sub: false,
            sub_id: null,
          })
          alreadyPlaced.add(m.user_id)
        }
        // else: golfer is 'out' and no sub — slot becomes vacant
      }
      return members
    })

    // Collect 'in' golfers not yet placed (e.g. a previously-out golfer came back 'in')
    const unplacedGolfers = (availability ?? [])
      .filter((a) => a.status === 'in' && !alreadyPlaced.has(a.user_id) && !subByTeam.has(a.team_id))

    // Fill vacant spots (each foursome should have 4 members, carts of 2)
    // We need to find which cart slots are under capacity and fill them.
    // Build a structure: for each foursome, count members per cart and find gaps.
    const allPatched = patchedByFoursome.map((members, fsIdx) => {
      const fsId = existingFoursomes[fsIdx].id
      const cart1 = members.filter((m) => m.cart_number === 1)
      const cart2 = members.filter((m) => m.cart_number === 2)

      // Determine which teams are already in this foursome (to know what team an unplaced golfer belongs to)
      const teamsInFoursome = new Set(members.map((m) => m.team_id))

      // Try to place unplaced golfers whose team is already represented in this foursome's slot/cart
      // (This handles the case where a golfer's teammate was the declared one but now they're the one in)
      const remainingUnplaced: typeof unplacedGolfers = []
      for (const g of unplacedGolfers) {
        if (teamsInFoursome.has(g.team_id)) {
          // Find which cart their team is in
          const teamMember = members.find((m) => m.team_id === g.team_id)
          const cartNum = teamMember?.cart_number ?? (cart1.length <= cart2.length ? 1 : 2)
          members.push({
            foursome_id: fsId,
            user_id: g.user_id,
            team_id: g.team_id,
            cart_number: cartNum as 1 | 2,
            is_sub: false,
            sub_id: null,
          })
          alreadyPlaced.add(g.user_id)
        } else {
          remainingUnplaced.push(g)
        }
      }
      // Update unplacedGolfers in place (filter out the ones we just placed)
      unplacedGolfers.length = 0
      remainingUnplaced.forEach((g) => unplacedGolfers.push(g))

      return members
    })

    // Fill any remaining unplaced golfers into vacant cart slots across foursomes
    let unplacedIdx = 0
    for (const members of allPatched) {
      const fsId = members[0]?.foursome_id ?? existingFoursomes[allPatched.indexOf(members)].id
      const cart1Count = members.filter((m) => m.cart_number === 1).length
      const cart2Count = members.filter((m) => m.cart_number === 2).length

      if (cart1Count < 2 && unplacedIdx < unplacedGolfers.length) {
        const g = unplacedGolfers[unplacedIdx++]
        members.push({ foursome_id: fsId, user_id: g.user_id, team_id: g.team_id, cart_number: 1, is_sub: false, sub_id: null })
      }
      if (cart2Count < 2 && unplacedIdx < unplacedGolfers.length) {
        const g = unplacedGolfers[unplacedIdx++]
        members.push({ foursome_id: fsId, user_id: g.user_id, team_id: g.team_id, cart_number: 2, is_sub: false, sub_id: null })
      }
    }

    // Persist: delete existing members and re-insert patched lists
    for (let i = 0; i < existingFoursomes.length; i++) {
      const fsId = existingFoursomes[i].id
      await supabase.from('foursome_members').delete().eq('foursome_id', fsId)
      if (allPatched[i].length > 0) {
        const { error: insertError } = await supabase.from('foursome_members').insert(allPatched[i])
        if (insertError) {
          return { error: `Failed to patch foursome ${i + 1}: ${insertError.message}` }
        }
      }
    }

    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'patch_foursomes',
      entity_type: 'foursomes',
      entity_id: roundId,
      metadata: { round_id: roundId, method: 'patch' },
    })

    return { success: true }
  } catch (error) {
    console.error('Error patching foursomes:', error)
    return { error: 'Failed to patch foursomes' }
  }
}

export async function updateFoursome(
  roundId: string,
  foursome1Members: Array<{ userId: string | null; teamId: string; cartNumber: 1 | 2; subId?: string | null; isSub?: boolean }>,
  foursome2Members: Array<{ userId: string | null; teamId: string; cartNumber: 1 | 2; subId?: string | null; isSub?: boolean }>
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
      user_id: member.userId ?? null,
      team_id: member.teamId,
      cart_number: member.cartNumber,
      is_sub: member.isSub ?? false,
      sub_id: member.subId ?? null,
    }))

    const { error: f1Error } = await supabase.from('foursome_members').insert(f1Data)

    if (f1Error) {
      return { error: `Failed to update first foursome: ${f1Error.message}` }
    }

    // Insert new members for foursome 2
    const f2Data = foursome2Members.map((member) => ({
      foursome_id: foursome2Id,
      user_id: member.userId ?? null,
      team_id: member.teamId,
      cart_number: member.cartNumber,
      is_sub: member.isSub ?? false,
      sub_id: member.subId ?? null,
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
