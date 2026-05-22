import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'red' | 'gray' | 'blue' | 'green'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[#1a3d2b] border border-[#2d5a3d] text-green-400',
  gold: 'bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37]',
  red: 'bg-red-900/30 border border-red-700/40 text-red-400',
  gray: 'bg-gray-800/50 border border-gray-700/40 text-gray-400',
  blue: 'bg-blue-900/30 border border-blue-700/40 text-blue-400',
  green: 'bg-green-900/30 border border-green-700/40 text-green-400',
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
