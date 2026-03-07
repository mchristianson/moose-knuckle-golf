/**
 * Reference mapping of emoji to Heroicons
 * Use this file as a guide when replacing emoji with Heroicons throughout the app
 *
 * Import format:
 * import { TrophyIcon, ChartBarIcon, ... } from '@heroicons/react/24/solid'
 * import { Icon } from '@/components/Icon'
 *
 * Usage:
 * <Icon icon={TrophyIcon} size="md" ariaLabel="Leaderboard" />
 */

// Navigation & Status Icons
export const iconMappings = {
  // Trophies & Rankings
  trophy: '🏆 → TrophyIcon', // Leaderboard, rankings, 1st place
  silver_medal: '🥈 → ChartBarIcon + "2nd"', // Silver medal - 2nd place
  bronze_medal: '🥉 → ChartBarIcon + "3rd"', // Bronze medal - 3rd place

  // Data & Information
  chart: '📊 → ChartBarIcon', // Dashboard, data visualization
  clipboard: '📋 → ClipboardDocumentListIcon', // Scoring, forms, entries
  book: '📖 → BookOpenIcon', // Manual, documentation
  notes: '📝 → ClipboardDocumentListIcon', // Audit log, notes

  // People & Teams
  user: '👤 → UserIcon', // Single user profile
  users: '👥 → UsersIcon', // Multiple users, groups, subs

  // Golf-specific
  flag: '⛳ → FlagIcon', // Teams, golf indicators
  target: '🎯 → FlagIcon', // Handicaps, targets

  // Time & Calendar
  calendar: '📅 → CalendarIcon', // Rounds, scheduling
  clock: '🕐 → ClockIcon', // Tee times, time

  // Actions & Editing
  pencil: '✏️ → PencilIcon', // Edit actions
  trash: '🗑️ → TrashIcon', // Delete, remove
  lock: '🔒 → LockClosedIcon', // Locked scores
  pin: '📌 → ClipboardDocumentListIcon', // Pin, priority

  // Status & Indicators
  checkmark: '✓ → CheckIcon', // In, success, complete
  check_circle: '✅ → CheckIcon', // Completed
  x_mark: '✗ → XMarkIcon', // Out, cancel
  x_circle: '❌ → XMarkIcon', // Error, failed
  warning: '⚠️ → ExclamationTriangleIcon', // Warning, mismatch

  // Configuration & Settings
  gear: '⚙️ → Cog6ToothIcon', // Settings, admin

  // Other
  refresh: '🔄 → ArrowPathIcon', // Refresh, recalculate, retry
  loading: '⏳ → SparklesIcon', // Loading, saving, in progress (alternative: use animation)
  menu: '☰ → Bars3Icon', // Mobile menu hamburger
}

/**
 * Heroicons available in 'heroicons/react/24/solid':
 *
 * Most commonly used in this app:
 * - TrophyIcon
 * - ChartBarIcon
 * - ClipboardDocumentListIcon
 * - UserIcon
 * - UsersIcon
 * - Cog6ToothIcon
 * - BookOpenIcon
 * - FlagIcon
 * - CalendarIcon
 * - PencilIcon
 * - TrashIcon
 * - LockClosedIcon
 * - CheckIcon
 * - XMarkIcon
 * - ExclamationTriangleIcon
 * - ClockIcon
 * - ArrowPathIcon
 * - Bars3Icon
 *
 * Full list available at: https://heroicons.com/
 * All icons are 24px size in the 'solid' style (used in this app)
 */
