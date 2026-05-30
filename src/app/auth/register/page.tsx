'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const supabase = createClient()

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'First name is required'
    if (!surname.trim()) errs.surname = 'Last name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            surname: surname.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0f2318] flex items-center justify-center px-4">
        <div className="bg-[#1a3d2b]/50 border border-[#d4af37]/40 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
          <p className="text-gray-400 mb-2">
            We sent a verification link to{' '}
            <span className="text-[#d4af37] font-semibold">{email}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Click the link in the email to verify your account and start predicting!
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-[#d4af37] hover:text-[#f0d060] font-semibold transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f2318] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">
            Join Fanta Mondiale 2026 and start predicting
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Luca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last Name"
                placeholder="Rossi"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                error={fieldErrors.surname}
                required
                autoComplete="family-name"
              />
            </div>

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

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
              autoComplete="new-password"
              helperText="At least 8 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldErrors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-[#2d5a3d] pt-5">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-[#d4af37] font-semibold hover:text-[#f0d060] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
