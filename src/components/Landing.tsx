import { useEffect, useRef, useState } from 'react'
import { LANGUAGES, PACKS, PACK_LABEL, type Language, type Pack } from '../data/schema'
import { dailySeed } from '../lib/select'
import { useGame } from '../store/game'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
        active ? 'border-amber bg-amber/15 text-amber' : 'border-line text-dim hover:border-dim'
      }`}
    >
      {children}
    </button>
  )
}

export function HowTo({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="How to play"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-line bg-panel p-5"
      >
        <h2 className="font-mono text-lg font-bold text-amber">HOW TO PLAY</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Each round is <b>5 tickets</b>. Every ticket is a short snippet that <i>looks</i> correct — and passes its tests.
          </li>
          <li>
            Read the <b>context strip</b> (traffic, replicas, DB). Some bugs only exist at scale, under concurrency, or when
            things fail.
          </li>
          <li>
            <b>Click the one line</b> that will cause the incident. One guess — it locks immediately.
          </li>
          <li>
            Then pick <b>why</b> it breaks (1–4). A 30-second clock covers both steps and cannot be paused.
          </li>
          <li>
            Scoring: line 50 · reason 30 · speed up to 20. Consecutive perfect answers add a streak multiplier.
          </li>
          <li>Right line, wrong reason is 🟨. Wrong line is 🟥. Time out is ⬛.</li>
        </ol>
        <button onClick={onClose} className="mt-5 w-full rounded-lg bg-amber py-2.5 font-mono font-bold text-black">
          GOT IT
        </button>
      </div>
    </div>
  )
}

export function Landing() {
  const { filters, setFilters, start, stats, goto, poolSize } = useGame()
  const [how, setHow] = useState(false)
  const size = poolSize()
  const dailyDone = stats.dailyDone === dailySeed()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <p className="font-mono text-xs text-red">● PAGER ACTIVE · 03:07 AM</p>
      <h1 className="glow mt-3 font-mono text-5xl font-bold leading-none tracking-tight text-amber sm:text-7xl">
        PROD
        <br />
        BREAK
      </h1>
      <p className="mt-5 max-w-md text-lg text-ink/90">
        The code looks fine. The tests pass. <span className="text-amber">Find the line that pages you at 3am.</span>
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-dim">Pack</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={filters.pack === 'all'} onClick={() => setFilters({ pack: 'all' })}>
              All
            </Chip>
            {PACKS.map((p: Pack) => (
              <Chip key={p} active={filters.pack === p} onClick={() => setFilters({ pack: p })}>
                {PACK_LABEL[p]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-dim">Language</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={filters.language === 'all'} onClick={() => setFilters({ language: 'all' })}>
              All
            </Chip>
            {LANGUAGES.map((l: Language) => (
              <Chip key={l} active={filters.language === l} onClick={() => setFilters({ language: l })}>
                {l === 'javascript' ? 'JavaScript' : l === 'sql' ? 'SQL' : l[0].toUpperCase() + l.slice(1)}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => start(false)}
          disabled={size === 0}
          autoFocus
          className="flex-1 rounded-xl bg-amber px-6 py-5 font-mono text-2xl font-bold text-black shadow-[0_0_30px_rgba(255,176,0,0.35)] transition hover:brightness-110 disabled:opacity-30"
        >
          START
        </button>
        <button
          onClick={() => start(true)}
          className="rounded-xl border border-amber/50 px-5 py-3 font-mono text-sm text-amber hover:bg-amber/10"
        >
          DAILY CHALLENGE
          <span className="block text-xs text-dim">{dailyDone ? '✔ played today' : dailySeed()}</span>
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-dim">
        {size === 0 ? 'No questions match this filter — try another combo.' : `${size} tickets in this filter`}
        {size > 0 && size < 5 && ' (round will be shorter)'}
      </p>

      <div className="mt-8 flex items-center gap-4 font-mono text-xs text-dim">
        <button onClick={() => setHow(true)} className="underline hover:text-amber">
          How to play
        </button>
        <button onClick={() => goto('about')} className="underline hover:text-amber">
          About
        </button>
        <span className="ml-auto">
          best {stats.best} · {stats.played} played
        </span>
      </div>
      {how && <HowTo onClose={() => setHow(false)} />}
    </main>
  )
}
