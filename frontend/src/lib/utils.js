import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

/** Format a date string for display */
export const fmtDate = (d) =>
  d ? format(new Date(d), 'MMM d, yyyy') : '—'

/** Relative time e.g. "3 days ago" */
export const fmtRelative = (d) =>
  d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—'

/** Short date e.g. "Mar 15" */
export const fmtShort = (d) =>
  d ? format(new Date(d), 'MMM d') : '—'

/** Human-readable due label */
export const dueDateLabel = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (isToday(date))    return 'Due today'
  if (isTomorrow(date)) return 'Due tomorrow'
  if (isPast(date))     return `Overdue (${fmtDate(d)})`
  return `Due ${fmtDate(d)}`
}

/** Status badge color classes */
export const statusColors = {
  pending:     'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled:   'bg-surface-100 text-surface-500 border border-surface-200',
  active:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive:    'bg-surface-100 text-surface-500 border border-surface-200',
  prospect:    'bg-purple-50 text-purple-700 border border-purple-200',
}

/** Priority badge color classes */
export const priorityColors = {
  low:    'bg-surface-50 text-surface-500 border border-surface-200',
  medium: 'bg-blue-50 text-blue-600 border border-blue-200',
  high:   'bg-orange-50 text-orange-600 border border-orange-200',
  urgent: 'bg-red-50 text-red-600 border border-red-200',
}

/** Priority sort order for display */
export const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

/** Capitalize first letter */
export const cap = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') : ''

/** Truncate long strings */
export const truncate = (s, n = 60) =>
  s && s.length > n ? s.slice(0, n) + '…' : s
