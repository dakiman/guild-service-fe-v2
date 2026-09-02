import { describe, it, expect } from 'vitest'
import { seasonSegment, seasonSlugFromSegment } from './seasonSlugs'

describe('seasonSlugs', () => {
  it('strips the season- prefix for URLs and puts it back', () => {
    expect(seasonSegment('season-mn-2')).toBe('mn-2')
    expect(seasonSlugFromSegment('mn-2')).toBe('season-mn-2')
    expect(seasonSlugFromSegment(seasonSegment('season-tww-3'))).toBe('season-tww-3')
  })

  it('is idempotent on inputs that already have the right shape', () => {
    expect(seasonSegment('mn-1')).toBe('mn-1')
    expect(seasonSlugFromSegment('season-mn-1')).toBe('season-mn-1')
  })
})
