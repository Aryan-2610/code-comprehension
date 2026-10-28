import type { Question } from '../data/schema'

/** mulberry32 — small, fast, deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick `n` distinct questions, preferring a spread of categories: shuffle,
 * then take at most one per category first, then top up from the rest.
 */
export function pickRound(pool: readonly Question[], n: number, rand: () => number): Question[] {
  const shuffled = shuffle(pool, rand)
  const seen = new Set<string>()
  const picked: Question[] = []
  for (const q of shuffled) {
    if (picked.length === n) break
    if (!seen.has(q.category)) {
      seen.add(q.category)
      picked.push(q)
    }
  }
  for (const q of shuffled) {
    if (picked.length === n) break
    if (!picked.includes(q)) picked.push(q)
  }
  return shuffle(picked, rand)
}

export function dailySeed(date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dailyRound(pool: readonly Question[], n: number, date = new Date()): Question[] {
  // Sort by id so the result doesn't depend on array order.
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  return pickRound(sorted, n, mulberry32(hashString(dailySeed(date))))
}

/** Shuffle reason order (deterministic when a seed rng is given). */
export function shuffleReasons(q: Question, rand: () => number = Math.random): Question['reasons'] {
  return shuffle(q.reasons, rand)
}
