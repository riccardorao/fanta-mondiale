'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/contexts/LanguageContext'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useLang()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = 'Min. 8'
    if (password !== confirm) errs.confirm = 'Le password non coincidono'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const supabase = createClient()
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(t.auth_reset_invalid)
      } else {
        toast.success(t.auth_reset_success)
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError(t.auth_reset_invalid)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-syne font-black text-3xl text-ink">FANT</span>
            <span className="font-syne font-black text-3xl gradient-text-ai">AI</span>
            <span className="font-syne font-black text-3xl text-ink">D</span>
          </Link>
          <h1 className="text-2xl font-syne font-black text-ink mb-1">{t.auth_reset_title}</h1>
          <p className="text-ink-soft text-sm">{t.auth_reset_subtitle}</p>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="bg-red-500/10 rounded-2xl px-4 py-3 mb-5 text-red-500 text-sm">
              {error}{' '}
              <Link href="/auth/login" className="underline hover:text-red-300">
                {t.auth_login_link}
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft">{t.auth_reset_new}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="bg-night-1 rounded-xl px-4 py-3 text-ink placeholder-ink-muted text-sm transition-all focus:bg-night-2"
              />
              {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft">{t.auth_confirm_password}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="bg-night-1 rounded-xl px-4 py-3 text-ink placeholder-ink-muted text-sm transition-all focus:bg-night-2"
              />
              {fieldErrors.confirm && <p className="text-xs text-red-500">{fieldErrors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-hover transition-all shadow-blue-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t.auth_reset_btn}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
