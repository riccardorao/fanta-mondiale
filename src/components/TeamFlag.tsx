import { cn } from '@/lib/utils'
import type { Team } from '@/types/database'

interface TeamFlagProps {
  team: Team | null | undefined
  compact?: boolean
  className?: string
}

export default function TeamFlag({ team, compact = false, className }: TeamFlagProps) {
  if (!team) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-gray-500', className)}>
        <span className="text-lg">🏳️</span>
        {!compact && <span className="text-sm font-medium">TBD</span>}
      </span>
    )
  }

  if (compact) {
    return (
      <span
        className={cn('inline-flex items-center gap-1', className)}
        title={team.name}
      >
        <span className="text-xl leading-none">{team.flag_emoji}</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          {team.code}
        </span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="text-2xl leading-none">{team.flag_emoji}</span>
      <span className="text-sm font-semibold text-white">{team.name}</span>
    </span>
  )
}
