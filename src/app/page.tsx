'use client'

import Link from 'next/link'
import Countdown from '@/components/Countdown'
import { useLang } from '@/contexts/LanguageContext'

const TOURNAMENT_START = '2026-06-11T18:00:00Z'

const SCORING_ROWS = [
  { key: 'score_group_result',   pts: 10,  section: 'group' },
  { key: 'score_group_position', pts: 15,  section: 'group' },
  { key: 'score_exact',          pts: '+5', section: 'group' },
  { key: 'score_r16_correct',    pts: 15,  section: 'ko' },
  { key: 'score_r16_wrong',      pts: 10,  section: 'ko' },
  { key: 'score_qf_correct',     pts: 25,  section: 'ko' },
  { key: 'score_qf_wrong',       pts: 15,  section: 'ko' },
  { key: 'score_sf_correct',     pts: 40,  section: 'ko' },
  { key: 'score_sf_wrong',       pts: 25,  section: 'ko' },
  { key: 'score_final_correct',  pts: 70,  section: 'final' },
  { key: 'score_final_wrong',    pts: 40,  section: 'final' },
  { key: 'score_1st',            pts: 100, section: 'standings' },
  { key: 'score_2nd',            pts: 85,  section: 'standings' },
  { key: 'score_3rd',            pts: 65,  section: 'standings' },
  { key: 'score_4th',            pts: 50,  section: 'standings' },
  { key: 'score_goalscorer',     pts: 50,  section: 'extra' },
] as const

type ScoreKey = typeof SCORING_ROWS[number]['key']

const SECTION_COLORS: Record<string, string> = {
  group:     'text-blue-light',
  ko:        'text-violet-400',
  final:     'text-amber-accent',
  standings: 'text-emerald-400',
  extra:     'text-pink-400',
}

export default function HomePage() {
  const { t } = useLang()

  const features = [
    { icon: '⚽', title: t.home_feat1_title, desc: t.home_feat1_desc },
    { icon: '🏆', title: t.home_feat2_title, desc: t.home_feat2_desc },
    { icon: '📊', title: t.home_feat3_title, desc: t.home_feat3_desc },
  ]

  return (
    <div className="min-h-screen bg-night">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #60A5FA, transparent)' }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 bg-blue-dim">
            <span className="text-sm font-semibold text-blue-light">{t.home_badge}</span>
            <span className="text-blue-light/40">·</span>
            <span className="text-sm text-slate-400">{t.home_subtitle}</span>
          </div>

          {/* Logo / Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-syne font-black leading-none mb-3 tracking-tight">
            <span className="text-white">FANT</span>
            <span className="gradient-text-ai">AI</span>
            <span className="text-white">D</span>
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-slate-300 mb-2">{t.home_title1} {t.home_title2}</p>
          <p className="text-slate-500 text-base mb-8 font-medium">{t.home_tagline}</p>
          <p className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed text-sm sm:text-base">
            {t.home_desc}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-primary text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-blue-hover transition-all shadow-blue-md active:scale-95"
            >
              {t.home_cta_join}
            </Link>
            <Link
              href="/bracket"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-night-3 text-white font-semibold px-8 py-4 rounded-2xl text-base hover:bg-night-4 transition-all active:scale-95"
            >
              {t.home_cta_bracket}
            </Link>
          </div>

          {/* Countdown */}
          <div className="glass rounded-3xl p-6 max-w-lg mx-auto">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
              {t.home_countdown_label}
            </p>
            <Countdown targetDate={TOURNAMENT_START} />
            <p className="text-xs text-slate-600 mt-2">{t.home_countdown_start}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl sm:text-3xl font-syne font-black text-white text-center mb-8">
          {t.home_how_works}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-6">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-syne font-black text-white text-center mb-1">
            {t.home_scoring_title}
          </h2>
          <p className="text-slate-500 text-center text-sm mb-8">{t.home_scoring_subtitle}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
            {SCORING_ROWS.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between bg-night-1 rounded-xl px-4 py-3"
              >
                <span className="text-sm text-slate-300">{t[row.key as ScoreKey]}</span>
                <span className={`font-bold text-base ml-4 flex-shrink-0 ${SECTION_COLORS[row.section]}`}>
                  {row.pts} {t.pts}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm mb-4">{t.home_ready}</p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-blue-primary text-white font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-blue-hover transition-all shadow-blue-sm active:scale-95"
            >
              {t.home_cta_start}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-xs">{t.home_footer}</p>
        </div>
      </footer>
    </div>
  )
}
