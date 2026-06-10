<template>
  <svg
    class="talent-edges"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
  >
    <line
      v-for="edge in edgeLines"
      :key="`${edge.from}-${edge.to}`"
      :x1="edge.x1"
      :y1="edge.y1"
      :x2="edge.x2"
      :y2="edge.y2"
      :stroke="edge.bothPicked ? 'rgb(255 255 255 / 0.4)' : 'rgb(255 255 255 / 0.15)'"
      stroke-width="1"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TalentEdge, TalentNode } from '@/types/talents'

const props = defineProps<{
  nodes: TalentNode[]
  edges: TalentEdge[]
  pickedIds: Set<number>
  cellSize: number
  cols: number
  rows: number
  /** Subtract from every node's display_col before drawing — matches the
      normalization TalentTreeColumn does for the node icons. */
  colOffset?: number
  /** Subtract from every node's display_row before drawing. */
  rowOffset?: number
}>()

const width = computed(() => props.cols * props.cellSize)
const height = computed(() => props.rows * props.cellSize)

const nodeMap = computed(() => {
  const m = new Map<number, TalentNode>()
  for (const n of props.nodes) m.set(n.id, n)
  return m
})

const edgeLines = computed(() => {
  const colOff = props.colOffset ?? 0
  const rowOff = props.rowOffset ?? 0
  return props.edges
    .map((e) => {
      const from = nodeMap.value.get(e.from)
      const to = nodeMap.value.get(e.to)
      if (!from || !to) return null
      const half = props.cellSize / 2
      const iconHalf = (props.cellSize - 8) / 2
      const x1 = (from.display_col - colOff) * props.cellSize + half
      const y1 = (from.display_row - rowOff) * props.cellSize + half + iconHalf
      const x2 = (to.display_col - colOff) * props.cellSize + half
      const y2 = (to.display_row - rowOff) * props.cellSize + half - iconHalf
      const bothPicked = props.pickedIds.has(from.id) && props.pickedIds.has(to.id)
      return { from: from.id, to: to.id, x1, y1, x2, y2, bothPicked }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
})
</script>

<style scoped>
.talent-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
</style>
