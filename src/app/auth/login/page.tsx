'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLang()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!email.trim()) errs.email = 'Campo obbligatorio'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email non valida'
    if (!password) errs.password = 'Campo obbligatorio'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signInError) {
        setError('Credenziali non valide. Riprova.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Errore imprevisto. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-night flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div aria-hidden className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 60%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-syne font-black text-3xl text-white">FANT</span>
            <span className="font-syne font-black text-3xl gradient-text-ai">AI</span>
            <span className="font-syne font-black text-3xl text-white">D</span>
          </Link>
          <h1 className="text-2xl font-syne font-black text-white mb-1">{t.auth_login_title}</h1>
          <p className="text-slate-400 text-sm">{t.auth_login_subtitle}</p>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="bg-red-500/10 rounded-2xl px-4 py-3 mb-5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">{t.auth_email}</label>
              <input
                type="email"
                placeholder="nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="bg-night-1 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm transition-all focus:bg-night-2"
              />
              {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">{t.auth_password}</label>
                <span className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
                  {t.auth_forgot}
                </span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-night-1 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm transition-all focus:bg-night-2"
              />
              {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-hover transition-all shadow-blue-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t.auth_login_btn}
            </button>
          </form>

          <div className="mt-6 text-center pt-5 border-t border-white/[0.06]">
            <p className="text-slate-500 text-sm">
              {t.auth_no_account}{' '}
              <Link href="/auth/register" className="text-blue-light font-semibold hover:text-white transition-colors">
                {t.auth_register_link}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
