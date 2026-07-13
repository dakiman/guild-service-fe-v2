import type { KeystoneUpgradeThreshold } from '@/types/gameData'

// Chest count for a run: how many Blizzard par-time thresholds its duration
// beats. Exactly-at-threshold counts, matching in-game behavior.
export function upgradeCount(
  durationMs: number,
  thresholds: KeystoneUpgradeThreshold[] | null | undefined,
): number {
  if (!thresholds?.length) return 0
  return thresholds.filter((t) => durationMs <= t.qualifying_duration).length
}
