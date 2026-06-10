<template>
  <div class="wsa-card p-5 flex flex-wrap items-center justify-between gap-6">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">M+ Score</span>
      <span class="text-4xl font-bold tabular-nums" :style="scoreStyle">
        {{ scoreLabel }}
      </span>
      <span v-if="seasonLabel" class="text-xs text-wsa-muted/60 mt-1">{{ seasonLabel }}</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="wsa-stat-pill">
        <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">Timed 2+</span>
        <span class="font-bold text-wsa-gold tabular-nums">{{ timed2 }}</span>
      </div>
      <div class="wsa-stat-pill">
        <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">Timed 5+</span>
        <span class="font-bold text-wsa-gold tabular-nums">{{ timed5 }}</span>
      </div>
      <div class="wsa-stat-pill">
        <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">Timed 10+</span>
        <span class="font-bold text-wsa-gold tabular-nums">{{ timed10 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMythicDungeons } from '@/composables/usePveGameData'
import type { DungeonRun, MythicPlusRating } from '@/types/character'

const props = defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
  currentSeason: number | null
}>()

const { data: dungeonData } = useMythicDungeons()

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

const scoreStyle = computed(() => {
  const color = props.rating?.color
  return { color: color ?? 'rgb(var(--wsa-gold))' }
})

const seasonLabel = computed<string | null>(() => dungeonData.value?.season?.name ?? null)

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const timedRuns = computed(() => seasonRuns.value.filter((r) => r.is_completed_on_time))
const timed2 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 2).length)
const timed5 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 5).length)
const timed10 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 10).length)
</script>
