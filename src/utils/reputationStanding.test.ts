import { describe, expect, it } from 'vitest'
import {
  standingColor,
  standingLabel,
  standingSortKey,
  compareByStanding,
  parseRenown,
  isRenownBased,
  highestRenown,
} from './reputationStanding'

describe('reputationStanding', () => {
  describe('classic standings', () => {
    it('returns a color for every classic standing', () => {
      const standings = [
        'hated', 'hostile', 'unfriendly', 'neutral',
        'friendly', 'honored', 'revered', 'exalted',
      ]
      for (const s of standings) {
        expect(standingColor(s)).toMatch(/^(red|orange|gray|emerald|blue|violet|amber)-\d+$/)
      }
    })

    it('sorts exalted above hated', () => {
      expect(standingSortKey('exalted')).toBeGreaterThan(standingSortKey('hated'))
    })
  })

  describe('renown standings', () => {
    it('parses renown level', () => {
      expect(parseRenown('renown 16')).toBe(16)
      expect(parseRenown('renown 3')).toBe(3)
      expect(parseRenown('exalted')).toBeNull()
    })

    it('returns graduated colors for renown', () => {
      expect(standingColor('renown 3')).toBe('emerald-500')
      expect(standingColor('renown 7')).toBe('blue-400')
      expect(standingColor('renown 15')).toBe('violet-400')
      expect(standingColor('renown 25')).toBe('amber-400')
    })

    it('sorts higher renown above lower', () => {
      expect(compareByStanding('renown 16', 'renown 3')).toBeLessThan(0)
    })

    it('sorts renown above classic', () => {
      expect(standingSortKey('renown 5')).toBeGreaterThan(standingSortKey('exalted'))
    })
  })

  describe('unknown standings', () => {
    it('returns fallback gray for unknown', () => {
      expect(standingColor('interloper')).toBe('gray-400')
      expect(standingColor('socialite')).toBe('gray-400')
    })
  })

  describe('helpers', () => {
    it('capitalizes label', () => {
      expect(standingLabel('exalted')).toBe('Exalted')
      expect(standingLabel('renown 16')).toBe('Renown 16')
    })

    it('detects renown-based expansions', () => {
      expect(isRenownBased(['renown 10', 'renown 3'])).toBe(true)
      expect(isRenownBased(['exalted', 'honored'])).toBe(false)
    })

    it('finds highest renown (ignores level standings)', () => {
      expect(highestRenown(['renown 16', 'renown 3', 'level 30'])).toBe(16)
    })
  })
})
