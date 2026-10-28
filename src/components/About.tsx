import { useGame } from '../store/game'

export function About() {
  const goto = useGame((s) => s.goto)
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <button onClick={() => goto('landing')} className="font-mono text-sm text-dim hover:text-amber">
        ← back
      </button>
      <h1 className="mt-4 font-mono text-3xl font-bold text-amber">About PROD BREAK</h1>
      <div className="mt-4 space-y-4 leading-relaxed text-ink/90">
        <p>
          Most coding practice asks <i>"does this work?"</i> This game asks the question that actually pays the bills:{' '}
          <b>"how will this fail in production?"</b>
        </p>
        <p>
          Every snippet is syntactically clean and works on the happy path. The bug only appears under real-world conditions —
          concurrency, scale, failures, bad input, time, retries. You find the line, then explain why. Guessing the line is
          luck; explaining it is understanding.
        </p>
        <p>
          Every question is based on a well-known production failure pattern, and the Interview packs highlight the classic
          traps that come up in interviews: mutable defaults, <code>Integer ==</code>, <code>NOT IN</code> with NULL, and
          friends.
        </p>
        <p className="text-sm text-dim">
          Everything runs in your browser. No account, no tracking; your stats live in localStorage.
        </p>
      </div>
    </main>
  )
}
