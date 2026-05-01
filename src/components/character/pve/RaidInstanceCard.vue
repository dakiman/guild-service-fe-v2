<template>
  <div class="ma-card overflow-hidden">
    <!-- Header strip: raid background tinted dark, instance name overlaid. -->
    <div
      class="relative px-4 py-5 border-b border-ma-border/30"
      :style="headerStyle"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div class="relative flex items-center justify-between">
        <h3 class="ma-text-heading text-lg">{{ instance.name }}</h3>
        <span class="text-xs text-ma-muted/70 uppercase tracking-wider">
          {{ instance.expansion.name }}
        </span>
      </div>
    </div>

    <!-- Difficulty tabs: per-difficulty X/Y counts -->
    <div class="flex flex-wrap gap-1 px-3 py-2 border-b border-ma-border/20">
      <button
        v-for="diff in DIFFICULTIES"
        :key="diff.key"
        type="button"
        class="ma-tab text-xs"
        :class="[
          activeDifficulty === diff.key ? 'ma-tab--active' : '',
          difficultyBorderClass(diff.key),
          'border-l-2 pl-3',
        ]"
        @click="activeDifficulty = diff.key"
      >
        <span>{{ diff.label }}</span>
        <span class="tabular-nums text-ma-muted/80">
          {{ killedCountFor(diff.key) }}/{{ instance.encounters.length }}
        </span>
      </button>
    </div>

    <!-- Boss grid for the active difficulty -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
      <BossRow
        v-for="encounter in sortedEncounters"
        :key="encounter.id"
        :encounter="encounter"
        :progress="progressFor(encounter.id, activeDifficulty)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BossRow from './BossRow.vue'
import type { RaidInstanceGameData } from '@/types/gameData'
import type { RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  instance: RaidInstanceGameData
  progress: RaidEncounterProgress[] | null
}>()

interface DifficultyDescriptor {
  key: 'lfr' | 'normal' | 'heroic' | 'mythic'
  label: string
}

const DIFFICULTIES: DifficultyDescriptor[] = [
  { key: 'lfr',     label: 'LFR' },
  { key: 'normal',  label: 'Normal' },
  { key: 'heroic',  label: 'Heroic' },
  { key: 'mythic',  label: 'Mythic' },
]

const activeDifficulty = ref<DifficultyDescriptor['key']>('mythic')

const instanceProgress = computed<RaidEncounterProgress[]>(() => {
  if (!props.progress) return []
  return props.progress.filter((row) => row.instance_id === props.instance.id)
})

const sortedEncounters = computed(() =>
  [...props.instance.encounters].sort((a, b) => a.display_order - b.display_order),
)

const headerStyle = computed(() => {
  if (!props.instance.media_url) {
    return { backgroundColor: 'rgb(var(--ma-card-inner) / 0.5)' }
  }
  return {
    backgroundImage: `url(${props.instance.media_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

function matchesDifficulty(row: RaidEncounterProgress, key: DifficultyDescriptor['key']): boolean {
  const lower = row.difficulty.toLowerCase()
  if (key === 'lfr') return lower.includes('lfr') || lower.includes('raid finder')
  return lower.includes(key)
}

function progressFor(encounterId: number, key: DifficultyDescriptor['key']): RaidEncounterProgress | null {
  return (
    instanceProgress.value.find(
      (row) => row.encounter_id === encounterId && matchesDifficulty(row, key),
    ) ?? null
  )
}

function killedCountFor(key: DifficultyDescriptor['key']): number {
  return instanceProgress.value.filter((row) => matchesDifficulty(row, key)).length
}

function difficultyBorderClass(key: DifficultyDescriptor['key']): string {
  switch (key) {
    case 'mythic': return 'border-orange-500'
    case 'heroic': return 'border-purple-500'
    case 'normal': return 'border-blue-500'
    case 'lfr':    return 'border-teal-500'
  }
}
</script>
