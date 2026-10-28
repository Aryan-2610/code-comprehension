import { MAX_TIME_MS } from './scoring'

/**
 * Deadline-based countdown. Remaining time is always derived from a
 * timestamp, so a throttled/backgrounded tab can't make it drift.
 * There is deliberately no pause().
 */
export class Deadline {
  readonly deadline: number
  constructor(private now: () => number = Date.now, durationMs = MAX_TIME_MS) {
    this.deadline = now() + durationMs
  }
  remaining(): number {
    return Math.max(0, this.deadline - this.now())
  }
  expired(): boolean {
    return this.remaining() === 0
  }
}
