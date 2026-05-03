<template>
  <section class="talent-column">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
      {{ title }}
    </h3>

    <!-- Hero entry / "capstone" header strip. Hoisted out of the grid so
         the keystone talents read as a separate, prominent row. Class &
         spec columns don't pass hoistEntry. -->
    <div
      v-if="hoistEntry && entryNodes.length"
      class="talent-column__capstones"
      :style="{ marginBottom: `${cellSize / 4}px` }"
    >
      <TalentNode
        v-for="node in entryNodes"
        :key="`entry-${node.id}`"
        :spell-id="spellIdFor(node)"
        :is-picked="pickedIds.has(node.id)"
        :is-choice="node.type === 'choice'"
        :rank-label="rankLabelFor(node)"
        :class-color="classColor"
        :cell-size="Math.round(cellSize * 1.25)"
      />
    </div>

    <div class="talent-column__grid" :style="gridStyle">
      <TalentEdges
        :nodes="gridNodes"
        :edges="gridEdges"
        :picked-ids="pickedIds"
        :cell-size="cellSize"
        :cols="cols"
        :rows="rows"
        :col-offset="colOffset"
        :row-offset="rowOffset"
      />
      <TalentNode
        v-for="node in gridNodes"
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
  /** Hero column only: hoist the lowest-display_row nodes into a
      centered header strip above the grid. */
  hoistEntry?: boolean
}>()

const cellSize = computed(() => props.cellSize ?? 44)

const entryRow = computed(() => {
  if (!props.hoistEntry || props.nodes.length === 0) return null
  return Math.min(...props.nodes.map((n) => n.display_row))
})

const entryNodes = computed(() => {
  if (entryRow.value === null) return []
  return props.nodes
    .filter((n) => n.display_row === entryRow.value)
    .sort((a, b) => a.display_col - b.display_col)
})

const gridNodes = computed(() => {
  if (entryRow.value === null) return props.nodes
  return props.nodes.filter((n) => n.display_row !== entryRow.value)
})

const gridEdges = computed(() => {
  if (entryRow.value === null) return props.edges
  // Drop edges incident to entry-row nodes; the visual gap above the grid
  // reads as the connector to the hoisted capstone strip.
  const entryIds = new Set(entryNodes.value.map((n) => n.id))
  return props.edges.filter((e) => !entryIds.has(e.from) && !entryIds.has(e.to))
})

// Blizzard's display_row / display_col are absolute coords across the
// whole talent-tree response, so a single subtree (e.g. spec) often
// starts at col=9 or row=1 with cols 0..8 / row 0 unused. Normalize
// each subtree to start at (0, 0) so the column doesn't render a
// large blank gutter on its left/top edge.
const colOffset = computed(() =>
  gridNodes.value.length === 0 ? 0 : Math.min(...gridNodes.value.map((n) => n.display_col)),
)
const rowOffset = computed(() =>
  gridNodes.value.length === 0 ? 0 : Math.min(...gridNodes.value.map((n) => n.display_row)),
)
const cols = computed(() =>
  gridNodes.value.length === 0
    ? 1
    : Math.max(...gridNodes.value.map((n) => n.display_col)) - colOffset.value + 1,
)
const rows = computed(() =>
  gridNodes.value.length === 0
    ? 1
    : Math.max(...gridNodes.value.map((n) => n.display_row)) - rowOffset.value + 1,
)

const gridStyle = computed(() => ({
  position: 'relative' as const,
  width: `${cols.value * cellSize.value}px`,
  height: `${rows.value * cellSize.value}px`,
  // Center the grid horizontally inside the column when the column has
  // extra width (e.g. hero column is narrower than its share of side-by-side
  // space, or vertically-stacked layouts).
  margin: '0 auto',
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
  min-width: 0;
}
.talent-column__capstones {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
