<template>
  <details class="group">
    <summary class="flex items-center justify-between cursor-pointer select-none rounded-lg px-4 py-3 wsa-card-inner hover:brightness-110 transition">
      <span class="text-sm font-medium">{{ label }}</span>
      <div class="flex items-center gap-3">
        <span class="text-[11px] text-wsa-muted/60 tabular-nums">
          {{ entries.length }} factions · {{ exaltedCount }} exalted
        </span>
        <svg
          class="size-4 text-wsa-muted/50 transition-transform group-open:rotate-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </summary>
    <div class="mt-2 flex flex-col gap-1 pl-2">
      <ReputationRow
        v-for="rep in sorted"
        :key="rep.faction_id"
        :rep="rep"
        compact
      />
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation } from '@/types/character'
import { compareByStanding } from '@/utils/reputationStanding'
import ReputationRow from './ReputationRow.vue'

const props = defineProps<{
  label: string
  entries: Reputation[]
}>()

const exaltedCount = computed(() => props.entries.filter((r) => r.standing === 'exalted').length)

const sorted = computed(() =>
  [...props.entries].sort((a, b) => {
    const s = compareByStanding(a.standing, b.standing)
    if (s !== 0) return s
    return a.faction_name.localeCompare(b.faction_name)
  }),
)
</script>
