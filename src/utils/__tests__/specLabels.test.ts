import { describe, expect, it } from 'vitest'
import { SPEC_FILTER_GROUPS, compTitle, specFullName } from '@/utils/specLabels'
import type { CompEntry } from '@/types/meta'

describe('specFullName', () => {
  it('joins spec and class names', () => {
    expect(specFullName(250)).toBe('Blood Death Knight')
    expect(specFullName(65)).toBe('Holy Paladin')
    expect(specFullName(102)).toBe('Balance Druid')
  })

  it('falls back to a generic label for unknown ids', () => {
    expect(specFullName(999999)).toBe('Spec 999999')
  })
})

describe('compTitle', () => {
  it('spells out tank · healer · dps / dps / dps', () => {
    const comp: CompEntry = {
      signature: '250:65:62,253,262',
      tank_spec_id: 250,
      healer_spec_id: 65,
      dps_spec_ids: [62, 253, 262],
      count: 10,
      timed_rate: 0.9,
    }
    expect(compTitle(comp)).toBe(
      'Blood Death Knight · Holy Paladin · Arcane Mage / Beast Mastery Hunter / Elemental Shaman',
    )
  })
})

describe('SPEC_FILTER_GROUPS', () => {
  it('has tank, healer, dps groups in that order with sorted options', () => {
    expect(SPEC_FILTER_GROUPS.map((g) => g.label)).toEqual(['Tank', 'Healer', 'DPS'])
    const tank = SPEC_FILTER_GROUPS[0].options
    expect(tank.map((o) => o.specId)).toContain(250)
    expect(tank.map((o) => o.label)).toEqual([...tank.map((o) => o.label)].sort())
    expect(SPEC_FILTER_GROUPS[1].options.some((o) => o.specId === 65)).toBe(true)
    expect(SPEC_FILTER_GROUPS[2].options.some((o) => o.specId === 62)).toBe(true)
  })
})
