/**
 * Registry season slugs are `season-<expansion>-<n>` (e.g. `season-mn-2`).
 * Leaderboard URLs carry the short form (`/leaderboards/mn-2/eu`); the BE
 * always takes the full slug. These two helpers are the only place that
 * knows about the prefix.
 */
export function seasonSegment(slug: string): string {
  return slug.replace(/^season-/, '')
}

export function seasonSlugFromSegment(segment: string): string {
  return segment.startsWith('season-') ? segment : `season-${segment}`
}
