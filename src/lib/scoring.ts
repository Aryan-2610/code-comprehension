export const MAX_TIME_MS = 60_000
export const LINE_POINTS = 50
export const REASON_POINTS = 30
export const SPEED_POINTS = 20

export type Outcome = 'full' | 'partial' | 'miss' | 'timeout'

export interface Answer {
  lineCorrect: boolean
  reasonCorrect: boolean
  /** ms remaining on the clock when the question was finished */
  remainingMs: number
  /** number of fully-correct answers immediately before this one */
  streak: number
}

export function outcomeOf(a: Pick<Answer, 'lineCorrect' | 'reasonCorrect'> | null): Outcome {
  if (!a) return 'timeout'
  if (!a.lineCorrect) return 'miss'
  return a.reasonCorrect ? 'full' : 'partial'
}

export function speedBonus(remainingMs: number): number {
  const frac = Math.min(1, Math.max(0, remainingMs / MAX_TIME_MS))
  return Math.round(SPEED_POINTS * frac)
}

/** +10% per prior consecutive full-correct, capped at +50%. */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak, 5) * 0.1
}

export function scoreQuestion(a: Answer): { base: number; points: number; outcome: Outcome } {
  if (!a.lineCorrect) return { base: 0, points: 0, outcome: 'miss' }
  let base = LINE_POINTS
  if (a.reasonCorrect) base += REASON_POINTS + speedBonus(a.remainingMs)
  const outcome: Outcome = a.reasonCorrect ? 'full' : 'partial'
  const mult = outcome === 'full' ? streakMultiplier(a.streak) : 1
  return { base, points: Math.round(base * mult), outcome }
}

export const EMOJI: Record<Outcome, string> = { full: '🟩', partial: '🟨', miss: '🟥', timeout: '⬛' }

export function shareText(totalPoints: number, outcomes: Outcome[], label = 'PROD BREAK'): string {
  const solved = outcomes.filter((o) => o === 'full').length
  return `${label} ${solved}/${outcomes.length} · ${totalPoints} pts\n${outcomes.map((o) => EMOJI[o]).join('')}`
}
