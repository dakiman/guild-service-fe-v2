import { describe, it, expect } from 'vitest'
import { buildWowheadHref } from './wowhead'

describe('buildWowheadHref', () => {
  it('builds an item-only href', () => {
    expect(buildWowheadHref({ itemId: 123 })).toBe('item=123')
  })

  it('builds a spell-only href', () => {
    expect(buildWowheadHref({ spellId: 456 })).toBe('spell=456')
  })

  it('appends ilvl when item is present', () => {
    expect(buildWowheadHref({ itemId: 123, itemLevel: 486 })).toBe('item=123&ilvl=486')
  })

  it('joins bonus ids with colons', () => {
    expect(
      buildWowheadHref({ itemId: 1, bonus: [7981, 8781, 9144] }),
    ).toBe('item=1&bonus=7981:8781:9144')
  })

  it('preserves zero-placeholder empty sockets in gems', () => {
    expect(
      buildWowheadHref({ itemId: 1, gems: [192985, 0, 192958] }),
    ).toBe('item=1&gems=192985:0:192958')
  })

  it('joins enchantments with colons', () => {
    expect(
      buildWowheadHref({ itemId: 1, enchantments: [6652] }),
    ).toBe('item=1&ench=6652')
  })

  it('joins pcs and adds domain=classic when classic=true', () => {
    expect(
      buildWowheadHref({
        itemId: 1,
        pcs: [219326, 219327],
        classic: true,
      }),
    ).toBe('item=1&pcs=219326:219327&domain=classic')
  })

  it('omits empty array params', () => {
    expect(
      buildWowheadHref({
        itemId: 1,
        bonus: [],
        gems: [],
        enchantments: [],
        pcs: [],
      }),
    ).toBe('item=1')
  })

  it('combines every param in the spec order', () => {
    expect(
      buildWowheadHref({
        itemId: 219325,
        itemLevel: 486,
        bonus: [7981, 8781, 9144],
        gems: [192985, 0, 192958],
        enchantments: [6652],
        pcs: [219326, 219327],
        classic: true,
      }),
    ).toBe(
      'item=219325&ilvl=486&bonus=7981:8781:9144&gems=192985:0:192958&ench=6652&pcs=219326:219327&domain=classic',
    )
  })

  it('returns empty string when nothing useful is given', () => {
    expect(buildWowheadHref({})).toBe('')
  })
})
