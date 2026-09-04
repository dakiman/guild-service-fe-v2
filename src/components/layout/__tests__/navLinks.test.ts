import { describe, it, expect } from 'vitest'
import { NAV_LINKS, isNavActive } from '../navLinks'

function link(name: string) {
  const l = NAV_LINKS.find((l) => l.name === name)
  if (!l) throw new Error(`no nav link ${name}`)
  return l
}

describe('NAV_LINKS', () => {
  it('has exactly the six links, in order, with no Home', () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual([
      'Guilds',
      'Characters',
      'Mythic+',
      'Leaderboards',
      'Meta',
      'Raids',
    ])
  })
})

describe('isNavActive', () => {
  it.each([
    ['guild-search', 'guild-search'],
    ['guild-search', 'guild-detail'],
    ['character-search', 'character-search'],
    ['character-search', 'character-detail'],
    ['character-search', 'character-talents'],
    ['character-search', 'character-collections-mounts'],
    ['mythic-plus', 'mythic-plus'],
    ['mythic-plus', 'mythic-plus-archive'],
    ['leaderboards', 'leaderboards'],
    ['leaderboards', 'leaderboards-region'],
    ['leaderboards', 'leaderboards-season-spec'],
    ['meta', 'meta'],
    ['raids', 'raids'],
  ])('%s is active on route %s', (navName, routeName) => {
    expect(isNavActive(link(navName), routeName)).toBe(true)
  })

  it.each([
    ['guild-search', 'character-detail'],
    ['character-search', 'guild-detail'],
    ['mythic-plus', 'meta'],
    ['meta', 'mythic-plus'],
    ['raids', 'character-raids'],
    ['leaderboards', 'home'],
  ])('%s is NOT active on route %s', (navName, routeName) => {
    expect(isNavActive(link(navName), routeName)).toBe(false)
  })

  it('is never active for a missing or non-string route name', () => {
    expect(isNavActive(link('meta'), undefined)).toBe(false)
    expect(isNavActive(link('meta'), null)).toBe(false)
    expect(isNavActive(link('meta'), Symbol('x'))).toBe(false)
  })
})
