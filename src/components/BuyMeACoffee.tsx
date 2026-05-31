'use client'

import { useLang } from '@/contexts/LanguageContext'
import { BUY_ME_A_COFFEE_URL } from '@/lib/links'

/** "Buy me a coffee" support button. */
export default function BuyMeACoffee() {
  const { t } = useLang()
  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 bg-[#FFDD00] text-ink font-extrabold rounded-2xl px-6 py-3.5 text-base shadow-md hover:brightness-95 transition-all active:scale-95"
    >
      <span className="text-xl" aria-hidden>☕</span>
      {t.coffee_text}
    </a>
  )
}
