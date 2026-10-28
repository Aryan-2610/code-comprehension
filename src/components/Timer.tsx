import { useEffect, useState } from 'react'
import { MAX_TIME_MS } from '../lib/scoring'
import type { Deadline } from '../lib/timer'

const R = 22
const C = 2 * Math.PI * R

export function Timer({ deadline, onExpire }: { deadline: Deadline; onExpire: () => void }) {
  const [ms, setMs] = useState(deadline.remaining())

  useEffect(() => {
    let done = false
    const tick = () => {
      const r = deadline.remaining()
      setMs(r)
      if (r === 0 && !done) {
        done = true
        onExpire()
      }
    }
    tick()
    const id = setInterval(tick, 100)
    // A throttled/backgrounded tab may skip ticks: re-check the moment it's visible again.
    const vis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [deadline, onExpire])

  const secs = Math.ceil(ms / 1000)
  const urgent = ms < 10_000
  return (
    <div
      className="relative h-14 w-14 shrink-0"
      role="timer"
      aria-label={`${secs} seconds remaining`}
    >
      <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90">
        <circle cx="26" cy="26" r={R} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={R}
          fill="none"
          stroke={urgent ? 'var(--color-red)' : 'var(--color-amber)'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - ms / MAX_TIME_MS)}
        />
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-mono text-sm font-bold ${urgent ? 'text-red' : 'text-amber'}`}
      >
        {secs}
      </span>
    </div>
  )
}
