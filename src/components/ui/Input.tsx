'use client'

import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-300"
          >
            {label}
            {props.required && <span className="text-[#d4af37] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-[#0f2318] border border-[#2d5a3d] rounded-lg px-3 py-2 text-white placeholder-gray-500',
            'focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
