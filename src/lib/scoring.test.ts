import { describe, expect, it } from 'vitest'
import { scoreQuestion, shareText, speedBonus, streakMultiplier, outcomeOf } from './scoring'

describe('scoring', () => {
  it('wrong line scores 0', () => {
    expect(scoreQuestion({ lineCorrect: false, reasonCorrect: false, remainingMs: 30000, streak: 3 })).toMatchObject({
      points: 0,
      outcome: 'miss',
    })
  })
  it('right line, wrong reason is 50 and partial, no speed bonus, no streak', () => {
    expect(scoreQuestion({ lineCorrect: true, reasonCorrect: false, remainingMs: 30000, streak: 4 })).toMatchObject({
      points: 50,
      outcome: 'partial',
    })
  })
  it('full marks at the instant of starting is 100', () => {
    expect(scoreQuestion({ lineCorrect: true, reasonCorrect: true, remainingMs: 30000, streak: 0 }).points).toBe(100)
  })
  it('speed bonus scales with remaining time and clamps', () => {
    expect(speedBonus(30000)).toBe(20)
    expect(speedBonus(15000)).toBe(10)
    expect(speedBonus(0)).toBe(0)
    expect(speedBonus(99999)).toBe(20)
    expect(speedBonus(-5)).toBe(0)
  })
  it('streak multiplier caps at +50%', () => {
    expect(streakMultiplier(0)).toBe(1)
    expect(streakMultiplier(2)).toBeCloseTo(1.2)
    expect(streakMultiplier(50)).toBeCloseTo(1.5)
  })
  it('streak multiplies a fully-correct answer', () => {
    expect(scoreQuestion({ lineCorrect: true, reasonCorrect: true, remainingMs: 0, streak: 2 }).points).toBe(96)
  })
  it('outcomeOf handles timeouts', () => {
    expect(outcomeOf(null)).toBe('timeout')
  })
  it('share text uses an emoji grid', () => {
    expect(shareText(310, ['full', 'full', 'miss', 'full', 'partial'])).toBe('PROD BREAK 3/5 · 310 pts\n🟩🟩🟥🟩🟨')
  })
})
