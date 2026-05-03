<template>
  <div class="ma-card p-5 flex flex-col gap-3">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Raid Progression</span>
      <span class="text-4xl font-bold tabular-nums text-ma-gold">{{ heroLabel }}</span>
      <span v-if="instanceName" class="text-xs text-ma-muted/60 mt-1">{{ instanceName }}</span>
    </div>
    <div v-if="secondaryRow" class="flex flex-wrap gap-2">
      <span
        v-for="chip in secondaryRow"
        :key="chip.label"
        class="ma-stat-pill text-xs text-ma-muted/80"
      >
        <span class="font-semibold">{{ chip.label }}</span>
        <span class="tabular-nums">{{ chip.killed }}/{{ chip.total }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRaidInstances } from '@/composables/usePveGameData'
import { useBestRaidProgression, shortDifficulty, matchesDifficulty } from '@/composables/useBestRaidProgression'
import type { RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  raidProgress: RaidEncounterProgress[] | null
}>()

const headline = useBestRaidProgression(toRef(props, 'raidProgress'))
const { data: raidData } = useRaidInstances()

const heroLabel = computed<string>(() => {
  const c = headline.value
  if (!c) return '—'
  return `${c.killed}/${c.total} ${shortDifficulty(c.difficulty)}`
})

const instanceName = computed<string | null>(() => headline.value?.instanceName ?? null)

interface DifficultyChip { label: 'N' | 'H' | 'M'; killed: number; total: number }

const DIFFICULTY_CHIPS: { label: 'N' | 'H' | 'M'; key: 'normal' | 'heroic' | 'mythic' }[] = [
  { label: 'N', key: 'normal' },
  { label: 'H', key: 'heroic' },
  { label: 'M', key: 'mythic' },
]

const secondaryRow = computed<DifficultyChip[] | null>(() => {
  const h = headline.value
  if (!h) return null
  const instance = raidData.value?.instances.find((i) => i.name === h.instanceName)
  if (!instance) return null
  const total = instance.encounters.length
  const progress = props.raidProgress ?? []
  return DIFFICULTY_CHIPS.map((d) => ({
    label: d.label,
    total,
    killed: progress.filter(
      (row) => row.instance_id === instance.id && matchesDifficulty(row, d.key),
    ).length,
  }))
})
</script>
