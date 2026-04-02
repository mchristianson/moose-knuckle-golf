import { createClient } from '@/lib/supabase/server'

function formatICalDate(dateStr: string, timeStr: string | null): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM:SS or HH:MM or null
  const date = dateStr.replace(/-/g, '')
  if (!timeStr) {
    return date // all-day event date
  }
  const [hours, minutes] = timeStr.split(':').map(Number)
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  return `${date}T${hh}${mm}00`
}

function addHoursToICalDate(icalDate: string, hours: number): string {
  // icalDate: YYYYMMDDTHHMMSS
  const year = parseInt(icalDate.slice(0, 4))
  const month = parseInt(icalDate.slice(4, 6)) - 1
  const day = parseInt(icalDate.slice(6, 8))
  const hour = parseInt(icalDate.slice(9, 11))
  const minute = parseInt(icalDate.slice(11, 13))
  const d = new Date(year, month, day, hour, minute)
  d.setHours(d.getHours() + hours)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export async function GET() {
  const supabase = await createClient()

  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('id, round_number, round_date, tee_time, course, notes, season_year')
    .neq('status', 'cancelled')
    .order('round_date', { ascending: true })

  if (error) {
    return new Response('Failed to fetch rounds', { status: 500 })
  }

  const events = (rounds || []).map((round) => {
    const dtstart = formatICalDate(round.round_date, round.tee_time)
    const isAllDay = !round.tee_time

    let dtStartLine: string
    let dtEndLine: string

    if (isAllDay) {
      dtStartLine = `DTSTART;VALUE=DATE:${dtstart}`
      dtEndLine = `DTEND;VALUE=DATE:${dtstart}`
    } else {
      const dtend = addHoursToICalDate(dtstart, 4)
      dtStartLine = `DTSTART:${dtstart}`
      dtEndLine = `DTEND:${dtend}`
    }

    const summary = `MKG Round ${round.round_number} (${round.season_year})`
    const lines = [
      'BEGIN:VEVENT',
      `UID:${round.id}@moose-knuckle-golf`,
      dtStartLine,
      dtEndLine,
      `SUMMARY:${escapeICalText(summary)}`,
    ]

    if (round.course) {
      lines.push(`LOCATION:${escapeICalText(round.course)}`)
    }
    if (round.notes) {
      lines.push(`DESCRIPTION:${escapeICalText(round.notes)}`)
    }

    lines.push('END:VEVENT')
    return lines.join('\r\n')
  })

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Moose Knuckle Golf//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Moose Knuckle Golf',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(calendar, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="moose-knuckle-golf.ics"',
      'Cache-Control': 'no-cache',
    },
  })
}
