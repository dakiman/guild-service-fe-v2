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

function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}
</script>

<template>
  <div class="wsa-card">
    <div class="p-2">
      <h2 class="wsa-text-heading text-[15px] text-lg mb-4">{{ title }}</h2>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="(entry, index) in entries"
          :key="`${entry.region}-${entry.realm}-${entry.name}`"
          class="flex items-center gap-3 rounded-md px-3 py-2"
          style="background: rgba(0, 0, 0, 0.25)"
        >
          <!-- Rank -->
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
            :style="{
              backgroundColor: index === 0 ? 'rgba(255, 204, 136, 0.2)'
                : index === 1 ? 'rgba(192, 192, 192, 0.2)'
                : index === 2 ? 'rgba(205, 127, 50, 0.2)'
                : 'rgba(0, 0, 0, 0.3)',
              color: index === 0 ? '#ffcc88'
                : index === 1 ? '#c0c0c0'
                : index === 2 ? '#cd7f32'
                : '#665533',
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
            {{ displayName(entry.name) }}
          </RouterLink>

          <!-- Value -->
          <span class="text-sm font-semibold tabular-nums" style="color: #e0d0b0">
            {{ (formatValue ?? defaultFormat)(entry.value) }}
          </span>
        </div>

        <p v-if="entries.length === 0" class="text-sm py-2 text-center" style="color: #665533">
          No data yet
        </p>
      </div>
    </div>
  </div>
</template>
