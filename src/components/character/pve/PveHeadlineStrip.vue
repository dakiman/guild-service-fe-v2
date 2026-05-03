<template>
  <div class="ma-card p-5 flex flex-wrap items-center justify-between gap-6">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Best M+ Score</span>
      <span class="text-3xl font-bold tabular-nums text-ma-gold">{{ scoreLabel }}</span>
      <span v-if="seasonLabel" class="text-xs text-ma-muted/60 mt-1">{{ seasonLabel }}</span>
    </div>
    <div class="flex flex-col items-end">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Raid Progression</span>
      <span class="text-3xl font-bold tabular-nums text-ma-gold">{{ raidHeadline }}</span>
      <span v-if="raidSubtitle" class="text-xs text-ma-muted/60 mt-1">{{ raidSubtitle }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useMythicDungeons } from '@/composables/usePveGameData'
import { useBestRaidProgression, shortDifficulty } from '@/composables/useBestRaidProgression'
import type { MythicPlusRating, RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  rating: MythicPlusRating | null
  raidProgress: RaidEncounterProgress[] | null
}>()

const { data: dungeonData } = useMythicDungeons()
const headlineCandidate = useBestRaidProgression(toRef(props, 'raidProgress'))

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

const seasonLabel = computed<string | null>(() => dungeonData.value?.season?.name ?? null)

const raidHeadline = computed<string>(() => {
  const c = headlineCandidate.value
  if (!c) return '—'
  return `${c.killed}/${c.total} ${shortDifficulty(c.difficulty)}`
})

const raidSubtitle = computed<string | null>(() => headlineCandidate.value?.instanceName ?? null)
</script>
