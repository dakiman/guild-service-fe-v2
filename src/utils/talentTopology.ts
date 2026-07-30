import type { HeroTree, TalentNode, TalentTreeTopology } from '@/types/talents'
import type { TalentEntry } from '@/types/character'

/**
 * Blizzard's tree payload includes pseudo-nodes that carry no castable
 * content — no ranks and no choice options. The universal one is the
 * hero-subtree selector present in every class tree (picked with
 * spell_id 0 by every character); Evoker additionally ships a degenerate
 * regular node in its spec tree. They render as empty highlight rings,
 * so strip them before layout.
 */
export function isGhostTalentNode(node: TalentNode): boolean {
  return node.ranks.length === 0 && (node.choice_options?.length ?? 0) === 0
}

/**
 * Blizzard also parks hero/spec-granted duplicates of real talents inside
 * `class_talent_nodes` at far-off display coords (e.g. Evoker's Mass
 * Disintegrate at col 23 next to a col 1-7 body). They carry edges, so
 * connectivity can't isolate them — but across all 40 specs, body columns
 * are never more than 2 apart while these strays sit >= 3 columns out.
 * Cluster the used columns on that gap and keep the biggest cluster.
 */
const MAX_BODY_COL_GAP = 2

function stripOffGridNodes(nodes: TalentNode[]): TalentNode[] {
  if (nodes.length === 0) return nodes
  const cols = Array.from(new Set(nodes.map((n) => n.display_col))).sort((a, b) => a - b)
  const clusters: number[][] = [[cols[0]]]
  for (let i = 1; i < cols.length; i++) {
    if (cols[i] - cols[i - 1] > MAX_BODY_COL_GAP) clusters.push([])
    clusters[clusters.length - 1].push(cols[i])
  }
  if (clusters.length === 1) return nodes
  const countByCol = new Map<number, number>()
  for (const n of nodes) countByCol.set(n.display_col, (countByCol.get(n.display_col) ?? 0) + 1)
  const clusterSize = (c: number[]) => c.reduce((sum, col) => sum + countByCol.get(col)!, 0)
  let body = clusters[0]
  for (const c of clusters) if (clusterSize(c) > clusterSize(body)) body = c
  const keep = new Set(body)
  return nodes.filter((n) => keep.has(n.display_col))
}

export function sanitizeTopology(tree: TalentTreeTopology): TalentTreeTopology {
  const clean = (nodes: TalentNode[]) =>
    stripOffGridNodes(nodes.filter((n) => !isGhostTalentNode(n)))
  const class_nodes = clean(tree.class_nodes)
  const spec_nodes = clean(tree.spec_nodes)
  const hero_trees = tree.hero_trees.map((h): HeroTree => ({ ...h, nodes: clean(h.nodes) }))
  const kept = new Set<number>([
    ...class_nodes.map((n) => n.id),
    ...spec_nodes.map((n) => n.id),
    ...hero_trees.flatMap((h) => h.nodes.map((n) => n.id)),
  ])
  return {
    class_nodes,
    spec_nodes,
    hero_trees,
    edges: tree.edges.filter((e) => kept.has(e.from) && kept.has(e.to)),
  }
}

/**
 * Spell id for a node, preferring the character's pick but falling back
 * to static tree data — Blizzard returns spell_id 0 on some picked
 * entries even for valid nodes.
 */
export function resolveNodeSpellId(node: TalentNode, picked?: TalentEntry): number {
  if (picked?.spell_id) return picked.spell_id
  if (node.type === 'choice' && node.choice_options && node.choice_options[0]) {
    return node.choice_options[0].spell_id
  }
  return node.ranks[0]?.spell_id ?? 0
}
