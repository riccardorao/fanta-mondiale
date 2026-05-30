import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'red' | 'gray' | 'blue' | 'green'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-dim text-blue-light',
  gold: 'bg-amber-accent/10 text-amber-accent',
  red: 'bg-red-500/15 text-red-400',
  gray: 'bg-night-3 text-slate-400',
  blue: 'bg-blue-dim text-blue-light',
  green: 'bg-emerald-500/15 text-emerald-400',
}

export default function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
