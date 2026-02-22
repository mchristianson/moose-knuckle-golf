'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFoursome, patchFoursomes } from '@/lib/actions/foursomes'

interface FoursomeMember {
  user_id: string | null
  team_id: string
  cart_number: 1 | 2
  is_sub?: boolean
  sub_id?: string | null
  user?: { id: string; full_name: string; display_name?: string } | null
  team?: { id: string; team_name: string; team_number: number }
  sub?: { id: string; full_name: string } | null
}

interface Foursome {
  id: string
  tee_time_slot: number
  members: FoursomeMember[]
}

interface DraggableFoursomesProps {
  foursomes: Foursome[]
  roundId: string
  teeTime?: string | null
  /** Map of user_id → availability status for this round */
  availabilityMap?: Record<string, string>
  /** Expected total number of golfers across all slots (defaults to 8) */
  expectedGolfers?: number
  /** Map of team_id → sub name for approved subs this round */
  subsByTeam?: Record<string, string>
}

type SlotKey = 'slot1-cart1' | 'slot1-cart2' | 'slot2-cart1' | 'slot2-cart2'

interface GolferCard {
  /** Unique identifier for drag: user_id for regular golfers, sub_id for pure subs */
  cardId: string
  user_id: string | null
  team_id: string
  fullName: string
  teamName: string
  teamNumber: number
  isSub: boolean
  subId?: string | null
}

function format12Hour(timeStr: string): string {
  if (!timeStr) return '—'
  const [hours, mins] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}

function buildInitialSlots(foursomes: Foursome[]): Record<SlotKey, GolferCard[]> {
  const slots: Record<SlotKey, GolferCard[]> = {
    'slot1-cart1': [],
    'slot1-cart2': [],
    'slot2-cart1': [],
    'slot2-cart2': [],
  }
  for (const fs of foursomes) {
    const slotNum = fs.tee_time_slot as 1 | 2
    for (const m of fs.members) {
      const key = `slot${slotNum}-cart${m.cart_number}` as SlotKey
      const isSub = m.is_sub === true
      const fullName = isSub
        ? (m.sub?.full_name || 'Unknown Sub')
        : ((m.user?.display_name ?? m.user?.full_name) || 'Unknown')
      const cardId = (isSub && !m.user_id) ? (m.sub_id ?? '') : (m.user_id ?? m.sub_id ?? '')
      slots[key].push({
        cardId,
        user_id: m.user_id,
        team_id: m.team_id,
        fullName,
        teamName: m.team?.team_name || '',
        teamNumber: m.team?.team_number || 0,
        isSub,
        subId: m.sub_id ?? null,
      })
    }
  }
  return slots
}

const DRAG_KEY = 'application/x-golfer'

const cartStyle = {
  1: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' },
  2: { bg: 'bg-orange-50', border: 'border-orange-200', header: 'text-orange-900', badge: 'bg-orange-100 text-orange-800' },
}

interface CartDropZoneProps {
  slotKey: SlotKey
  cartNum: 1 | 2
  golfers: GolferCard[]
  isOver: boolean
  dragOverCardId: string | null
  availabilityMap: Record<string, string>
  onDragStart: (e: React.DragEvent, cardId: string, fromSlot: SlotKey) => void
  onDragOverZone: (e: React.DragEvent, slotKey: SlotKey) => void
  onDragOverCard: (e: React.DragEvent, cardId: string) => void
  onDragLeaveZone: (e: React.DragEvent) => void
  onDropOnCard: (e: React.DragEvent, targetCardId: string, targetSlot: SlotKey) => void
  onDropOnZone: (e: React.DragEvent, slotKey: SlotKey) => void
}

function CartDropZone({
  slotKey, cartNum, golfers, isOver, dragOverCardId, availabilityMap,
  onDragStart, onDragOverZone, onDragOverCard, onDragLeaveZone, onDropOnCard, onDropOnZone,
}: CartDropZoneProps) {
  const c = cartStyle[cartNum]
  return (
    <div
      className={`p-3 rounded-lg border-2 transition-colors ${
        isOver && !dragOverCardId ? 'border-green-400 bg-green-50' : `${c.bg} ${c.border}`
      }`}
      onDragOver={(e) => onDragOverZone(e, slotKey)}
      onDragLeave={(e) => onDragLeaveZone(e)}
      onDrop={(e) => onDropOnZone(e, slotKey)}
    >
      <h4 className={`font-semibold mb-2 text-sm ${c.header}`}>🛒 Cart {cartNum}</h4>
      <div className="space-y-1.5 min-h-[3rem]">
        {golfers.map((g) => {
          const status = g.isSub ? 'in' : availabilityMap[g.user_id ?? '']
          const isOut = status === 'out'
          const isUndeclared = !g.isSub && (status === 'undeclared' || status === undefined)
          const isDropTarget = dragOverCardId === g.cardId
          return (
            <div
              key={g.cardId}
              draggable
              onDragStart={(e) => onDragStart(e, g.cardId, slotKey)}
              onDragOver={(e) => { e.stopPropagation(); onDragOverCard(e, g.cardId) }}
              onDrop={(e) => { e.stopPropagation(); onDropOnCard(e, g.cardId, slotKey) }}
              className={`flex items-center justify-between rounded px-2 py-1.5 shadow-sm cursor-grab active:cursor-grabbing select-none border transition-colors ${
                isDropTarget
                  ? 'border-green-400 bg-green-50 ring-2 ring-green-300'
                  : isOut
                  ? 'border-red-300 bg-red-50 hover:border-red-400'
                  : isUndeclared
                  ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-1.5">
                  {g.fullName}
                  {g.isSub && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                      SUB
                    </span>
                  )}
                  {isOut && (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      OUT
                    </span>
                  )}
                  {isUndeclared && (
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
                      ?
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{g.teamName}</div>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded ml-2 shrink-0 ${c.badge}`}>
                #{g.teamNumber}
              </span>
            </div>
          )
        })}
        {golfers.length === 0 && (
          <div className={`text-xs italic text-center py-2 rounded border border-dashed transition-colors ${
            isOver ? 'border-green-400 text-green-600 bg-green-50' : 'border-gray-300 text-gray-400'
          }`}>
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export function DraggableFoursomes({ foursomes, roundId, teeTime, availabilityMap = {}, expectedGolfers = 8, subsByTeam = {} }: DraggableFoursomesProps) {
  const router = useRouter()
  const [slots, setSlots] = useState<Record<SlotKey, GolferCard[]>>(() => buildInitialSlots(foursomes))
  const [saving, setSaving] = useState(false)
  const [patching, setPatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<SlotKey | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)

  const handlePatch = async () => {
    setPatching(true)
    setError(null)
    const result = await patchFoursomes(roundId)
    setPatching(false)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error || 'Failed to update assignments')
    }
  }

  const handleDragStart = (e: React.DragEvent, cardId: string, fromSlot: SlotKey) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ cardId, fromSlot }))
  }

  const handleDragOverZone = (e: React.DragEvent, slotKey: SlotKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(slotKey)
    // Don't clear dragOverCardId here — card's own handler sets it
  }

  const handleDragOverCard = (e: React.DragEvent, cardId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCardId(cardId)
  }

  const handleDragLeaveZone = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSlot(null)
      setDragOverCardId(null)
    }
  }

  /** Drop directly onto a specific golfer card — swap the two */
  const handleDropOnCard = (e: React.DragEvent, targetCardId: string, targetSlot: SlotKey) => {
    e.preventDefault()
    setDragOverSlot(null)
    setDragOverCardId(null)

    const raw = e.dataTransfer.getData(DRAG_KEY)
    if (!raw) return
    const { cardId: draggedId, fromSlot } = JSON.parse(raw) as { cardId: string; fromSlot: SlotKey }

    // Dropping onto yourself — no-op
    if (draggedId === targetCardId) return

    setSlots((prev) => {
      const fromList = [...prev[fromSlot]]
      const toList = fromSlot === targetSlot ? fromList : [...prev[targetSlot]]

      const fromIdx = fromList.findIndex((g) => g.cardId === draggedId)
      const toIdx = toList.findIndex((g) => g.cardId === targetCardId)
      if (fromIdx === -1 || toIdx === -1) return prev

      if (fromSlot === targetSlot) {
        // Same cart — just swap positions in the same array
        ;[fromList[fromIdx], fromList[toIdx]] = [fromList[toIdx], fromList[fromIdx]]
        return { ...prev, [fromSlot]: fromList }
      }

      // Different carts — swap the two golfers across lists
      const draggedCard = fromList[fromIdx]
      const targetCard = toList[toIdx]
      fromList[fromIdx] = targetCard
      toList[toIdx] = draggedCard

      return { ...prev, [fromSlot]: fromList, [targetSlot]: toList }
    })
  }

  /** Drop onto the cart zone background (not onto a specific card) — move to cart if space available */
  const handleDropOnZone = (e: React.DragEvent, toSlot: SlotKey) => {
    e.preventDefault()
    setDragOverSlot(null)
    setDragOverCardId(null)

    const raw = e.dataTransfer.getData(DRAG_KEY)
    if (!raw) return
    const { cardId, fromSlot } = JSON.parse(raw) as { cardId: string; fromSlot: SlotKey }

    if (fromSlot === toSlot) return

    setSlots((prev) => {
      const fromList = [...prev[fromSlot]]
      const toList = [...prev[toSlot]]

      const fromIdx = fromList.findIndex((g) => g.cardId === cardId)
      if (fromIdx === -1) return prev

      const [moved] = fromList.splice(fromIdx, 1)

      if (toList.length >= 2) {
        // Cart full — swap with last occupant to keep counts balanced
        fromList.push(toList.pop()!)
      }

      toList.push(moved)
      return { ...prev, [fromSlot]: fromList, [toSlot]: toList }
    })
  }

  const initialSlots = buildInitialSlots(foursomes)
  const isDirty = JSON.stringify(slots) !== JSON.stringify(initialSlots)
  const totalGolfers = Object.values(slots).reduce((sum, list) => sum + list.length, 0)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const toMember = (g: GolferCard, cartNumber: 1 | 2) => ({
      userId: g.user_id,
      teamId: g.team_id,
      cartNumber,
      subId: g.subId,
      isSub: g.isSub,
    })

    const result = await updateFoursome(
      roundId,
      [...slots['slot1-cart1'].map((g) => toMember(g, 1)), ...slots['slot1-cart2'].map((g) => toMember(g, 2))],
      [...slots['slot2-cart1'].map((g) => toMember(g, 1)), ...slots['slot2-cart2'].map((g) => toMember(g, 2))]
    )

    setSaving(false)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error || 'Failed to save')
    }
  }

  const slot1Time = teeTime ? format12Hour(teeTime) : null
  const slot2Time = teeTime ? format12Hour(addMinutesToTime(teeTime, 10)) : null

  const zoneProps = {
    onDragStart: handleDragStart,
    onDragOverZone: handleDragOverZone,
    onDragOverCard: handleDragOverCard,
    onDragLeaveZone: handleDragLeaveZone,
    onDropOnCard: handleDropOnCard,
    onDropOnZone: handleDropOnZone,
  }

  const allAssigned = Object.values(slots).flat()
  const outGolfers = allAssigned.filter((g) => !g.isSub && availabilityMap[g.user_id ?? ''] === 'out')
  const undeclaredGolfers = allAssigned.filter(
    (g) => !g.isSub && (availabilityMap[g.user_id ?? ''] === 'undeclared' || availabilityMap[g.user_id ?? ''] === undefined)
  )

  // A patch is needed when a currently-assigned non-sub golfer is 'out' AND their team
  // has an approved sub waiting to take their place.
  const needsPatch = outGolfers.some((g) => subsByTeam[g.team_id] !== undefined)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">Foursome Assignment</h2>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">Drag a golfer onto another to swap them, or onto an empty cart to move them.</p>

      {needsPatch && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Sub assigned after foursomes were set</p>
            <ul className="text-sm text-amber-700 list-disc list-inside">
              {outGolfers
                .filter((g) => subsByTeam[g.team_id] !== undefined)
                .map((g) => (
                  <li key={g.cardId}>
                    {g.fullName} → <span className="font-medium">{subsByTeam[g.team_id]}</span> ({g.teamName})
                  </li>
                ))}
            </ul>
          </div>
          <button
            onClick={handlePatch}
            disabled={patching}
            className="shrink-0 px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {patching ? 'Updating...' : 'Update Assignments'}
          </button>
        </div>
      )}

      {outGolfers.length > 0 && !needsPatch && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Availability mismatch — the following golfers are marked <strong>Out</strong> but are still assigned to a cart:</p>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {outGolfers.map((g) => (
              <li key={g.cardId}>{g.fullName} ({g.teamName})</li>
            ))}
          </ul>
          <p className="text-xs text-red-500 mt-1">Drag them out or re-generate foursomes to fix.</p>
        </div>
      )}

      {outGolfers.length > 0 && needsPatch && outGolfers.some((g) => !subsByTeam[g.team_id]) && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-700 mb-1">⚠️ The following golfers are marked <strong>Out</strong> with no sub assigned:</p>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {outGolfers.filter((g) => !subsByTeam[g.team_id]).map((g) => (
              <li key={g.cardId}>{g.fullName} ({g.teamName})</li>
            ))}
          </ul>
        </div>
      )}
      {undeclaredGolfers.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ The following golfers have not declared availability:</p>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {undeclaredGolfers.map((g) => (
              <li key={g.cardId}>{g.fullName} ({g.teamName})</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h3 className="text-lg font-semibold">Tee Time Slot 1</h3>
            {slot1Time && <p className="text-green-100">{slot1Time}</p>}
          </div>
          <div className="p-4 space-y-3">
            <CartDropZone slotKey="slot1-cart1" cartNum={1} golfers={slots['slot1-cart1']} isOver={dragOverSlot === 'slot1-cart1'} dragOverCardId={dragOverCardId} availabilityMap={availabilityMap} {...zoneProps} />
            <CartDropZone slotKey="slot1-cart2" cartNum={2} golfers={slots['slot1-cart2']} isOver={dragOverSlot === 'slot1-cart2'} dragOverCardId={dragOverCardId} availabilityMap={availabilityMap} {...zoneProps} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h3 className="text-lg font-semibold">Tee Time Slot 2</h3>
            {slot2Time && <p className="text-green-100">{slot2Time}</p>}
          </div>
          <div className="p-4 space-y-3">
            <CartDropZone slotKey="slot2-cart1" cartNum={1} golfers={slots['slot2-cart1']} isOver={dragOverSlot === 'slot2-cart1'} dragOverCardId={dragOverCardId} availabilityMap={availabilityMap} {...zoneProps} />
            <CartDropZone slotKey="slot2-cart2" cartNum={2} golfers={slots['slot2-cart2']} isOver={dragOverSlot === 'slot2-cart2'} dragOverCardId={dragOverCardId} availabilityMap={availabilityMap} {...zoneProps} />
          </div>
        </div>
      </div>

      {totalGolfers !== expectedGolfers && (
        <p className="mt-3 text-xs text-red-500">
          Warning: {totalGolfers} golfer(s) across all slots — expected {expectedGolfers}.
        </p>
      )}
    </div>
  )
}
