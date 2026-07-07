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
      />
      <TalentNode
        v-for="node in gridNodes"
        :key="node.id"
        :spell-id="spellIdFor(node)"
        :is-picked="pickedIds.has(node.id)"
        :is-choice="node.type === 'choice'"
        :rank-label="rankLabelFor(node)"
        :class-color="classColor"
        :row="node.display_row"
        :col="node.display_col"
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
import { resolveNodeSpellId } from '@/utils/talentTopology'

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

const rawGridNodes = computed(() => {
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

// Pack rows/cols to a dense 0..N-1 sequence keyed off the unique values
// present in the grid. Blizzard's display coords are absolute across the
// full tree response and can leave both an outer gutter (e.g. spec starts
// at col=15) and inner gaps (e.g. Sub Rogue class jumps 7 → 11 over three
// empty cols). Without packing, the rendered grid bloats to the worst-case
// span and auto-fit shrinks every cell to fit, even though most of that
// width is empty. Edges still join by node id so visual connectivity is
// preserved across the collapsed gaps.
const gridNodes = computed(() => {
  const raw = rawGridNodes.value
  if (raw.length === 0) return []
  const uniqueRows = Array.from(new Set(raw.map((n) => n.display_row))).sort((a, b) => a - b)
  const uniqueCols = Array.from(new Set(raw.map((n) => n.display_col))).sort((a, b) => a - b)
  const rowMap = new Map(uniqueRows.map((r, i) => [r, i] as const))
  const colMap = new Map(uniqueCols.map((c, i) => [c, i] as const))
  return raw.map((n) => ({
    ...n,
    display_row: rowMap.get(n.display_row)!,
    display_col: colMap.get(n.display_col)!,
  }))
})

const cols = computed(() => {
  if (gridNodes.value.length === 0) return 1
  return Math.max(...gridNodes.value.map((n) => n.display_col)) + 1
})
const rows = computed(() => {
  if (gridNodes.value.length === 0) return 1
  return Math.max(...gridNodes.value.map((n) => n.display_row)) + 1
})

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
  return resolveNodeSpellId(node, pickedById.value.get(node.id))
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
