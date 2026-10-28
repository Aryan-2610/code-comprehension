import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { Language } from '../data/schema'

export interface Tok {
  text: string
  color?: string
}

const loaders = {
  python: () => import('shiki/langs/python.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
} satisfies Record<Language, () => Promise<unknown>>

let hl: Promise<HighlighterCore> | null = null

function highlighter(): Promise<HighlighterCore> {
  hl ??= createHighlighterCore({
    themes: [import('shiki/themes/github-dark-default.mjs')],
    langs: Object.values(loaders).map((l) => l()) as never,
    engine: createJavaScriptRegexEngine(),
  })
  return hl
}

/** Returns one token array per source line. Falls back to plain text on any error. */
export async function highlightLines(code: string, lang: Language): Promise<Tok[][]> {
  try {
    const h = await highlighter()
    const { tokens } = h.codeToTokens(code, { lang, theme: 'github-dark-default' })
    return tokens.map((line) => line.map((t) => ({ text: t.content, color: t.color })))
  } catch {
    return code.split('\n').map((l) => [{ text: l }])
  }
}
