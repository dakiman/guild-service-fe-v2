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

describe('sanitizeTopology — off-grid node stripping', () => {
  // Evoker Devastation shape: class body cols 1-7, granted duplicate
  // (Mass Disintegrate) parked at row 2 / col 23.
  const evokerClass = [
    node({ id: 10, display_row: 4, display_col: 2 }),
    node({ id: 11, display_row: 4, display_col: 4 }),
    node({ id: 12, display_row: 4, display_col: 6 }),
    node({ id: 13, display_row: 6, display_col: 1 }),
    node({ id: 14, display_row: 6, display_col: 7 }),
    node({ id: 15, display_row: 2, display_col: 23 }), // outlier
  ]

  it('strips single nodes in columns separated from the body by a gap >= 3', () => {
    const out = sanitizeTopology({
      class_nodes: evokerClass,
      spec_nodes: [],
      hero_trees: [],
      edges: [],
    })
    expect(out.class_nodes.map((n) => n.id)).toEqual([10, 11, 12, 13, 14])
  })

  it('keeps bodies with internal 2-col gaps (Havoc spec shape)', () => {
    // Havoc spec: cols 14,15,16,18,19,21,22 — cols 17 and 20 empty but real.
    const havocSpec = [14, 15, 16, 18, 19, 21, 22].map((c, i) =>
      node({ id: 20 + i, display_row: 3 + (i % 2), display_col: c }),
    )
    const out = sanitizeTopology({
      class_nodes: [],
      spec_nodes: havocSpec,
      hero_trees: [],
      edges: [],
    })
    expect(out.spec_nodes).toHaveLength(7)
  })

  it('keeps the cluster with the most nodes, not the leftmost', () => {
    // Outlier column left of the body must also be stripped.
    const nodes = [
      node({ id: 30, display_row: 2, display_col: 1 }), // outlier
      node({ id: 31, display_row: 2, display_col: 8 }),
      node({ id: 32, display_row: 3, display_col: 9 }),
      node({ id: 33, display_row: 4, display_col: 10 }),
    ]
    const out = sanitizeTopology({
      class_nodes: nodes,
      spec_nodes: [],
      hero_trees: [],
      edges: [],
    })
    expect(out.class_nodes.map((n) => n.id)).toEqual([31, 32, 33])
  })

  it('applies per hero tree', () => {
    const out = sanitizeTopology({
      class_nodes: [],
      spec_nodes: [],
      hero_trees: [
        {
          id: 50,
          name: 'Scalecommander',
          nodes: [
            node({ id: 40, display_row: 1, display_col: 10 }),
            node({ id: 41, display_row: 2, display_col: 11 }),
            node({ id: 42, display_row: 1, display_col: 20 }), // outlier
          ],
        },
      ],
      edges: [],
    })
    expect(out.hero_trees[0].nodes.map((n) => n.id)).toEqual([40, 41])
  })

  it('drops edges incident to stripped off-grid nodes', () => {
    const out = sanitizeTopology({
      class_nodes: evokerClass,
      spec_nodes: [],
      hero_trees: [],
      edges: [
        { from: 10, to: 11 },
        { from: 14, to: 15 }, // to the outlier — must be dropped
      ],
    })
    expect(out.edges).toEqual([{ from: 10, to: 11 }])
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
