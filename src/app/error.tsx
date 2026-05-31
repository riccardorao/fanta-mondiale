'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLang()

  useEffect(() => {
    // Surfaced to the server logs / observability; no PII.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-xl font-syne font-black text-white mb-2">{t.err_500_title}</h1>
        <p className="text-slate-400 text-sm mb-6">{t.err_500_desc}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center bg-blue-primary text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-blue-hover transition-all shadow-blue-md active:scale-95"
          >
            {t.err_retry}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-night-3 text-white font-semibold px-6 py-3 rounded-2xl text-sm hover:bg-night-4 transition-all active:scale-95"
          >
            {t.err_home}
          </Link>
        </div>
      </div>
    </div>
  )
}
