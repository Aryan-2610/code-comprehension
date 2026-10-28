import { useGame } from '../store/game'

const REPORT = 'mailto:kushagrasrivastava0503@gmail.com'

export function Footer() {
  const { screen, round, index } = useGame()
  const q = screen === 'question' || screen === 'reveal' ? round[index] : undefined
  const subject = encodeURIComponent(`PROD BREAK: bad question${q ? ` ${q.id}` : ''}`)
  return (
    <footer className="mt-auto border-t border-line px-4 py-4 text-center font-mono text-xs text-dim">
      PROD BREAK · no sign-up, no tracking ·{' '}
      <a className="underline hover:text-amber" href={`${REPORT}?subject=${subject}`}>
        Report a bad question
      </a>
    </footer>
  )
}
