import { create } from 'zustand'
import { QUESTIONS } from '../data'
import type { Language, Pack, Question } from '../data/schema'
import { Deadline } from '../lib/timer'
import { dailyRound, dailySeed, hashString, mulberry32, pickRound, shuffleReasons } from '../lib/select'
import { outcomeOf, scoreQuestion, type Outcome } from '../lib/scoring'
import { loadStats, recordRound, type Stats } from '../lib/stats'

export const ROUND_SIZE = 5

export type Screen = 'landing' | 'about' | 'question' | 'reveal' | 'result' | 'review'
export type Step = 'line' | 'reason'

export interface QuestionResult {
  question: Question
  pickedLine: number | null
  pickedReason: string | null
  outcome: Outcome
  points: number
  remainingMs: number
}

interface Filters {
  pack: Pack | 'all'
  language: Language | 'all'
}

interface GameState {
  screen: Screen
  filters: Filters
  daily: boolean
  round: Question[]
  /** reasons in the (shuffled) order shown to the player, per question */
  reasonOrder: Question['reasons'][]
  index: number
  step: Step
  deadline: Deadline | null
  pickedLine: number | null
  results: QuestionResult[]
  streak: number
  stats: Stats
  /** index of the result shown in review mode */
  reviewIndex: number

  setFilters: (f: Partial<Filters>) => void
  start: (daily?: boolean) => void
  lockLine: (line: number) => void
  lockReason: (reasonId: string) => void
  timeout: () => void
  next: () => void
  goto: (s: Screen) => void
  review: () => void
  poolSize: () => number
}

function pool(f: Filters): Question[] {
  return QUESTIONS.filter(
    (q) => (f.pack === 'all' || q.pack === f.pack) && (f.language === 'all' || q.language === f.language),
  )
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'landing',
  filters: { pack: 'all', language: 'all' },
  daily: false,
  round: [],
  reasonOrder: [],
  index: 0,
  step: 'line',
  deadline: null,
  pickedLine: null,
  results: [],
  streak: 0,
  stats: loadStats(),
  reviewIndex: 0,

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  poolSize: () => pool(get().filters).length,

  start: (daily = false) => {
    const { filters } = get()
    // Daily challenge ignores filters so everyone gets the same five.
    const round = daily
      ? dailyRound(QUESTIONS, ROUND_SIZE)
      : pickRound(pool(filters), ROUND_SIZE, Math.random)
    if (round.length === 0) return
    const rand = daily ? mulberry32(hashString(dailySeed())) : Math.random
    set({
      screen: 'question',
      daily,
      round,
      reasonOrder: round.map((q) => shuffleReasons(q, rand)),
      index: 0,
      step: 'line',
      deadline: new Deadline(),
      pickedLine: null,
      results: [],
      streak: 0,
    })
  },

  lockLine: (line) => {
    const { step, deadline, pickedLine } = get()
    if (step !== 'line' || pickedLine !== null || !deadline || deadline.expired()) return
    const q = get().round[get().index]
    if (line === q.bugLine) {
      set({ pickedLine: line, step: 'reason' })
    } else {
      // Wrong line: reason step is skipped, go straight to reveal.
      finish(set, get, { pickedLine: line, pickedReason: null, lineCorrect: false, reasonCorrect: false })
    }
  },

  lockReason: (reasonId) => {
    const { step, deadline, pickedLine } = get()
    if (step !== 'reason' || !deadline || deadline.expired()) return
    const q = get().round[get().index]
    const correct = q.reasons.find((r) => r.id === reasonId)?.correct === true
    finish(set, get, { pickedLine, pickedReason: reasonId, lineCorrect: true, reasonCorrect: correct })
  },

  timeout: () => {
    const { screen, pickedLine } = get()
    if (screen !== 'question') return
    const q = get().round[get().index]
    // Timer hit zero at any step => question failed (no credit, even for a locked correct line).
    const result: QuestionResult = {
      question: q,
      pickedLine,
      pickedReason: null,
      outcome: 'timeout',
      points: 0,
      remainingMs: 0,
    }
    set((s) => ({ results: [...s.results, result], streak: 0, screen: 'reveal' }))
  },

  next: () => {
    const { index, round } = get()
    if (index + 1 >= round.length) {
      const { results, stats, daily } = get()
      const score = results.reduce((a, r) => a + r.points, 0)
      const next = recordRound(
        stats,
        score,
        results.map((r) => ({ category: r.question.category, outcome: r.outcome })),
        daily ? dailySeed() : undefined,
      )
      set({ stats: next, screen: 'result' })
    } else {
      set({ index: index + 1, step: 'line', pickedLine: null, deadline: new Deadline(), screen: 'question' })
    }
  },

  goto: (screen) => set({ screen }),
  review: () => set({ screen: 'review', reviewIndex: 0 }),
}))

function finish(
  set: (p: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => void,
  get: () => GameState,
  a: { pickedLine: number | null; pickedReason: string | null; lineCorrect: boolean; reasonCorrect: boolean },
) {
  const { deadline, streak, round, index } = get()
  const remainingMs = deadline?.remaining() ?? 0
  const scored = scoreQuestion({ lineCorrect: a.lineCorrect, reasonCorrect: a.reasonCorrect, remainingMs, streak })
  const result: QuestionResult = {
    question: round[index],
    pickedLine: a.pickedLine,
    pickedReason: a.pickedReason,
    outcome: outcomeOf(a),
    points: scored.points,
    remainingMs,
  }
  set((s) => ({
    results: [...s.results, result],
    streak: scored.outcome === 'full' ? streak + 1 : 0,
    screen: 'reveal',
  }))
}
