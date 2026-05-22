import Link from 'next/link'
import Countdown from '@/components/Countdown'

const TOURNAMENT_START = '2026-06-11T18:00:00Z'

const FEATURES = [
  {
    icon: '⚽',
    title: 'Predict Every Match',
    description:
      'Pick the outcome for all 48 group stage matches. Choose 1 (home win), X (draw), or 2 (away win) and optionally guess the exact score for bonus points.',
  },
  {
    icon: '🏆',
    title: 'Build Your Bracket',
    description:
      'Complete the full knockout bracket from the Round of 32 all the way to the Final. Select the winners of every elimination match to maximise your score.',
  },
  {
    icon: '🥇',
    title: 'Compete & Win',
    description:
      'Track your rank in real-time on the global leaderboard. Points are calculated automatically as results come in throughout the tournament.',
  },
]

const POINTS_TABLE = [
  { label: 'Group stage correct outcome', points: 3, icon: '⚽' },
  { label: 'Exact score bonus', points: '+2', icon: '🎯' },
  { label: 'Round of 32 winner', points: 5, icon: '🔵' },
  { label: 'Round of 16 winner', points: 7, icon: '🟣' },
  { label: 'Quarter-final winner', points: 10, icon: '🟠' },
  { label: 'Semi-final winner', points: 12, icon: '🟡' },
  { label: 'Third place match winner', points: 8, icon: '🥉' },
  { label: 'Final winner', points: 20, icon: '🏆' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f2318]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,175,55,0.12) 0%, transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-semibold text-[#d4af37]">FIFA World Cup 2026</span>
            <span className="text-[#d4af37]/60">•</span>
            <span className="text-sm text-gray-400">USA · Canada · Mexico</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-4">
            FIFA World Cup
            <br />
            <span className="text-[#d4af37]">2026</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-gray-300 mb-3">
            Bracket Prediction Game
          </p>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Predict every group stage result and build your complete knockout bracket. Compete
            against friends and the world — the most accurate predictor wins.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#d4af37] text-[#0f2318] font-bold px-8 py-3.5 rounded-xl text-lg hover:bg-[#f0d060] transition-colors duration-150 shadow-lg shadow-[#d4af37]/20"
            >
              🏆 Join Now — It&apos;s Free
            </Link>
            <Link
              href="/bracket"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-[#2d5a3d] text-white font-semibold px-8 py-3.5 rounded-xl text-lg hover:border-[#d4af37] hover:text-[#d4af37] transition-colors duration-150"
            >
              📊 View Bracket
            </Link>
          </div>

          {/* Countdown */}
          <div className="bg-[#1a3d2b]/40 border border-[#2d5a3d] rounded-2xl p-6 max-w-lg mx-auto">
            <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-2">
              Tournament Starts In
            </p>
            <Countdown targetDate={TOURNAMENT_START} />
            <p className="text-xs text-gray-600 mt-1">June 11, 2026 — Opening Match</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          How It <span className="text-[#d4af37]">Works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-6 hover:border-[#d4af37]/40 transition-colors duration-200"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Points Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            Scoring <span className="text-[#d4af37]">System</span>
          </h2>
          <p className="text-gray-400 text-center mb-8 text-sm">
            Points are awarded automatically as official results come in
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {POINTS_TABLE.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between bg-[#0f2318]/60 border border-[#2d5a3d] rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{row.icon}</span>
                  <span className="text-sm text-gray-300">{row.label}</span>
                </div>
                <span className="text-[#d4af37] font-bold text-lg ml-4 flex-shrink-0">
                  {row.points} pts
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Ready to test your football knowledge?
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-[#d4af37] text-[#0f2318] font-bold px-8 py-3 rounded-xl text-base hover:bg-[#f0d060] transition-colors duration-150"
            >
              Start Predicting
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a3d2b] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 text-sm">
            🏆 Fanta Mondiale 2026 — A fan prediction game. Not affiliated with FIFA.
          </p>
        </div>
      </footer>
    </div>
  )
}
