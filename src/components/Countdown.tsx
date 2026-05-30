'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'

interface CountdownProps {
  targetDate: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

export default function Countdown({ targetDate }: CountdownProps) {
  const { t } = useLang()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft(targetDate))

    const timer = setInterval(() => {
      const next = calculateTimeLeft(targetDate)
      setTimeLeft(next)
      if (next.expired) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        {['--', '--', '--', '--'].map((_, i) => (
          <div key={i} className="bg-night-1 rounded-2xl px-4 sm:px-5 py-3 min-w-[64px] sm:min-w-[72px] text-center">
            <span className="text-2xl sm:text-3xl font-syne font-black text-blue-light tabular-nums">--</span>
          </div>
        ))}
      </div>
    )
  }

  if (timeLeft.expired) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl font-syne font-black gradient-text-ai">🏆 {t.cd_started}</p>
      </div>
    )
  }

  const units = [
    { label: t.cd_days, value: timeLeft.days },
    { label: t.cd_hours, value: timeLeft.hours },
    { label: t.cd_minutes, value: timeLeft.minutes },
    { label: t.cd_seconds, value: timeLeft.seconds },
  ]

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-4">
      {units.map((unit, idx) => (
        <div key={unit.label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <div className="bg-night-1 rounded-2xl px-4 sm:px-5 py-3 min-w-[64px] sm:min-w-[72px] text-center">
              <span className="text-2xl sm:text-3xl font-syne font-black text-blue-light tabular-nums num-glow">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-1.5 uppercase tracking-widest font-semibold">
              {unit.label}
            </span>
          </div>
          {idx < units.length - 1 && (
            <span className="text-2xl text-blue-light/30 font-bold mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
