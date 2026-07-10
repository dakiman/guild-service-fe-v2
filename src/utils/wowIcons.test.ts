import { describe, expect, it } from 'vitest'
import { SPEC_ICON_POS, SPEC_NAMES } from './wowIcons'
import { SPEC_TO_CLASS, SPEC_ROLES } from './wowConstants'

describe('spec maps consistency', () => {
  const specIds = Object.keys(SPEC_TO_CLASS).map(Number)

  it.each(specIds)('spec %i has an icon position, a name, and a role', (id) => {
    expect(SPEC_ICON_POS[id]).toBeDefined()
    expect(SPEC_NAMES[id]).toBeTypeOf('string')
    expect(['tank', 'healer', 'dps']).toContain(SPEC_ROLES[id])
  })

  it('includes Devourer (1480) as a Demon Hunter dps spec', () => {
    expect(SPEC_TO_CLASS[1480]).toBe(12)
    expect(SPEC_NAMES[1480]).toBe('Devourer')
    expect(SPEC_ROLES[1480]).toBe('dps')
    expect(SPEC_ICON_POS[1480]).toEqual([-64, -64])
  })

  it('maps Monk 269/270 per Blizzard ids (269 Windwalker dps, 270 Mistweaver healer)', () => {
    expect(SPEC_NAMES[269]).toBe('Windwalker')
    expect(SPEC_NAMES[270]).toBe('Mistweaver')
    expect(SPEC_ROLES[269]).toBe('dps')
    expect(SPEC_ROLES[270]).toBe('healer')
    expect(SPEC_ICON_POS[269]).toEqual([-64, -256]) // windwalker tile
    expect(SPEC_ICON_POS[270]).toEqual([0, -256]) // mistweaver tile
  })
})
