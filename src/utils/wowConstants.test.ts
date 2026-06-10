import { describe, expect, it } from 'vitest'
import {
  RACES,
  RACE_FACTIONS,
  RACE_WOWHEAD_SLUGS,
  RACE_DEFAULT_GENDERS,
  STALE_DATA_DAYS,
} from './wowConstants'

describe('wowConstants race metadata', () => {
  const PLAYABLE_RACE_IDS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 22, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 34, 35, 36, 37, 52, 70, 84, 85,
  ]

  it.each(PLAYABLE_RACE_IDS)('has a name for race id %i', (id) => {
    expect(RACES[id]).toBeTypeOf('string')
    expect(RACES[id]).not.toBe('')
  })

  it.each(PLAYABLE_RACE_IDS)('has a wowhead slug for race id %i', (id) => {
    expect(RACE_WOWHEAD_SLUGS[id]).toMatch(/^[a-z]+$/)
  })

  it.each(PLAYABLE_RACE_IDS)('has a default gender for race id %i', (id) => {
    expect(['male', 'female']).toContain(RACE_DEFAULT_GENDERS[id])
  })

  it('maps Alliance / Horde / Neutral correctly', () => {
    expect(RACE_FACTIONS[1]).toBe('Alliance')   // Human
    expect(RACE_FACTIONS[2]).toBe('Horde')      // Orc
    expect(RACE_FACTIONS[24]).toBeNull()        // Neutral Pandaren
    expect(RACE_FACTIONS[25]).toBe('Alliance')  // Pandaren (A)
    expect(RACE_FACTIONS[26]).toBe('Horde')     // Pandaren (H)
    expect(RACE_FACTIONS[52]).toBe('Alliance')  // Dracthyr (A)
    expect(RACE_FACTIONS[70]).toBe('Horde')     // Dracthyr (H)
  })

  it('fixes the Nightborne typo', () => {
    expect(RACES[27]).toBe('Nightborne')
  })

  it('exposes a stale-data threshold in days', () => {
    expect(STALE_DATA_DAYS).toBeGreaterThan(0)
  })
})
