import { useState } from 'react'
import { CATEGORY_LABEL } from '../data/schema'
import { useCountUp } from '../lib/hooks'
import { EMOJI, shareText } from '../lib/scoring'
import { useGame } from '../store/game'
import { Reveal } from './Reveal'

export function ResultScreen() {
  const { results, daily, stats, start, goto, review } = useGame()
  const [copied, setCopied] = useState(false)
  const total = results.reduce((a, r) => a + r.points, 0)
  const shown = useCountUp(total)
  const solved = results.filter((r) => r.outcome === 'full').length
  const outcomes = results.map((r) => r.outcome)
  const missed = [...new Set(results.filter((r) => r.outcome !== 'full').map((r) => r.question.category))]

  // Lifetime weak spots: categories seen ≥ 2 times with the lowest accuracy.
  const weak = Object.entries(stats.categories)
    .filter(([, c]) => c && c.seen >= 2)
    .map(([k, c]) => [k, c!.correct / c!.seen, c!.seen] as const)
    .filter(([, acc]) => acc < 0.7)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)

  const text = shareText(total, outcomes, daily ? `PROD BREAK ${new Date().toISOString().slice(0, 10)}` : 'PROD BREAK')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const verdict =
    solved === 5 ? 'Zero incidents. Ship it.' : solved >= 3 ? 'Mostly safe. Mind the gaps.' : 'You would have paged someone.'

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="font-mono text-xs uppercase tracking-widest text-dim">Post-incident review</p>
      <h1 className="glow mt-1 font-mono text-5xl font-bold text-amber">{shown}</h1>
      <p className="mt-1 text-sm text-dim">
        {solved}/{results.length} fully caught · best ever {Math.max(stats.best, total)} · {stats.played} games played
      </p>
      <p className="mt-2">{verdict}</p>

      <div className="mt-5 rounded-lg border border-line bg-panel p-4">
        <p className="text-3xl tracking-widest" aria-label="Result grid">
          {outcomes.map((o) => EMOJI[o]).join('')}
        </p>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-dim">{text}</pre>
        <button onClick={copy} className="mt-3 rounded border border-amber px-3 py-1.5 font-mono text-sm text-amber hover:bg-amber/10">
          {copied ? '✔ Copied' : 'Copy result'}
        </button>
        <span role="status" className="sr-only">
          {copied ? 'Result copied to clipboard' : ''}
        </span>
      </div>

      <section className="mt-6" aria-label="Breakdown">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-dim">Breakdown</h2>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {results.map((r, i) => (
            <li key={r.question.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span>{EMOJI[r.outcome]}</span>
              <span className="min-w-0 flex-1 truncate">{r.question.title}</span>
              <span className="hidden text-xs text-dim sm:inline">{CATEGORY_LABEL[r.question.category]}</span>
              <span className="font-mono text-amber">{r.points}</span>
              <span className="sr-only">question {i + 1}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-panel p-4" aria-label="Weak spots">
        <h2 className="font-mono text-xs uppercase tracking-widest text-red">Weak spots</h2>
        {missed.length === 0 ? (
          <p className="mt-2 text-sm text-dim">Nothing missed this round.</p>
        ) : (
          <p className="mt-2 text-sm">
            Missed this round:{' '}
            {missed.map((c) => (
              <span key={c} className="mr-1.5 inline-block rounded border border-red/40 px-1.5 py-0.5 text-xs text-red">
                {CATEGORY_LABEL[c]}
              </span>
            ))}
          </p>
        )}
        {weak.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-dim">Lifetime — you keep missing:</p>
            <ul className="mt-1 space-y-1 text-sm">
              {weak.map(([k, acc, seen]) => (
                <li key={k} className="flex justify-between font-mono text-xs">
                  <span>{CATEGORY_LABEL[k as keyof typeof CATEGORY_LABEL]}</span>
                  <span className="text-red">
                    {Math.round(acc * 100)}% of {seen}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={() => start(daily)} autoFocus className="rounded-lg bg-amber px-5 py-3 font-mono font-bold text-black hover:brightness-110">
          {daily ? 'PLAY RANDOM' : 'PLAY AGAIN'}
        </button>
        <button onClick={review} className="rounded-lg border border-line px-5 py-3 font-mono hover:border-amber">
          REVIEW MISTAKES
        </button>
        <button onClick={() => goto('landing')} className="rounded-lg border border-line px-5 py-3 font-mono text-dim hover:border-amber">
          HOME
        </button>
      </div>
    </main>
  )
}

export function ReviewScreen() {
  const { results, reasonOrder, round, reviewIndex, goto } = useGame()
  const mistakes = results.map((r, i) => ({ r, i })).filter(({ r }) => r.outcome !== 'full')
  const [pos, setPos] = useState(0)
  void reviewIndex
  if (mistakes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p>No mistakes to review — clean round.</p>
        <button onClick={() => goto('result')} className="mt-4 rounded border border-line px-4 py-2 font-mono">
          ← Back
        </button>
      </main>
    )
  }
  const { r, i } = mistakes[pos]
  const order = reasonOrder[round.findIndex((q) => q.id === r.question.id) ?? i]
  return (
    <Reveal
      result={r}
      reasons={order}
      footer={
        <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
          <button disabled={pos === 0} onClick={() => setPos(pos - 1)} className="rounded border border-line px-4 py-2 disabled:opacity-30">
            ← Prev
          </button>
          <span className="text-dim">
            {pos + 1}/{mistakes.length}
          </span>
          <button
            disabled={pos === mistakes.length - 1}
            onClick={() => setPos(pos + 1)}
            className="rounded border border-line px-4 py-2 disabled:opacity-30"
          >
            Next →
          </button>
          <button onClick={() => goto('result')} className="ml-auto rounded bg-amber px-4 py-2 font-bold text-black">
            Done
          </button>
        </div>
      }
    />
  )
}
