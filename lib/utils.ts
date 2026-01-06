import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatReadableDate(date: string | Date | null | undefined) {
  if (!date) return 'Invalid date'
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return 'Invalid date'

  if (isToday(d)) {
    return `Today, ${format(d, 'h:mm a')}`
  }
  if (isYesterday(d)) {
    return `Yesterday, ${format(d, 'h:mm a')}`
  }
  return format(d, 'MMM d, yyyy • h:mm a')
}

export function formatRelativeTime(date: string | Date | null | undefined) {
  if (!date) return 'Just now'
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return 'Just now'

  return formatDistanceToNow(d, { addSuffix: true })
}

export function getFreshnessLevel(date: string | Date | null | undefined) {
  if (!date) return { label: '', color: '' }
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return { label: '', color: '' }

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 2) return { label: 'Fresh', color: 'text-emerald-500' }
  if (diffHours < 6) return { label: 'Good', color: 'text-amber-500' }
  return { label: 'Check', color: 'text-slate-400' }
}

export function formatMonthYear(date: string | Date | null | undefined) {
  if (!date) return 'Recently'
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return 'Recently'

  return format(d, 'MMMM yyyy')
}
