import { describe, expect, it } from 'vitest'
import { isGhostTalentNode, resolveNodeSpellId, sanitizeTopology } from './talentTopology'
import type { TalentNode, TalentTreeTopology } from '@/types/talents'
import type { TalentEntry } from '@/types/character'

function node(overrides: Partial<TalentNode> & { id: number }): TalentNode {
  return {
    display_row: 2,
    display_col: 4,
    type: 'regular',
    ranks: [{ spell_id: 1111, name: 'Some Talent' }],
    choice_options: null,
    ...overrides,
  }
}

function pick(overrides: Partial<TalentEntry> & { id: number }): TalentEntry {
  return { spell_id: 0, rank: 1, max_rank: 1, ...overrides }
}

describe('isGhostTalentNode', () => {
  it('flags the hero-subtree selector shape (choice, no ranks, no options)', () => {
    // Real payload shape: Rogue class node 99842.
    expect(
      isGhostTalentNode(node({ id: 99842, type: 'choice', ranks: [], choice_options: null })),
    ).toBe(true)
  })

  it('flags degenerate regular nodes (Evoker spec node 93196 shape)', () => {
    expect(isGhostTalentNode(node({ id: 93196, ranks: [] }))).toBe(true)
  })

  it('keeps regular nodes with ranks', () => {
    expect(isGhostTalentNode(node({ id: 1 }))).toBe(false)
  })

  it('keeps choice nodes with options even when ranks are empty', () => {
    const n = node({
      id: 2,
      type: 'choice',
      ranks: [],
      choice_options: [{ talent_id: 10, spell_id: 2222, name: 'Option A' }],
    })
    expect(isGhostTalentNode(n)).toBe(false)
  })
})

describe('sanitizeTopology', () => {
  const tree: TalentTreeTopology = {
    class_nodes: [node({ id: 1 }), node({ id: 99842, type: 'choice', ranks: [], choice_options: null })],
    spec_nodes: [node({ id: 3 }), node({ id: 93196, ranks: [] })],
    hero_trees: [{ id: 50, name: 'Deathstalker', nodes: [node({ id: 4 })] }],
    edges: [
      { from: 1, to: 3 },
      { from: 99842, to: 1 }, // incident to a ghost — must be dropped
      { from: 3, to: 93196 }, // incident to a ghost — must be dropped
    ],
  }

  it('drops ghost nodes from class, spec, and hero node lists', () => {
    const out = sanitizeTopology(tree)
    expect(out.class_nodes.map((n) => n.id)).toEqual([1])
    expect(out.spec_nodes.map((n) => n.id)).toEqual([3])
    expect(out.hero_trees[0].nodes.map((n) => n.id)).toEqual([4])
  })

  it('drops edges incident to removed nodes', () => {
    expect(sanitizeTopology(tree).edges).toEqual([{ from: 1, to: 3 }])
  })

  it('does not mutate the input tree', () => {
    sanitizeTopology(tree)
    expect(tree.class_nodes).toHaveLength(2)
    expect(tree.edges).toHaveLength(3)
  })
})

describe('resolveNodeSpellId', () => {
  it('prefers the picked spell id when present', () => {
    expect(resolveNodeSpellId(node({ id: 1 }), pick({ id: 1, spell_id: 9999 }))).toBe(9999)
  })

  it('falls back to first rank when picked spell_id is 0 (Mist Wrap case)', () => {
    const n = node({ id: 101093, ranks: [{ spell_id: 197900, name: 'Mist Wrap' }] })
    expect(resolveNodeSpellId(n, pick({ id: 101093 }))).toBe(197900)
  })

  it('falls back to first choice option for choice nodes', () => {
    const n = node({
      id: 2,
      type: 'choice',
      ranks: [],
      choice_options: [{ talent_id: 10, spell_id: 2222, name: 'Option A' }],
    })
    expect(resolveNodeSpellId(n, pick({ id: 2 }))).toBe(2222)
  })

  it('resolves from ranks when nothing is picked', () => {
    expect(resolveNodeSpellId(node({ id: 1, ranks: [{ spell_id: 1111, name: 'T' }] }))).toBe(1111)
  })

  it('returns 0 when there is nothing to resolve', () => {
    expect(resolveNodeSpellId(node({ id: 3, ranks: [], choice_options: null }))).toBe(0)
  })
})
