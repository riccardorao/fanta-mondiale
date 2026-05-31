'use client'

import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'

export default function NotFound() {
  const { t } = useLang()
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
        <p className="text-7xl font-syne font-black gradient-text-ai mb-2">404</p>
        <h1 className="text-xl font-syne font-black text-white mb-2">{t.err_404_title}</h1>
        <p className="text-slate-400 text-sm mb-6">{t.err_404_desc}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-blue-primary text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-blue-hover transition-all shadow-blue-md active:scale-95"
        >
          {t.err_404_cta}
        </Link>
      </div>
    </div>
  )
}
