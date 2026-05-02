<template>
  <section class="talent-column">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
      {{ title }}
    </h3>
    <div class="talent-column__grid" :style="gridStyle">
      <TalentEdges
        :nodes="nodes"
        :edges="edges"
        :picked-ids="pickedIds"
        :cell-size="cellSize"
        :cols="cols"
        :rows="rows"
      />
      <TalentNode
        v-for="node in nodes"
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

const props = defineProps<{
  title: string
  nodes: TalentNodeT[]
  edges: TalentEdge[]
  picked: TalentEntry[]
  classColor?: string | null
  cellSize?: number
}>()

const cellSize = computed(() => props.cellSize ?? 44)

const cols = computed(() => Math.max(1, ...props.nodes.map((n) => n.display_col + 1)))
const rows = computed(() => Math.max(1, ...props.nodes.map((n) => n.display_row + 1)))

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
