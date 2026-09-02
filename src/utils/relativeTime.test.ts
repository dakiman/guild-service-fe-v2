import { describe, it, expect } from 'vitest'
import { relativeTime } from './relativeTime'

const NOW = Date.UTC(2026, 8, 1, 12, 0, 0)

describe('relativeTime', () => {
  it('returns null for missing or unparseable input', () => {
    expect(relativeTime(null, NOW)).toBeNull()
    expect(relativeTime(undefined, NOW)).toBeNull()
    expect(relativeTime('nope', NOW)).toBeNull()
  })

  it('formats minutes, hours (<48h) and days', () => {
    expect(relativeTime(new Date(NOW - 30_000).toISOString(), NOW)).toBe('just now')
    expect(relativeTime(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe('5m ago')
    expect(relativeTime(new Date(NOW - 7 * 3_600_000).toISOString(), NOW)).toBe('7h ago')
    expect(relativeTime(new Date(NOW - 47 * 3_600_000).toISOString(), NOW)).toBe('47h ago')
    expect(relativeTime(new Date(NOW - 3 * 86_400_000).toISOString(), NOW)).toBe('3d ago')
  })
})
