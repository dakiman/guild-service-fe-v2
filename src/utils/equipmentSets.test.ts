import { describe, it, expect } from 'vitest'
import { groupEquipmentBySetId, getPcsFor } from './equipmentSets'
import type { EquipmentItem } from '@/types/character'

function item(partial: Partial<EquipmentItem> & Pick<EquipmentItem, 'id'>): EquipmentItem {
  return {
    id: partial.id,
    name: partial.name ?? 'x',
    quality: partial.quality ?? 'epic',
    slot: partial.slot ?? 'head',
    item_level: partial.item_level ?? 1,
    bonus: partial.bonus ?? [],
    gems: partial.gems ?? [],
    enchantments: partial.enchantments ?? [],
    set_id: partial.set_id ?? null,
    stats: partial.stats ?? [],
  }
}

describe('groupEquipmentBySetId', () => {
  it('returns an empty map when no item has a set_id', () => {
    const groups = groupEquipmentBySetId([item({ id: 1 }), item({ id: 2 })])
    expect(groups.size).toBe(0)
  })

  it('groups items that share a set_id', () => {
    const groups = groupEquipmentBySetId([
      item({ id: 1, set_id: 1615 }),
      item({ id: 2, set_id: 1615 }),
      item({ id: 3, set_id: null }),
      item({ id: 4, set_id: 1616 }),
    ])
    expect(groups.get(1615)).toEqual([1, 2])
    expect(groups.get(1616)).toEqual([4])
    expect(groups.has(null as unknown as number)).toBe(false)
  })
})

describe('getPcsFor', () => {
  it('returns undefined when the item has no set_id', () => {
    const groups = new Map<number, number[]>()
    expect(getPcsFor(item({ id: 1, set_id: null }), groups)).toBeUndefined()
  })

  it('returns the full sibling list (including the item itself) when it belongs to a set', () => {
    const groups = new Map<number, number[]>([[1615, [1, 2, 3]]])
    expect(getPcsFor(item({ id: 2, set_id: 1615 }), groups)).toEqual([1, 2, 3])
  })

  it('returns undefined when the set_id is not in the group map', () => {
    const groups = new Map<number, number[]>()
    expect(getPcsFor(item({ id: 1, set_id: 9999 }), groups)).toBeUndefined()
  })
})
