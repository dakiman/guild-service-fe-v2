<template>
  <div class="flex flex-col gap-4">
    <details v-if="currentGroup" class="group" open>
      <summary class="flex items-center justify-between cursor-pointer select-none rounded-lg px-4 py-3 ma-card-inner hover:brightness-110 transition">
        <span class="text-sm font-medium">{{ currentGroup.label }}</span>
        <div class="flex items-center gap-3">
          <span class="text-[11px] text-ma-muted/60 tabular-nums">
            {{ currentGroup.entries.length }} factions
          </span>
          <svg
            class="size-4 text-ma-muted/50 transition-transform group-open:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </summary>
      <div class="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        <ReputationRow
          v-for="rep in currentGroupSorted"
          :key="rep.faction_id"
          :rep="rep"
        />
      </div>
    </details>

    <ReputationExpansionGroup
      v-for="group in olderGroups"
      :key="group.label"
      :label="group.label"
      :entries="group.entries"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation } from '@/types/character'
import { compareByStanding } from '@/utils/reputationStanding'
import ReputationRow from './reputations/ReputationRow.vue'
import ReputationExpansionGroup from './reputations/ReputationExpansionGroup.vue'

const PINNED_FACTION_IDS = [2744]

const props = defineProps<{
  entries: Reputation[] | null
}>()

interface ExpansionGroup {
  label: string
  order: number
  entries: Reputation[]
}

function bucketOf(rep: Reputation): { label: string; order: number } {
  if (rep.faction?.expansion) {
    return { label: rep.faction.expansion.name, order: rep.faction.expansion.display_order }
  }
  return { label: 'Legacy', order: 99 }
}

const groupedByExpansion = computed<ExpansionGroup[]>(() => {
  if (!props.entries) return []
  const byLabel = new Map<string, ExpansionGroup>()
  for (const rep of props.entries) {
    const { label, order } = bucketOf(rep)
    let group = byLabel.get(label)
    if (!group) {
      group = { label, order, entries: [] }
      byLabel.set(label, group)
    }
    group.entries.push(rep)
  }
  return Array.from(byLabel.values()).sort((a, b) => a.order - b.order)
})

const currentGroup = computed<ExpansionGroup | null>(() => {
  const groups = groupedByExpansion.value
  if (groups.length === 0) return null
  const first = groups[0]
  if (first.order === 99) return null
  return first
})

const currentGroupSorted = computed<Reputation[]>(() => {
  if (!currentGroup.value) return []
  return [...currentGroup.value.entries].sort((a, b) => {
    const pinnedA = PINNED_FACTION_IDS.includes(a.faction_id) ? 0 : 1
    const pinnedB = PINNED_FACTION_IDS.includes(b.faction_id) ? 0 : 1
    if (pinnedA !== pinnedB) return pinnedA - pinnedB
    const s = compareByStanding(a.standing, b.standing)
    if (s !== 0) return s
    return a.faction_name.localeCompare(b.faction_name)
  })
})

const olderGroups = computed<ExpansionGroup[]>(() => {
  const groups = groupedByExpansion.value
  if (groups.length === 0) return []
  if (currentGroup.value) return groups.slice(1)
  return groups
})
</script>
