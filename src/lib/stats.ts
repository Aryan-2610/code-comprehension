import type { Category } from '../data/schema'
import type { Outcome } from './scoring'

const KEY = 'prodbreak:stats:v1'

export interface Stats {
  best: number
  played: number
  dailyDone: string | null
  categories: Partial<Record<Category, { seen: number; correct: number }>>
}

const empty = (): Stats => ({ best: 0, played: 0, dailyDone: null, categories: {} })

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

export function recordRound(
  prev: Stats,
  score: number,
  results: { category: Category; outcome: Outcome }[],
  dailyKey?: string,
): Stats {
  const categories = { ...prev.categories }
  for (const r of results) {
    const c = categories[r.category] ?? { seen: 0, correct: 0 }
    categories[r.category] = { seen: c.seen + 1, correct: c.correct + (r.outcome === 'full' ? 1 : 0) }
  }
  const next: Stats = {
    best: Math.max(prev.best, score),
    played: prev.played + 1,
    dailyDone: dailyKey ?? prev.dailyDone,
    categories,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable (private mode) — stats just won't persist */
  }
  return next
}
