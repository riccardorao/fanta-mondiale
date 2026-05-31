'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useLang } from '@/contexts/LanguageContext'
import { SITE_URL, buildShareLinks } from '@/lib/links'

/**
 * Social share row: WhatsApp, X, Instagram, and copy-link — all pointing at the
 * website. On mobile the Instagram button opens the native share sheet (which
 * includes Instagram, Stories, etc.); on desktop it copies the link to paste.
 */
export default function ShareButtons() {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)

  const message = t.share_message
  const links = buildShareLinks(message, SITE_URL)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${message} ${SITE_URL}`)
      setCopied(true)
      toast.success(t.share_copied)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('—')
    }
  }

  const shareInstagram = async () => {
    // Instagram offers no web share-intent. Prefer the native share sheet
    // (covers Instagram on phones); otherwise copy the link to paste manually.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'FANTAID', text: message, url: SITE_URL })
        return
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    copyLink()
  }

  const base =
    'flex items-center justify-center gap-2 font-bold rounded-2xl px-4 py-3.5 text-base transition-all active:scale-95 text-white'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-[#25D366] hover:brightness-95`}
        aria-label={t.share_whatsapp}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        {t.share_whatsapp}
      </a>

      <a
        href={links.x}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-ink hover:brightness-110`}
        aria-label={t.share_x}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        {t.share_x}
      </a>

      <button
        onClick={shareInstagram}
        className={`${base} bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#962FBF] hover:brightness-105`}
        aria-label={t.share_instagram}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
        {t.share_instagram}
      </button>

      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-2 font-bold rounded-2xl px-4 py-3.5 text-base transition-all active:scale-95 bg-white text-ink border-2 border-ink/10 hover:border-purple-primary/40"
        aria-label={t.share_copy}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" aria-hidden>
          {copied ? (
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </>
          )}
        </svg>
        {copied ? t.share_copied : t.share_copy}
      </button>
    </div>
  )
}
