import { CodeView } from './CodeView'
import { SevBadge } from './Ticket'
import { CATEGORY_LABEL, type Blast, type Question } from '../data/schema'
import { useGame, type QuestionResult } from '../store/game'

const BLAST_LABEL: Record<Blast, string> = {
  money: '💸 Money',
  'data-loss': '🗑 Data loss',
  'data-integrity': '🧩 Data integrity',
  outage: '🔥 Outage',
  security: '🔓 Security',
  cost: '🧾 Cost',
  privacy: '🕵 Privacy',
}
const SEGMENTS: Record<Question['severity'], number> = { SEV1: 5, SEV2: 3, SEV3: 2 }

const VERDICT = {
  full: { text: 'CAUGHT IT', cls: 'text-green', emoji: '🟩' },
  partial: { text: 'RIGHT LINE, WRONG WHY', cls: 'text-yellow', emoji: '🟨' },
  miss: { text: 'WRONG LINE — THIS SHIPPED', cls: 'text-red', emoji: '🟥' },
  timeout: { text: "TIME'S UP — PAGER WENT OFF", cls: 'text-red', emoji: '⬛' },
} as const

export function Reveal({
  result,
  reasons,
  footer,
}: {
  result: QuestionResult
  reasons: Question['reasons']
  footer: React.ReactNode
}) {
  const { question: q } = result
  const v = VERDICT[result.outcome]
  const segs = SEGMENTS[q.severity]

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5">
      <div className="rise">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-dim">
          <SevBadge sev={q.severity} />
          <span className="rounded border border-line px-1.5 py-0.5">{CATEGORY_LABEL[q.category]}</span>
          <span>{q.title}</span>
        </div>
        <h2 className={`mt-2 font-mono text-xl font-bold ${v.cls}`}>
          {v.emoji} {v.text}
          <span className="ml-3 text-base text-ink">+{result.points}</span>
        </h2>
      </div>

      <div className="mt-4">
        <CodeView
          code={q.code}
          language={q.language}
          lockedLine={result.pickedLine}
          bugLine={q.bugLine}
          label="Code with the bug highlighted"
        />
        <p className="mt-1 font-mono text-xs text-dim">
          <span className="text-green">■</span> bug (line {q.bugLine})
          {result.pickedLine !== null && result.pickedLine !== q.bugLine && (
            <>
              {' '}
              · <span className="text-red">■</span> your pick (line {result.pickedLine})
            </>
          )}
        </p>
      </div>

      <section className="mt-5 space-y-2" aria-label="Reasons">
        <h3 className="font-mono text-xs uppercase tracking-widest text-dim">Why it breaks</h3>
        {reasons.map((r) => {
          const picked = r.id === result.pickedReason
          const cls = r.correct
            ? 'border-green/60 bg-green/10'
            : picked
              ? 'border-red/60 bg-red/10'
              : 'border-line opacity-60'
          return (
            <p key={r.id} className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>
              <span className="mr-2 font-mono font-bold">{r.correct ? '✔' : picked ? '✘' : '·'}</span>
              {r.text}
              {picked && <span className="ml-2 font-mono text-xs text-dim">(your answer)</span>}
            </p>
          )
        })}
      </section>

      <section className="mt-5 rounded-lg border border-line bg-panel p-4">
        <h3 className="font-mono text-xs uppercase tracking-widest text-amber">What happens in production</h3>
        <p className="mt-2 text-sm leading-relaxed">{q.productionImpact}</p>
        <div className="mt-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-dim">Blast radius</h3>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex gap-1" role="img" aria-label={`Blast radius ${segs} out of 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`h-3 w-6 rounded-sm ${i < segs ? 'bg-red' : 'bg-line'}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {q.blastRadius.map((b) => (
                <span key={b} className="rounded border border-line px-1.5 py-0.5">
                  {BLAST_LABEL[b]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-green">The fix</h3>
        <CodeView code={q.fixedCode} language={q.language} label="Fixed code" />
      </section>

      {q.interviewNote && (
        <p className="mt-4 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-sm">
          <span className="font-mono text-xs font-bold text-amber">INTERVIEW NOTE </span>
          {q.interviewNote}
        </p>
      )}

      <div className="mt-6">{footer}</div>
    </main>
  )
}

export function RevealScreen() {
  const { results, index, reasonOrder, next, round } = useGame()
  const result = results[results.length - 1]
  if (!result) return null
  return (
    <Reveal
      result={result}
      reasons={reasonOrder[index]}
      footer={
        <button
          autoFocus
          onClick={next}
          className="w-full rounded-lg bg-amber px-4 py-3 font-mono text-base font-bold text-black hover:brightness-110 sm:w-auto"
        >
          {index + 1 >= round.length ? 'SEE RESULTS →' : 'NEXT TICKET →'}
        </button>
      }
    />
  )
}
