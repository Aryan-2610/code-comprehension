import { describe, expect, it } from 'vitest'
import { Deadline } from './timer'

describe('Deadline', () => {
  it('derives remaining time from timestamps, not ticks', () => {
    let t = 1_000_000
    const d = new Deadline(() => t, 30_000)
    expect(d.remaining()).toBe(30_000)
    t += 12_345 // e.g. a throttled background tab wakes up late
    expect(d.remaining()).toBe(17_655)
    expect(d.expired()).toBe(false)
  })
  it('never goes negative and reports expiry', () => {
    let t = 0
    const d = new Deadline(() => t, 30_000)
    t += 10 * 60_000
    expect(d.remaining()).toBe(0)
    expect(d.expired()).toBe(true)
  })
})
