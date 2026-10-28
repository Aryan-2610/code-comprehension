import type { Question } from '../data/schema'

const SEV: Record<Question['severity'], string> = {
  SEV1: 'bg-red/15 text-red border-red/40',
  SEV2: 'bg-amber/15 text-amber border-amber/40',
  SEV3: 'bg-yellow/10 text-yellow border-yellow/30',
}

export function SevBadge({ sev }: { sev: Question['severity'] }) {
  return <span className={`rounded border px-1.5 py-0.5 font-mono text-xs font-bold ${SEV[sev]}`}>{sev}</span>
}

export function TicketHeader({ q, n, total }: { q: Question; n: number; total: number }) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-dim">
        <SevBadge sev={q.severity} />
        <span>
          INC-{q.id.toUpperCase()} · {n}/{total}
        </span>
      </div>
      <h2 className="mt-1 text-lg font-semibold sm:text-xl">{q.title}</h2>
      <p className="mt-1 rounded border border-line bg-panel px-2 py-1.5 font-mono text-xs text-amber/90">
        ▸ {q.context}
      </p>
    </header>
  )
}
