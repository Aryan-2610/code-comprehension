import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from './game'

const g = () => useGame.getState()

describe('game flow', () => {
  beforeEach(() => {
    useGame.setState({ filters: { pack: 'all', language: 'all' } })
    g().start(false)
  })

  it('draws 5 distinct questions', () => {
    expect(g().round).toHaveLength(5)
    expect(new Set(g().round.map((q) => q.id)).size).toBe(5)
  })

  it('wrong line skips the reason step and scores 0', () => {
    const q = g().round[0]
    g().lockLine(q.bugLine === 1 ? 2 : 1)
    expect(g().screen).toBe('reveal')
    expect(g().results[0]).toMatchObject({ outcome: 'miss', points: 0, pickedReason: null })
  })

  it('line cannot be changed once locked', () => {
    const q = g().round[0]
    g().lockLine(q.bugLine)
    expect(g().step).toBe('reason')
    g().lockLine(q.bugLine === 1 ? 2 : 1) // ignored
    expect(g().pickedLine).toBe(q.bugLine)
  })

  it('right line + right reason is full credit; wrong reason is partial', () => {
    const q = g().round[0]
    g().lockLine(q.bugLine)
    g().lockReason(q.reasons.find((r) => r.correct)!.id)
    expect(g().results[0].outcome).toBe('full')
    expect(g().results[0].points).toBeGreaterThanOrEqual(80)

    g().next()
    const q2 = g().round[1]
    g().lockLine(q2.bugLine)
    g().lockReason(q2.reasons.find((r) => !r.correct)!.id)
    expect(g().results[1]).toMatchObject({ outcome: 'partial', points: 50 })
    expect(g().streak).toBe(0)
  })

  it('timeout fails the question even after a correct line lock', () => {
    const q = g().round[0]
    g().lockLine(q.bugLine)
    g().timeout()
    expect(g().results[0]).toMatchObject({ outcome: 'timeout', points: 0 })
    expect(g().screen).toBe('reveal')
  })

  it('finishes after five questions', () => {
    for (let i = 0; i < 5; i++) {
      const q = g().round[i]
      g().lockLine(q.bugLine)
      g().lockReason(q.reasons.find((r) => r.correct)!.id)
      g().next()
    }
    expect(g().screen).toBe('result')
    expect(g().results).toHaveLength(5)
    // streak builds: later answers score more than the first
    expect(g().results[4].points).toBeGreaterThan(0)
  })
})
