<template>
  <div class="flex flex-wrap gap-1">
    <span
      v-for="slice in slices"
      :key="slice.key"
      class="badge badge-sm"
      :class="badgeClass(freshness[slice.key])"
      :title="tooltip(slice.label, freshness[slice.key])"
    >
      {{ slice.label }}: {{ label(freshness[slice.key]) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { FreshnessState, MetaBlock } from '@/types/character'

defineProps<{ freshness: MetaBlock['freshness'] }>()

const slices: Array<{ key: keyof MetaBlock['freshness']; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'mythic_plus', label: 'M+' },
  { key: 'pvp', label: 'PvP' },
  { key: 'professions', label: 'Profs' },
  { key: 'raids', label: 'Raids' },
  { key: 'stats', label: 'Stats' },
  { key: 'titles', label: 'Titles' },
  { key: 'reputations', label: 'Reps' },
]

function badgeClass(state: FreshnessState): string {
  if (state === 'fresh') return 'badge-success'
  if (state === 'stale') return 'badge-warning'
  return 'badge-ghost'
}

function label(state: FreshnessState): string {
  if (state === 'fresh') return 'fresh'
  if (state === 'stale') return 'stale'
  return 'awaiting'
}

function tooltip(sliceLabel: string, state: FreshnessState): string {
  if (state === 'fresh') return `${sliceLabel} data is up to date`
  if (state === 'stale')
    return `${sliceLabel} data is being refreshed — reload shortly for newer data`
  return `${sliceLabel} has never been synced yet`
}
</script>
