import { useEffect, useRef, useState } from 'react'
import type { Language } from '../data/schema'
import { highlightLines, type Tok } from '../lib/highlight'

interface Props {
  code: string
  language: Language
  /** Makes each line a button. Called once; the parent must lock afterwards. */
  onPick?: (line: number) => void
  /** line the player locked in */
  lockedLine?: number | null
  /** reveal mode: mark the true bug line (and the player's wrong pick) */
  bugLine?: number
  label?: string
}

const cache = new Map<string, Tok[][]>()

export function CodeView({ code, language, onPick, lockedLine = null, bugLine, label }: Props) {
  const key = `${language}:${code}`
  const [lines, setLines] = useState<Tok[][]>(() => cache.get(key) ?? code.split('\n').map((l) => [{ text: l }]))
  const [focus, setFocus] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    let live = true
    const hit = cache.get(key)
    if (hit) setLines(hit)
    else
      highlightLines(code, language).then((t) => {
        cache.set(key, t)
        if (live) setLines(t)
      })
    return () => {
      live = false
    }
  }, [key, code, language])

  const interactive = !!onPick && lockedLine === null
  const move = (to: number) => {
    const i = Math.max(0, Math.min(lines.length - 1, to))
    setFocus(i)
    refs.current[i]?.focus()
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-line bg-[#0d0d0f]"
      role={interactive ? 'group' : undefined}
      aria-label={label ?? 'Code snippet'}
    >
      <div className="min-w-max py-2">
        {lines.map((toks, i) => {
          const n = i + 1
          const cls = ['code-line']
          if (interactive) cls.push('clickable')
          if (lockedLine === n && bugLine === undefined) cls.push('locked')
          if (bugLine !== undefined) {
            if (n === bugLine) cls.push('is-bug')
            else if (n === lockedLine) cls.push('is-wrong')
          }
          const content = (
            <>
              <span className="no">{n}</span>
              <span>
                {toks.length === 0 || (toks.length === 1 && toks[0].text === '') ? ' ' : null}
                {toks.map((t, j) => (
                  <span key={j} style={t.color ? { color: t.color } : undefined}>
                    {t.text}
                  </span>
                ))}
              </span>
            </>
          )
          return interactive ? (
            <button
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              className={cls.join(' ')}
              tabIndex={i === focus ? 0 : -1}
              aria-label={`Line ${n}`}
              onFocus={() => setFocus(i)}
              onClick={() => onPick!(n)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') (e.preventDefault(), move(i + 1))
                else if (e.key === 'ArrowUp') (e.preventDefault(), move(i - 1))
                else if (e.key === 'Home') (e.preventDefault(), move(0))
                else if (e.key === 'End') (e.preventDefault(), move(lines.length - 1))
              }}
            >
              {content}
            </button>
          ) : (
            <div key={i} className={cls.join(' ')} aria-label={n === bugLine ? `Line ${n}, the bug` : undefined}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
