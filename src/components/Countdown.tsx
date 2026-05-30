'use client'

import { useEffect, useState } from 'react'

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
      <div className="flex items-center justify-center gap-4 py-4">
        {['--', '--', '--', '--'].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="bg-[#1a3d2b]/80 border border-[#2d5a3d] rounded-xl px-5 py-3 min-w-[70px] text-center">
              <span className="text-3xl font-bold text-[#d4af37]">--</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (timeLeft.expired) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl font-bold text-[#d4af37]">🏆 The tournament has started!</p>
      </div>
    )
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 py-4">
      {units.map((unit, idx) => (
        <div key={unit.label} className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <div className="bg-[#1a3d2b]/80 border border-[#2d5a3d] rounded-xl px-4 sm:px-5 py-3 min-w-[64px] sm:min-w-[70px] text-center">
              <span className="text-2xl sm:text-3xl font-bold text-[#d4af37] tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-gray-500 mt-1.5 uppercase tracking-wider font-medium">
              {unit.label}
            </span>
          </div>
          {idx < units.length - 1 && (
            <span className="text-2xl text-[#d4af37]/60 font-bold mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
