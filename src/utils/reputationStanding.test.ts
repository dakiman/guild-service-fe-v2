import { describe, expect, it } from 'vitest'
import {
  STANDING_ORDER,
  standingColor,
  standingLabel,
} from './reputationStanding'
import type { ReputationStanding } from '@/types/character'

describe('reputationStanding', () => {
  it('orders exalted highest', () => {
    expect(STANDING_ORDER.exalted).toBe(8)
    expect(STANDING_ORDER.hated).toBe(1)
  })

  it('returns a Tailwind color class for every standing', () => {
    const standings: ReputationStanding[] = [
      'hated', 'hostile', 'unfriendly', 'neutral',
      'friendly', 'honored', 'revered', 'exalted',
    ]
    for (const s of standings) {
      expect(standingColor(s)).toMatch(/^(red|orange|gray|emerald|blue|violet|amber)-\d+$/)
    }
  })

  it('capitalizes the standing label', () => {
    expect(standingLabel('exalted')).toBe('Exalted')
    expect(standingLabel('unfriendly')).toBe('Unfriendly')
  })
})
