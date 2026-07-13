import { describe, it, expect } from 'vitest'
import { upgradeCount } from './keystoneUpgrades'

const THRESHOLDS = [
  { upgrade_level: 1, qualifying_duration: 1_800_000 },
  { upgrade_level: 2, qualifying_duration: 1_440_000 },
  { upgrade_level: 3, qualifying_duration: 1_080_000 },
]

describe('upgradeCount', () => {
  it('counts thresholds the duration beats', () => {
    expect(upgradeCount(1_000_000, THRESHOLDS)).toBe(3)
    expect(upgradeCount(1_200_000, THRESHOLDS)).toBe(2)
    expect(upgradeCount(1_700_000, THRESHOLDS)).toBe(1)
    expect(upgradeCount(2_000_000, THRESHOLDS)).toBe(0)
  })

  it('counts a duration exactly at a threshold', () => {
    expect(upgradeCount(1_440_000, THRESHOLDS)).toBe(2)
  })

  it('returns 0 for null, undefined, or empty thresholds', () => {
    expect(upgradeCount(1_000_000, null)).toBe(0)
    expect(upgradeCount(1_000_000, undefined)).toBe(0)
    expect(upgradeCount(1_000_000, [])).toBe(0)
  })
})
