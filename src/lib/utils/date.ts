/**
 * Format a time string (HH:MM) to 12-hour format (e.g., "3:20 PM").
 */
export function formatTeeTime(timeStr: string): string {
  if (!timeStr) return '—'
  const [hours, mins] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
}

/**
 * Format a date string (YYYY-MM-DD) to a localized date format.
 * Handles date-only strings without timezone conversion issues.
 */
export function formatRoundDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
