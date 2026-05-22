import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  return format(parseISO(dateStr), 'MMM d, HH:mm')
}

export function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  return format(parseISO(dateStr), 'MMMM d, yyyy HH:mm')
}

export function getMatchResult(homeScore: number | null, awayScore: number | null): '1' | 'X' | '2' | null {
  if (homeScore === null || awayScore === null) return null
  if (homeScore > awayScore) return '1'
  if (homeScore === awayScore) return 'X'
  return '2'
}

export function isPredictionLocked(scheduledAt: string | null, deadlineOverride?: string): boolean {
  const deadline = deadlineOverride || process.env.NEXT_PUBLIC_PREDICTIONS_DEADLINE
  if (deadline) {
    return new Date() >= new Date(deadline)
  }
  if (!scheduledAt) return false
  return new Date() >= new Date(scheduledAt)
}
