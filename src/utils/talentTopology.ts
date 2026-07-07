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

export function sanitizeTopology(tree: TalentTreeTopology): TalentTreeTopology {
  const clean = (nodes: TalentNode[]) => nodes.filter((n) => !isGhostTalentNode(n))
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
