<template>
  <div class="flex flex-wrap gap-1.5">
    <span
      v-for="slice in slices"
      :key="slice.key"
      class="wsa-stat-pill !py-1 !px-2.5 !gap-1.5 text-xs"
      :title="tooltip(slice.label, freshness[slice.key])"
    >
      <component
        :is="iconFor(freshness[slice.key])"
        class="w-3 h-3"
        :class="iconClass(freshness[slice.key])"
      />
      {{ slice.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleDashed, CircleAlert, RefreshCw, type LucideIcon } from 'lucide-vue-next'
import type { FreshnessState, MetaBlock } from '@/types/character'

const props = defineProps<{ freshness: MetaBlock['freshness'] }>()

const SLICE_ORDER: Array<{ key: keyof MetaBlock['freshness']; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'mythic_plus', label: 'M+' },
  { key: 'pvp', label: 'PvP' },
  { key: 'professions', label: 'Profs' },
  { key: 'raids', label: 'Raids' },
  { key: 'stats', label: 'Stats' },
  { key: 'titles', label: 'Titles' },
  { key: 'reputations', label: 'Reps' },
  { key: 'collections', label: 'Collect.' },
  { key: 'achievements', label: 'Achievs' },
]

const slices = computed(() => SLICE_ORDER.filter((s) => s.key in props.freshness))

function iconFor(state: FreshnessState | undefined): LucideIcon {
  if (state === 'fresh') return CircleCheck
  if (state === 'stale') return CircleAlert
  if (state === 'never_synced') return RefreshCw
  return CircleDashed
}

function iconClass(state: FreshnessState | undefined): string {
  if (state === 'fresh') return 'text-success'
  if (state === 'stale') return 'text-warning'
  if (state === 'never_synced') return 'text-info animate-spin'
  return 'text-base-content/40'
}

function tooltip(sliceLabel: string, state: FreshnessState | undefined): string {
  if (state === 'fresh') return `${sliceLabel} synced`
  if (state === 'stale') return `${sliceLabel} data is outdated — will refresh on next sync`
  if (state === 'never_synced') return `${sliceLabel} sync in progress`
  return `${sliceLabel} not synced yet`
}
</script>
