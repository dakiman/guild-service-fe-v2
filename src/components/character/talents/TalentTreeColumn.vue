<template>
  <section class="talent-column">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
      {{ title }}
    </h3>

    <!-- Hero entry / "capstone" header strip. Hoisted out of the grid so
         the keystone talents read as a separate, prominent row. Class &
         spec columns don't pass hoistEntry. The final capstone gets the
         mirrored strip below the grid. -->
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

    <!-- Mirrored bottom strip: the last hero row is a single node parked at an
         integer column that can't express "centered over the 4-wide body", so
         flex-centering it is what matches the in-game layout. -->
    <div
      v-if="bottomNodes.length"
      class="talent-column__capstones"
      :style="{ marginTop: `${cellSize / 4}px` }"
    >
      <TalentNode
        v-for="node in bottomNodes"
        :key="`bottom-${node.id}`"
        :spell-id="spellIdFor(node)"
        :is-picked="pickedIds.has(node.id)"
        :is-choice="node.type === 'choice'"
        :rank-label="rankLabelFor(node)"
        :class-color="classColor"
        :cell-size="Math.round(cellSize * 1.25)"
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
import { normalizeGridNodes, resolveNodeSpellId } from '@/utils/talentTopology'

const props = defineProps<{
  title: string
  nodes: TalentNodeT[]
  edges: TalentEdge[]
  picked: TalentEntry[]
  classColor?: string | null
  cellSize?: number
  /** Hero column only: hoist the lowest-display_row nodes into a centered
      header strip above the grid, and the single highest-display_row
      capstone into a mirrored strip below it. */
  hoistEntry?: boolean
}>()

const cellSize = computed(() => props.cellSize ?? 44)

const entryRow = computed(() => {
  if (!props.hoistEntry || props.nodes.length === 0) return null
  return Math.min(...props.nodes.map((n) => n.display_row))
})

const bottomRow = computed(() => {
  if (entryRow.value === null) return null
  const maxRow = Math.max(...props.nodes.map((n) => n.display_row))
  if (maxRow <= entryRow.value) return null
  // Degenerate trees (entry row + one more) would leave nothing behind —
  // only hoist the bottom capstone when a grid body survives between the strips.
  const hasBody = props.nodes.some((n) => n.display_row > entryRow.value! && n.display_row < maxRow)
  return hasBody ? maxRow : null
})

// A hoisted row is rendered flex-centered, so normalizeGridNodes' coord shift
// is irrelevant here — it runs for its same-cell dedupe: 20 hero trees ship the
// entry row as two spec-variant twins on one cell, and the picked one must win.
function stripNodesFor(row: number | null): TalentNodeT[] {
  if (row === null) return []
  const rowNodes = props.nodes.filter((n) => n.display_row === row)
  return normalizeGridNodes(rowNodes, pickedIds.value).sort((a, b) => a.display_col - b.display_col)
}

const entryNodes = computed(() => stripNodesFor(entryRow.value))
const bottomNodes = computed(() => stripNodesFor(bottomRow.value))

const rawGridNodes = computed(() => {
  if (entryRow.value === null) return props.nodes
  return props.nodes.filter(
    (n) => n.display_row !== entryRow.value && n.display_row !== bottomRow.value,
  )
})

const gridEdges = computed(() => {
  if (entryRow.value === null) return props.edges
  // Drop edges incident to hoisted nodes; the visual gap above/below the grid
  // reads as the connector to the capstone strips.
  const hoistedIds = new Set([...entryNodes.value, ...bottomNodes.value].map((n) => n.id))
  return props.edges.filter((e) => !hoistedIds.has(e.from) && !hoistedIds.has(e.to))
})

// Shift Blizzard's absolute display coords so the family's min row/col land
// at 0, preserving relative offsets — real empty columns (e.g. Havoc's spec
// tree) are part of the in-game geometry. sanitizeTopology has already
// stripped ghosts and off-grid strays, so no dense packing is needed.
const gridNodes = computed(() => normalizeGridNodes(rawGridNodes.value, pickedIds.value))

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
