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
import { computed } from 'vue'
import { useRaidInstances, useMythicDungeons } from '@/composables/usePveGameData'
import type { MythicPlusRating, RaidEncounterProgress } from '@/types/character'
import type { RaidInstanceGameData } from '@/types/gameData'

const props = defineProps<{
  rating: MythicPlusRating | null
  raidProgress: RaidEncounterProgress[] | null
}>()

const { data: raidData } = useRaidInstances()
const { data: dungeonData } = useMythicDungeons()

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

const seasonLabel = computed<string | null>(() => dungeonData.value?.season?.name ?? null)

interface RaidHeadline {
  killed: number
  total: number
  difficulty: 'Mythic' | 'Heroic' | 'Normal' | 'LFR'
  instanceName: string
}

const DIFFICULTY_PRIORITY: { key: 'mythic' | 'heroic' | 'normal' | 'lfr'; label: RaidHeadline['difficulty'] }[] = [
  { key: 'mythic', label: 'Mythic' },
  { key: 'heroic', label: 'Heroic' },
  { key: 'normal', label: 'Normal' },
  { key: 'lfr',    label: 'LFR' },
]

function matchesDifficulty(row: RaidEncounterProgress, key: typeof DIFFICULTY_PRIORITY[number]['key']): boolean {
  const lower = row.difficulty.toLowerCase()
  if (key === 'lfr') return lower.includes('lfr') || lower.includes('raid finder')
  return lower.includes(key)
}

const headlineCandidate = computed<RaidHeadline | null>(() => {
  const instances = raidData.value?.instances ?? []
  const progress = props.raidProgress ?? []
  if (instances.length === 0) return null

  // Find the latest expansion (instances response is unordered; use display_order DESC).
  const latestExpansionId = instances.reduce<number | null>(
    (acc, instance) =>
      acc == null || instance.expansion.display_order > (instances.find((i) => i.expansion.id === acc)?.expansion.display_order ?? -Infinity)
        ? instance.expansion.id
        : acc,
    null,
  )
  if (latestExpansionId == null) return null

  const latestInstances = instances.filter((i) => i.expansion.id === latestExpansionId)

  for (const diff of DIFFICULTY_PRIORITY) {
    let best: { instance: RaidInstanceGameData; killed: number } | null = null
    for (const instance of latestInstances) {
      const killed = progress.filter(
        (row) => row.instance_id === instance.id && matchesDifficulty(row, diff.key),
      ).length
      if (killed > 0 && (!best || killed > best.killed)) {
        best = { instance, killed }
      }
    }
    if (best) {
      return {
        killed: best.killed,
        total: best.instance.encounters.length,
        difficulty: diff.label,
        instanceName: best.instance.name,
      }
    }
  }
  return null
})

const raidHeadline = computed<string>(() => {
  const c = headlineCandidate.value
  if (!c) return '—'
  const short = c.difficulty === 'Mythic' ? 'M' : c.difficulty === 'Heroic' ? 'H' : c.difficulty === 'Normal' ? 'N' : 'LFR'
  return `${c.killed}/${c.total} ${short}`
})

const raidSubtitle = computed<string | null>(() => headlineCandidate.value?.instanceName ?? null)
</script>
