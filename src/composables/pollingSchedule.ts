// Polling schedule for 202 sync-pending lookups. Replaces the old hard
// 12-attempt cap that silently gave up while the sync job was still queued
// (spec: docs/superpowers/specs/2026-07-06-sync-lanes-pending-ux-design.md).
//
// Phases, measured from the FIRST 202 of the current lookup:
//   0–3 min   active:  poll at the server's Retry-After cadence
//   3–15 min  patient: back off to one check per minute
//   > 15 min  give up: stop retrying so a real error state surfaces
export const ACTIVE_PHASE_MS = 3 * 60_000
export const GIVE_UP_MS = 15 * 60_000
export const PATIENT_DELAY_MS = 60_000
const MIN_DELAY_MS = 1_000

export interface PollingDecision {
  retry: boolean
  delayMs: number
}

export function pollingSchedule(elapsedMs: number, retryAfterMs: number): PollingDecision {
  if (elapsedMs >= GIVE_UP_MS) return { retry: false, delayMs: 0 }
  if (elapsedMs >= ACTIVE_PHASE_MS) return { retry: true, delayMs: PATIENT_DELAY_MS }
  return { retry: true, delayMs: Math.max(MIN_DELAY_MS, retryAfterMs) }
}

// Remembers when the current lookup first answered 202 so elapsed time
// survives across retries. reset() on identity change or success.
export function createPendingTracker(now: () => number = Date.now) {
  let firstPendingAt: number | null = null

  return {
    markPending(): number {
      if (firstPendingAt === null) firstPendingAt = now()
      return firstPendingAt
    },
    reset(): void {
      firstPendingAt = null
    },
    elapsedMs(): number {
      return firstPendingAt === null ? 0 : now() - firstPendingAt
    },
    firstPendingAt: (): number | null => firstPendingAt,
  }
}
