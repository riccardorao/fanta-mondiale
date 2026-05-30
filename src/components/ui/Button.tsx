'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[#d4af37] text-[#0f2318] font-bold hover:bg-[#f0d060] active:bg-[#a88a20] disabled:bg-[#a88a20]/50 disabled:text-[#0f2318]/50',
  secondary:
    'bg-[#1a3d2b] border border-[#2d5a3d] text-white hover:border-[#d4af37] hover:text-[#d4af37] active:bg-[#0f2318] disabled:opacity-50',
  outline:
    'bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 active:bg-[#d4af37]/20 disabled:opacity-50',
  ghost:
    'bg-transparent text-white hover:bg-[#1a3d2b] active:bg-[#0f2318] disabled:opacity-50',
  danger:
    'bg-red-600 text-white font-bold hover:bg-red-500 active:bg-red-700 disabled:bg-red-900 disabled:opacity-50',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:ring-offset-1 focus:ring-offset-[#0f2318] cursor-pointer disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 flex-shrink-0" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
