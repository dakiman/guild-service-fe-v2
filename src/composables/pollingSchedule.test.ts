import { describe, expect, it } from 'vitest'
import {
  ACTIVE_PHASE_MS,
  GIVE_UP_MS,
  PATIENT_DELAY_MS,
  createPendingTracker,
  pollingSchedule,
} from './pollingSchedule'

describe('pollingSchedule', () => {
  it('polls at the server Retry-After during the active phase', () => {
    expect(pollingSchedule(0, 10_000)).toEqual({ retry: true, delayMs: 10_000 })
    expect(pollingSchedule(ACTIVE_PHASE_MS - 1, 30_000)).toEqual({ retry: true, delayMs: 30_000 })
  })

  it('clamps absurdly small Retry-After to 1s', () => {
    expect(pollingSchedule(0, 0).delayMs).toBe(1_000)
  })

  it('backs off to 60s in the patient phase', () => {
    expect(pollingSchedule(ACTIVE_PHASE_MS, 10_000)).toEqual({
      retry: true,
      delayMs: PATIENT_DELAY_MS,
    })
    expect(pollingSchedule(GIVE_UP_MS - 1, 10_000).delayMs).toBe(PATIENT_DELAY_MS)
  })

  it('gives up after the budget', () => {
    expect(pollingSchedule(GIVE_UP_MS, 10_000).retry).toBe(false)
  })
})

describe('createPendingTracker', () => {
  it('anchors elapsed to the FIRST markPending and resets cleanly', () => {
    let t = 1_000
    const tracker = createPendingTracker(() => t)

    expect(tracker.elapsedMs()).toBe(0)
    expect(tracker.firstPendingAt()).toBeNull()

    tracker.markPending()
    t = 5_000
    tracker.markPending() // later marks must not move the anchor
    expect(tracker.elapsedMs()).toBe(4_000)
    expect(tracker.firstPendingAt()).toBe(1_000)

    tracker.reset()
    expect(tracker.elapsedMs()).toBe(0)
    expect(tracker.firstPendingAt()).toBeNull()
  })
})
