import type { CharacterTalents, TalentEntry } from '@/types/character'
import type {
  HeroTree,
  TalentNode,
  TalentNodeRef,
  TalentTreeTopology,
} from '@/types/talents'
import { resolveNodeSpellId } from '@/utils/talentTopology'

const CLASS_QUOTA = 2
const SPEC_QUOTA = 2

interface NodeIndex {
  byId: Map<number, TalentNode>
}

function indexTopology(tree: TalentTreeTopology): {
  classIndex: NodeIndex
  specIndex: NodeIndex
  heroIndexes: Map<number, NodeIndex>
} {
  const classIndex: NodeIndex = { byId: new Map() }
  for (const n of tree.class_nodes) classIndex.byId.set(n.id, n)

  const specIndex: NodeIndex = { byId: new Map() }
  for (const n of tree.spec_nodes) specIndex.byId.set(n.id, n)

  const heroIndexes = new Map<number, NodeIndex>()
  for (const h of tree.hero_trees) {
    const idx: NodeIndex = { byId: new Map() }
    for (const n of h.nodes) idx.byId.set(n.id, n)
    heroIndexes.set(h.id, idx)
  }

  return { classIndex, specIndex, heroIndexes }
}

interface PickedWithNode {
  picked: TalentEntry
  node: TalentNode
}

function joinPicked(picks: TalentEntry[], index: NodeIndex): PickedWithNode[] {
  const out: PickedWithNode[] = []
  for (const p of picks) {
    const node = index.byId.get(p.id)
    if (node) out.push({ picked: p, node })
  }
  return out
}

/**
 * Sort by display_row desc, then display_col asc, then id asc.
 */
function sortDeepestFirst(arr: PickedWithNode[]): PickedWithNode[] {
  return [...arr].sort((a, b) => {
    if (b.node.display_row !== a.node.display_row) return b.node.display_row - a.node.display_row
    if (a.node.display_col !== b.node.display_col) return a.node.display_col - b.node.display_col
    return a.node.id - b.node.id
  })
}

function rankLabel(p: TalentEntry): string | null {
  if (p.max_rank > 1) return `${p.rank}/${p.max_rank}`
  return null
}

function toRef(p: PickedWithNode, section: 'class' | 'hero' | 'spec'): TalentNodeRef {
  return {
    node_id: p.node.id,
    spell_id: resolveNodeSpellId(p.node, p.picked),
    rank_label: rankLabel(p.picked),
    section,
  }
}

/**
 * Pick `quota` deepest choice nodes; if fewer than `quota` were picked, top up
 * with the deepest non-choice picked talents until quota is met.
 */
function pickForSection(
  picks: PickedWithNode[],
  quota: number,
  section: 'class' | 'hero' | 'spec',
): TalentNodeRef[] {
  if (quota === 0) return []
  const choices = picks.filter((p) => p.node.type === 'choice')
  const regulars = picks.filter((p) => p.node.type === 'regular')

  const sortedChoices = sortDeepestFirst(choices).slice(0, quota)
  const need = quota - sortedChoices.length
  const topUp = need > 0 ? sortDeepestFirst(regulars).slice(0, need) : []

  return [...sortedChoices, ...topUp].map((p) => toRef(p, section))
}

function pickForHero(
  pickedHero: PickedWithNode[],
  activeHero: HeroTree | null,
): TalentNodeRef[] {
  if (activeHero === null || pickedHero.length === 0) return []

  // Entry / keystone = the picked node with the lowest display_row.
  const ascending = [...pickedHero].sort((a, b) => {
    if (a.node.display_row !== b.node.display_row) return a.node.display_row - b.node.display_row
    if (a.node.display_col !== b.node.display_col) return a.node.display_col - b.node.display_col
    return a.node.id - b.node.id
  })
  const entry = ascending[0]
  const remaining = ascending.slice(1)

  const choices = remaining.filter((p) => p.node.type === 'choice')
  const deepestChoice = sortDeepestFirst(choices)[0] ?? null

  const refs: TalentNodeRef[] = [toRef(entry, 'hero')]
  if (deepestChoice !== null) refs.push(toRef(deepestChoice, 'hero'))
  return refs
}

function findActiveHeroTree(
  picks: TalentEntry[],
  tree: TalentTreeTopology,
): HeroTree | null {
  const pickedIds = new Set(picks.map((p) => p.id))
  for (const h of tree.hero_trees) {
    if (h.nodes.some((n) => pickedIds.has(n.id))) return h
  }
  return null
}

export function computeTalentSummary(
  picked: CharacterTalents,
  tree: TalentTreeTopology,
): TalentNodeRef[] {
  const totalPicks =
    (picked.class?.length ?? 0) +
    (picked.spec?.length ?? 0) +
    (picked.hero?.length ?? 0)
  if (totalPicks === 0) return []

  const { classIndex, specIndex, heroIndexes } = indexTopology(tree)

  const pickedClass = joinPicked(picked.class ?? [], classIndex)
  const pickedSpec = joinPicked(picked.spec ?? [], specIndex)

  const activeHero = findActiveHeroTree(picked.hero ?? [], tree)
  const pickedHero = activeHero
    ? joinPicked(picked.hero ?? [], heroIndexes.get(activeHero.id)!)
    : []

  return [
    ...pickForSection(pickedClass, CLASS_QUOTA, 'class'),
    ...pickForHero(pickedHero, activeHero),
    ...pickForSection(pickedSpec, SPEC_QUOTA, 'spec'),
  ]
}
