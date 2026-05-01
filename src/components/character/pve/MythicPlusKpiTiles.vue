<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">M+ Score</span>
      <span class="font-bold text-lg tabular-nums" :style="scoreStyle">
        {{ scoreLabel }}
      </span>
    </div>
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 10+</span>
      <span class="font-bold text-lg tabular-nums text-ma-gold">{{ timed10 }}</span>
    </div>
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 5+</span>
      <span class="font-bold text-lg tabular-nums text-ma-gold">{{ timed5 }}</span>
    </div>
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 2+</span>
      <span class="font-bold text-lg tabular-nums text-ma-gold">{{ timed2 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DungeonRun, MythicPlusRating } from '@/types/character'

const props = defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
  currentSeason: number | null
}>()

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const timedRuns = computed(() => seasonRuns.value.filter((r) => r.is_completed_on_time))

const timed10 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 10).length)
const timed5 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 5).length)
const timed2 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 2).length)

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

// `mythic_plus_rating_color` lives on the BE today but isn't surfaced on
// the FE type — fall back to the gold accent until that wiring exists.
const scoreStyle = computed(() => ({ color: 'rgb(var(--ma-gold))' }))
</script>
