'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFoursome } from '@/lib/actions/foursomes'

interface FoursomeMember {
  user_id: string
  team_id: string
  cart_number: 1 | 2
  user?: { id: string; full_name: string }
  team?: { id: string; team_name: string; team_number: number }
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
}

type SlotKey = 'slot1-cart1' | 'slot1-cart2' | 'slot2-cart1' | 'slot2-cart2'

interface GolferCard {
  user_id: string
  team_id: string
  fullName: string
  teamName: string
  teamNumber: number
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
      slots[key].push({
        user_id: m.user_id,
        team_id: m.team_id,
        fullName: m.user?.full_name || 'Unknown',
        teamName: m.team?.team_name || '',
        teamNumber: m.team?.team_number || 0,
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
  onDragStart: (e: React.DragEvent, userId: string, fromSlot: SlotKey) => void
  onDragOver: (e: React.DragEvent, slotKey: SlotKey) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, slotKey: SlotKey) => void
}

function CartDropZone({ slotKey, cartNum, golfers, isOver, onDragStart, onDragOver, onDragLeave, onDrop }: CartDropZoneProps) {
  const c = cartStyle[cartNum]
  return (
    <div
      className={`p-3 rounded-lg border-2 transition-colors ${
        isOver ? 'border-green-400 bg-green-50' : `${c.bg} ${c.border}`
      }`}
      onDragOver={(e) => onDragOver(e, slotKey)}
      onDragLeave={(e) => onDragLeave(e)}
      onDrop={(e) => onDrop(e, slotKey)}
    >
      <h4 className={`font-semibold mb-2 text-sm ${c.header}`}>🛒 Cart {cartNum}</h4>
      <div className="space-y-1.5 min-h-[3rem]">
        {golfers.map((g) => (
          <div
            key={g.user_id}
            draggable
            onDragStart={(e) => onDragStart(e, g.user_id, slotKey)}
            className="flex items-center justify-between bg-white rounded px-2 py-1.5 shadow-sm cursor-grab active:cursor-grabbing select-none border border-gray-200 hover:border-gray-300"
          >
            <div>
              <div className="font-medium text-sm">{g.fullName}</div>
              <div className="text-xs text-gray-500">{g.teamName}</div>
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded ${c.badge}`}>
              #{g.teamNumber}
            </span>
          </div>
        ))}
        {golfers.length === 0 && (
          <div className="text-xs text-gray-400 italic text-center py-2">Drop here</div>
        )}
      </div>
    </div>
  )
}

export function DraggableFoursomes({ foursomes, roundId, teeTime }: DraggableFoursomesProps) {
  const router = useRouter()
  const [slots, setSlots] = useState<Record<SlotKey, GolferCard[]>>(() => buildInitialSlots(foursomes))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<SlotKey | null>(null)

  const handleDragStart = (e: React.DragEvent, userId: string, fromSlot: SlotKey) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ userId, fromSlot }))
  }

  const handleDragOver = (e: React.DragEvent, slotKey: SlotKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(slotKey)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely (not moving into a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(null)
    }
  }

  const handleDrop = (e: React.DragEvent, toSlot: SlotKey) => {
    e.preventDefault()
    setDragOver(null)

    const raw = e.dataTransfer.getData(DRAG_KEY)
    if (!raw) return
    const { userId, fromSlot } = JSON.parse(raw) as { userId: string; fromSlot: SlotKey }

    if (fromSlot === toSlot) return

    setSlots((prev) => {
      const fromList = [...prev[fromSlot]]
      const toList = [...prev[toSlot]]

      const fromIdx = fromList.findIndex((g) => g.user_id === userId)
      if (fromIdx === -1) return prev

      const [moved] = fromList.splice(fromIdx, 1)

      // If target cart is full, swap last occupant back to source
      if (toList.length >= 2) {
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

  const dropProps = {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }

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

      <p className="text-sm text-gray-500 mb-4">Drag golfers between tee time slots and carts to rearrange.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h3 className="text-lg font-semibold">Tee Time Slot 1</h3>
            {slot1Time && <p className="text-green-100">{slot1Time}</p>}
          </div>
          <div className="p-4 space-y-3">
            <CartDropZone slotKey="slot1-cart1" cartNum={1} golfers={slots['slot1-cart1']} isOver={dragOver === 'slot1-cart1'} {...dropProps} />
            <CartDropZone slotKey="slot1-cart2" cartNum={2} golfers={slots['slot1-cart2']} isOver={dragOver === 'slot1-cart2'} {...dropProps} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h3 className="text-lg font-semibold">Tee Time Slot 2</h3>
            {slot2Time && <p className="text-green-100">{slot2Time}</p>}
          </div>
          <div className="p-4 space-y-3">
            <CartDropZone slotKey="slot2-cart1" cartNum={1} golfers={slots['slot2-cart1']} isOver={dragOver === 'slot2-cart1'} {...dropProps} />
            <CartDropZone slotKey="slot2-cart2" cartNum={2} golfers={slots['slot2-cart2']} isOver={dragOver === 'slot2-cart2'} {...dropProps} />
          </div>
        </div>
      </div>

      {totalGolfers !== 8 && (
        <p className="mt-3 text-xs text-red-500">
          Warning: {totalGolfers} golfer(s) across all slots — expected 8.
        </p>
      )}
    </div>
  )
}
