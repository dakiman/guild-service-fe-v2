export type TalentNodeType = 'regular' | 'choice'

export interface TalentNodeRank {
  spell_id: number
  name: string
}

export interface TalentChoiceOption {
  talent_id: number
  spell_id: number
  name: string
}

export interface TalentNode {
  id: number
  display_row: number
  display_col: number
  type: TalentNodeType
  ranks: TalentNodeRank[]
  choice_options: TalentChoiceOption[] | null
}

export interface HeroTree {
  id: number
  name: string
  nodes: TalentNode[]
}

export interface TalentEdge {
  from: number
  to: number
}

export interface TalentTreeTopology {
  class_nodes: TalentNode[]
  spec_nodes: TalentNode[]
  hero_trees: HeroTree[]
  edges: TalentEdge[]
}

export interface TalentTreeResponse {
  tree_id: number
  spec_id: number
  name: string
  tree: TalentTreeTopology
}

/** Resolved icon-ref the summary-strip composable returns. */
export interface TalentNodeRef {
  /** Source node id, kept so :key can be stable. */
  node_id: number
  /** Spell id used for both the icon (via Wowhead) and the tooltip. */
  spell_id: number
  /** "1/3" rendered next to the icon, or null for choice / single-rank. */
  rank_label: string | null
  /** Section the node came from — used only for ordering, not styling. */
  section: 'class' | 'hero' | 'spec'
}
