'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/contexts/LanguageContext'

export default function RegisterPage() {
  const { t } = useLang()
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
    if (!name.trim()) errs.name = 'Obbligatorio'
    if (!surname.trim()) errs.surname = 'Obbligatorio'
    if (!email.trim()) errs.email = 'Obbligatorio'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email non valida'
    if (!password) errs.password = 'Obbligatorio'
    else if (password.length < 8) errs.password = 'Min. 8 caratteri'
    if (password !== confirmPassword) errs.confirmPassword = 'Le password non coincidono'
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
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), surname: surname.trim() } },
      })
      if (signUpError) setError(signUpError.message)
      else setSuccess(true)
    } catch {
      setError('Errore imprevisto. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-night flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-syne font-black text-white mb-3">{t.auth_check_email_title}</h2>
          <p className="text-slate-400 mb-1 text-sm">
            {t.auth_check_email_desc}{' '}
            <span className="text-blue-light font-semibold">{email}</span>
          </p>
          <p className="text-slate-500 text-sm mb-6">{t.auth_check_email_sub}</p>
          <Link href="/auth/login" className="text-blue-light hover:text-white font-semibold transition-colors text-sm">
            {t.auth_back_login}
          </Link>
        </div>
      </div>
    )
  }

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    err?: string,
    opts?: { type?: string; placeholder?: string; autoComplete?: string }
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        type={opts?.type ?? 'text'}
        placeholder={opts?.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={opts?.autoComplete}
        className="bg-night-1 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm transition-all focus:bg-night-2"
      />
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-night flex items-center justify-center px-4 py-12">
      <div aria-hidden className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 60%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-syne font-black text-3xl text-white">FANT</span>
            <span className="font-syne font-black text-3xl gradient-text-ai">AI</span>
            <span className="font-syne font-black text-3xl text-white">D</span>
          </Link>
          <h1 className="text-2xl font-syne font-black text-white mb-1">{t.auth_register_title}</h1>
          <p className="text-slate-400 text-sm">{t.auth_register_subtitle}</p>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="bg-red-500/10 rounded-2xl px-4 py-3 mb-5 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              {field(t.auth_first_name, name, setName, fieldErrors.name, { placeholder: 'Luca', autoComplete: 'given-name' })}
              {field(t.auth_last_name, surname, setSurname, fieldErrors.surname, { placeholder: 'Rossi', autoComplete: 'family-name' })}
            </div>
            {field(t.auth_email, email, setEmail, fieldErrors.email, { type: 'email', placeholder: 'luca@esempio.com', autoComplete: 'email' })}
            {field(t.auth_password, password, setPassword, fieldErrors.password, { type: 'password', placeholder: 'Min. 8 caratteri', autoComplete: 'new-password' })}
            {field(t.auth_confirm_password, confirmPassword, setConfirmPassword, fieldErrors.confirmPassword, { type: 'password', placeholder: 'Ripeti la password', autoComplete: 'new-password' })}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-hover transition-all shadow-blue-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t.auth_register_btn}
            </button>
          </form>

          <div className="mt-6 text-center pt-5 border-t border-white/[0.06]">
            <p className="text-slate-500 text-sm">
              {t.auth_has_account}{' '}
              <Link href="/auth/login" className="text-blue-light font-semibold hover:text-white transition-colors">
                {t.auth_login_link}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
