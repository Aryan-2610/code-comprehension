import { useEffect } from 'react'
import { CodeView } from './CodeView'
import { Timer } from './Timer'
import { TicketHeader } from './Ticket'
import { ROUND_SIZE, useGame } from '../store/game'

export function QuestionScreen() {
  const { round, index, step, deadline, pickedLine, reasonOrder, lockLine, lockReason, timeout, streak } = useGame()
  const q = round[index]
  const reasons = reasonOrder[index]

  // 1–4 pick a reason once the line is locked.
  useEffect(() => {
    if (step !== 'reason') return
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1
      if (i >= 0 && i < reasons.length) lockReason(reasons[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, reasons, lockReason])

  if (!q || !deadline) return null

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TicketHeader q={q} n={index + 1} total={ROUND_SIZE} />
        </div>
        <Timer key={`${q.id}-${index}`} deadline={deadline} onExpire={timeout} />
      </div>

      <p className="mb-2 font-mono text-xs text-dim" aria-live="polite">
        {step === 'line' ? (
          <>
            <span className="text-amber">STEP 1/2</span> — click the ONE line that will break in production. No take-backs.
            <span className="hidden sm:inline"> (↑↓ to move, Enter to lock)</span>
          </>
        ) : (
          <>
            <span className="text-amber">STEP 2/2</span> — line {pickedLine} locked. Why does it break?
            <span className="hidden sm:inline"> (press 1–4)</span>
          </>
        )}
        {streak > 0 && <span className="ml-2 text-green">🔥 streak ×{streak}</span>}
      </p>

      <CodeView
        key={q.id}
        code={q.code}
        language={q.language}
        onPick={step === 'line' ? lockLine : undefined}
        lockedLine={pickedLine}
        label={`${q.language} snippet`}
      />

      {step === 'reason' && (
        <ol className="rise mt-4 space-y-2" aria-label="Reasons">
          {reasons.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => lockReason(r.id)}
                className="flex w-full gap-3 rounded-lg border border-line bg-panel px-3 py-3 text-left text-sm transition hover:border-amber hover:bg-panel-2 focus-visible:border-amber"
              >
                <span className="font-mono font-bold text-amber">{i + 1}</span>
                <span>{r.text}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
