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
    'bg-blue-primary text-white font-bold hover:bg-blue-hover shadow-blue-sm active:scale-95 disabled:opacity-50',
  secondary:
    'bg-night-2 text-slate-300 hover:bg-night-3 hover:text-white active:bg-night-1 disabled:opacity-50',
  outline:
    'bg-transparent text-blue-light hover:bg-blue-dim active:bg-blue-dim/50 disabled:opacity-50',
  ghost:
    'bg-transparent text-slate-400 hover:bg-night-2 hover:text-white active:bg-night-1 disabled:opacity-50',
  danger:
    'bg-red-600 text-white font-bold hover:bg-red-500 active:bg-red-700 disabled:bg-red-900 disabled:opacity-50',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-2xl',
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
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none cursor-pointer disabled:cursor-not-allowed',
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
