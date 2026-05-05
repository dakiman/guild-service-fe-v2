<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CLASS_COLORS } from '@/utils/wowConstants'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import type { TopPerformer } from '@/types/stats'

defineProps<{
  title: string
  entries: TopPerformer[]
  valueLabel: string
  formatValue?: (v: number) => string
}>()

function defaultFormat(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 })
}
</script>

<template>
  <div class="card border border-base-content/5 bg-base-200 shadow-md">
    <div class="card-body">
      <h2 class="card-title text-lg">{{ title }}</h2>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="(entry, index) in entries"
          :key="`${entry.region}-${entry.realm}-${entry.name}`"
          class="flex items-center gap-3 rounded-md bg-base-100 px-3 py-2"
        >
          <!-- Rank -->
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
            :class="{
              'bg-yellow-500/20 text-yellow-400': index === 0,
              'bg-gray-400/20 text-gray-300': index === 1,
              'bg-amber-700/20 text-amber-600': index === 2,
              'bg-base-300 text-base-content/50': index > 2,
            }"
          >
            {{ index + 1 }}
          </span>

          <!-- Class icon -->
          <ClassIcon :class-id="entry.class_id" :size="20" />

          <!-- Character name (link) -->
          <RouterLink
            :to="{ name: 'character-detail', params: { region: entry.region, realm: entry.realm, name: entry.name } }"
            class="flex-1 truncate text-sm font-medium hover:underline"
            :style="{ color: CLASS_COLORS[entry.class_id] }"
          >
            {{ entry.name }}
          </RouterLink>

          <!-- Value -->
          <span class="text-sm font-semibold tabular-nums">
            {{ (formatValue ?? defaultFormat)(entry.value) }}
          </span>
        </div>

        <p v-if="entries.length === 0" class="text-sm text-base-content/50 py-2 text-center">
          No data yet
        </p>
      </div>
    </div>
  </div>
</template>
