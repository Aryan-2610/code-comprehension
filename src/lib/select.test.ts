import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data'
import { dailyRound, mulberry32, pickRound, shuffle } from './select'

describe('question selection', () => {
  it('never repeats within a round', () => {
    for (let i = 0; i < 200; i++) {
      const r = pickRound(QUESTIONS, 5, Math.random)
      expect(new Set(r.map((q) => q.id)).size).toBe(5)
    }
  })
  it('prefers distinct categories', () => {
    for (let i = 0; i < 100; i++) {
      const r = pickRound(QUESTIONS, 5, Math.random)
      expect(new Set(r.map((q) => q.category)).size).toBe(5)
    }
  })
  it('returns fewer when the pool is small, without duplicates', () => {
    const r = pickRound(QUESTIONS.slice(0, 3), 5, Math.random)
    expect(r).toHaveLength(3)
  })
  it('daily round is deterministic per date and independent of array order', () => {
    const d = new Date('2026-03-04T10:00:00Z')
    const a = dailyRound(QUESTIONS, 5, d).map((q) => q.id)
    const b = dailyRound([...QUESTIONS].reverse(), 5, d).map((q) => q.id)
    expect(a).toEqual(b)
  })
  it('daily round differs between days', () => {
    const a = dailyRound(QUESTIONS, 5, new Date('2026-03-04T10:00:00Z')).map((q) => q.id)
    const b = dailyRound(QUESTIONS, 5, new Date('2026-03-05T10:00:00Z')).map((q) => q.id)
    expect(a).not.toEqual(b)
  })
  it('seeded shuffle is reproducible and a permutation', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(shuffle(items, mulberry32(42))).toEqual(shuffle(items, mulberry32(42)))
    expect([...shuffle(items, mulberry32(7))].sort()).toEqual(items)
  })
})
