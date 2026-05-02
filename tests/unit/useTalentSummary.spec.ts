import { describe, it, expect } from 'vitest'
import { computeTalentSummary } from '@/composables/useTalentSummary'
import type {
  TalentTreeTopology,
  TalentNode,
} from '@/types/talents'
import type { CharacterTalents } from '@/types/character'

function regular(id: number, row: number, col: number, spellId: number): TalentNode {
  return {
    id,
    display_row: row,
    display_col: col,
    type: 'regular',
    ranks: [{ spell_id: spellId, name: '' }],
    choice_options: null,
  }
}

function choice(
  id: number,
  row: number,
  col: number,
  optA: { talent_id: number; spell_id: number },
  optB: { talent_id: number; spell_id: number },
): TalentNode {
  return {
    id,
    display_row: row,
    display_col: col,
    type: 'choice',
    ranks: [],
    choice_options: [
      { ...optA, name: '' },
      { ...optB, name: '' },
    ],
  }
}

const heroBase: TalentTreeTopology['hero_trees'][number] = {
  id: 31,
  name: 'Deathstalker',
  nodes: [
    regular(3001, 0, 1, 800001),
    choice(3002, 1, 1, { talent_id: 1, spell_id: 800002 }, { talent_id: 2, spell_id: 800003 }),
    regular(3003, 2, 1, 800004),
  ],
}

const otherHero: TalentTreeTopology['hero_trees'][number] = {
  id: 32,
  name: 'Trickster',
  nodes: [regular(3101, 0, 1, 900001)],
}

const baseTopology = (): TalentTreeTopology => ({
  class_nodes: [
    choice(1001, 0, 4, { talent_id: 10, spell_id: 100001 }, { talent_id: 11, spell_id: 100002 }),
    choice(1002, 5, 4, { talent_id: 12, spell_id: 100003 }, { talent_id: 13, spell_id: 100004 }),
    choice(1003, 6, 4, { talent_id: 14, spell_id: 100005 }, { talent_id: 15, spell_id: 100006 }),
    regular(1004, 7, 1, 100007),
  ],
  spec_nodes: [
    choice(2001, 1, 2, { talent_id: 20, spell_id: 200001 }, { talent_id: 21, spell_id: 200002 }),
    choice(2002, 4, 2, { talent_id: 22, spell_id: 200003 }, { talent_id: 23, spell_id: 200004 }),
    choice(2003, 5, 3, { talent_id: 24, spell_id: 200005 }, { talent_id: 25, spell_id: 200006 }),
  ],
  hero_trees: [heroBase, otherHero],
  edges: [],
})

function picked(): CharacterTalents {
  return {
    class: [
      { id: 1003, spell_id: 100005, rank: 1, max_rank: 1 },
      { id: 1002, spell_id: 100003, rank: 1, max_rank: 1 },
      { id: 1001, spell_id: 100001, rank: 1, max_rank: 1 },
      { id: 1004, spell_id: 100007, rank: 1, max_rank: 1 },
    ],
    spec: [
      { id: 2003, spell_id: 200005, rank: 1, max_rank: 1 },
      { id: 2002, spell_id: 200003, rank: 1, max_rank: 1 },
      { id: 2001, spell_id: 200001, rank: 1, max_rank: 1 },
    ],
    hero: [
      { id: 3001, spell_id: 800001, rank: 1, max_rank: 1 },
      { id: 3002, spell_id: 800002, rank: 1, max_rank: 1 },
    ],
    pvp: [],
  }
}

describe('computeTalentSummary', () => {
  it('returns 6 icons in Class -> Hero -> Spec order at full quota', () => {
    const result = computeTalentSummary(picked(), baseTopology())
    expect(result).toHaveLength(6)
    const sections = result.map((r) => r.section)
    expect(sections).toEqual(['class', 'class', 'hero', 'hero', 'spec', 'spec'])
  })

  it('picks the two deepest class choice nodes by display_row desc', () => {
    const result = computeTalentSummary(picked(), baseTopology())
    const classRefs = result.filter((r) => r.section === 'class')
    expect(classRefs.map((r) => r.node_id)).toEqual([1003, 1002])
  })

  it('drops to 5 icons when the active hero tree has no picked choice node', () => {
    const p = picked()
    p.hero = [{ id: 3001, spell_id: 800001, rank: 1, max_rank: 1 }]
    const result = computeTalentSummary(p, baseTopology())
    expect(result).toHaveLength(5)
    const heroRefs = result.filter((r) => r.section === 'hero')
    expect(heroRefs).toHaveLength(1)
    expect(heroRefs[0].node_id).toBe(3001)
  })

  it('tie-breaks on equal display_row by lower display_col then lower id', () => {
    const topo = baseTopology()
    topo.class_nodes.push(
      choice(1010, 6, 2, { talent_id: 99, spell_id: 9001 }, { talent_id: 100, spell_id: 9002 }),
    )
    const p = picked()
    p.class.push({ id: 1010, spell_id: 9001, rank: 1, max_rank: 1 })

    const result = computeTalentSummary(p, topo)
    const classIds = result.filter((r) => r.section === 'class').map((r) => r.node_id)
    // Top 2 of {1003 row6 col4, 1010 row6 col2, 1002 row5}: row desc -> 1010 / 1003 (both row6),
    // col asc tiebreak -> 1010 (col2) before 1003 (col4).
    expect(classIds).toEqual([1010, 1003])
  })

  it('falls back to deepest non-choice picked talents when choice quota is unmet', () => {
    const p = picked()
    p.class = [
      { id: 1001, spell_id: 100001, rank: 1, max_rank: 1 },
      { id: 1004, spell_id: 100007, rank: 1, max_rank: 1 },
    ]
    const result = computeTalentSummary(p, baseTopology())
    const classRefs = result.filter((r) => r.section === 'class')
    expect(classRefs).toHaveLength(2)
    expect(classRefs.map((r) => r.node_id).sort()).toEqual([1001, 1004])
  })

  it('returns empty array when picked talents are empty (low-level char)', () => {
    expect(
      computeTalentSummary(
        { class: [], spec: [], hero: [], pvp: [] },
        baseTopology(),
      ),
    ).toEqual([])
  })
})
