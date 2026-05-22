'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid')) {
          setError('Invalid email or password. Please try again.')
        } else if (signInError.message.toLowerCase().includes('confirm')) {
          setError('Please verify your email address before logging in.')
        } else {
          setError(signInError.message)
        }
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f2318] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to manage your predictions</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="luca@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Password <span className="text-[#d4af37]">*</span>
                </label>
                <span className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={`bg-[#0f2318] border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-colors duration-150 ${
                  fieldErrors.password ? 'border-red-500' : 'border-[#2d5a3d]'
                }`}
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-[#2d5a3d] pt-5">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="text-[#d4af37] font-semibold hover:text-[#f0d060] transition-colors"
              >
                Register free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
