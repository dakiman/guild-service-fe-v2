<template>
  <section class="talent-column">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
      {{ title }}
    </h3>
    <!-- Inner scroller. Some Blizzard spec trees use display_col up to ~22
         (multi-lane layout), which is wider than a phone. The grid keeps
         its natural pixel width; this wrapper scrolls within the column
         so the page doesn't horizontally overflow. -->
    <div class="talent-column__scroll">
      <div class="talent-column__grid" :style="gridStyle">
        <TalentEdges
          :nodes="nodes"
          :edges="edges"
          :picked-ids="pickedIds"
          :cell-size="cellSize"
          :cols="cols"
          :rows="rows"
          :col-offset="colOffset"
          :row-offset="rowOffset"
        />
        <TalentNode
          v-for="node in nodes"
          :key="node.id"
          :spell-id="spellIdFor(node)"
          :is-picked="pickedIds.has(node.id)"
          :is-choice="node.type === 'choice'"
          :rank-label="rankLabelFor(node)"
          :class-color="classColor"
          :row="node.display_row - rowOffset"
          :col="node.display_col - colOffset"
          :cell-size="cellSize"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TalentEdges from './TalentEdges.vue'
import TalentNode from './TalentNode.vue'
import type { TalentEdge, TalentNode as TalentNodeT } from '@/types/talents'
import type { TalentEntry } from '@/types/character'

const props = defineProps<{
  title: string
  nodes: TalentNodeT[]
  edges: TalentEdge[]
  picked: TalentEntry[]
  classColor?: string | null
  cellSize?: number
}>()

const cellSize = computed(() => props.cellSize ?? 44)

// Blizzard's display_row / display_col are absolute coords across the
// whole talent-tree response, so a single subtree (e.g. spec) often
// starts at col=9 or row=1 with cols 0..8 / row 0 unused. Normalize
// each subtree to start at (0, 0) so the column doesn't render a
// large blank gutter on its left/top edge.
const colOffset = computed(() =>
  props.nodes.length === 0 ? 0 : Math.min(...props.nodes.map((n) => n.display_col)),
)
const rowOffset = computed(() =>
  props.nodes.length === 0 ? 0 : Math.min(...props.nodes.map((n) => n.display_row)),
)
const cols = computed(() =>
  props.nodes.length === 0
    ? 1
    : Math.max(...props.nodes.map((n) => n.display_col)) - colOffset.value + 1,
)
const rows = computed(() =>
  props.nodes.length === 0
    ? 1
    : Math.max(...props.nodes.map((n) => n.display_row)) - rowOffset.value + 1,
)

const gridStyle = computed(() => ({
  position: 'relative' as const,
  width: `${cols.value * cellSize.value}px`,
  height: `${rows.value * cellSize.value}px`,
}))

const pickedById = computed(() => {
  const m = new Map<number, TalentEntry>()
  for (const p of props.picked) m.set(p.id, p)
  return m
})

const pickedIds = computed(() => new Set(pickedById.value.keys()))

function spellIdFor(node: TalentNodeT): number {
  const p = pickedById.value.get(node.id)
  if (p) return p.spell_id
  if (node.type === 'choice' && node.choice_options && node.choice_options[0]) {
    return node.choice_options[0].spell_id
  }
  return node.ranks[0]?.spell_id ?? 0
}

function rankLabelFor(node: TalentNodeT): string | null {
  const p = pickedById.value.get(node.id)
  if (!p) return null
  if (p.max_rank > 1) return `${p.rank}/${p.max_rank}`
  return null
}
</script>

<style scoped>
.talent-column {
  /* Allow the section to shrink below its natural content width inside a
     flex parent. Without this, flex's default min-width: auto pins the
     column to its grid's pixel width and pushes the layout sideways. */
  min-width: 0;
}
.talent-column__scroll {
  overflow-x: auto;
  max-width: 100%;
  /* A bit of bottom padding so the horizontal scrollbar doesn't sit on
     top of the bottom row of nodes on browsers that overlay it. */
  padding-bottom: 4px;
}
</style>
