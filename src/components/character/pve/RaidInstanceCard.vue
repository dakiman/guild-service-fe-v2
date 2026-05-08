<template>
  <div class="wsa-card overflow-hidden">
    <!-- Header strip: raid background tinted dark, instance name overlaid. -->
    <div
      class="relative px-4 py-5 border-b border-wsa-border/30"
      :style="headerStyle"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div class="relative flex items-center justify-between">
        <h3 class="wsa-text-heading text-lg">{{ instance.name }}</h3>
        <span class="text-xs text-wsa-muted/70 uppercase tracking-wider">
          {{ instance.expansion.name }}
        </span>
      </div>
    </div>

    <!-- Difficulty tabs: per-difficulty X/Y counts -->
    <div class="flex flex-wrap gap-1.5 px-3 py-2 border-b border-wsa-border/20">
      <button
        v-for="diff in DIFFICULTIES"
        :key="diff.key"
        type="button"
        class="wsa-tab text-xs border-l-4 pl-3 transition-all"
        :class="[
          difficultyBorderClass(diff.key),
          activeDifficulty === diff.key
            ? `wsa-tab--active font-semibold ring-2 ring-inset shadow-md ${difficultyActiveClass(diff.key)}`
            : 'opacity-60 hover:opacity-100',
        ]"
        @click="activeDifficulty = diff.key"
      >
        <span>{{ diff.label }}</span>
        <span
          class="tabular-nums"
          :class="activeDifficulty === diff.key ? 'text-wsa-text' : 'text-wsa-muted/80'"
        >
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

const instanceProgress = computed<RaidEncounterProgress[]>(() => {
  if (!props.progress) return []
  return props.progress.filter((row) => row.instance_id === props.instance.id)
})

// Default to the highest difficulty that has at least one kill, falling back
// to Mythic when nothing is killed yet (so the user lands on the most
// aspirational view by default — matches raider.io's behavior).
const DIFFICULTY_PRIORITY: DifficultyDescriptor['key'][] = ['mythic', 'heroic', 'normal', 'lfr']
const initialActive = DIFFICULTY_PRIORITY.find((key) => killedCountFor(key) > 0) ?? 'mythic'
const activeDifficulty = ref<DifficultyDescriptor['key']>(initialActive)

const sortedEncounters = computed(() =>
  [...props.instance.encounters].sort((a, b) => a.display_order - b.display_order),
)

const headerStyle = computed(() => {
  if (!props.instance.media_url) {
    return { backgroundColor: 'rgb(var(--wsa-card-inner) / 0.5)' }
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

function difficultyActiveClass(key: DifficultyDescriptor['key']): string {
  // Tint the active tab with a translucent fill matching the difficulty's
  // border color, plus a matching ring so the highlight pops without
  // changing the existing border-left accent.
  switch (key) {
    case 'mythic': return 'bg-orange-500/15 ring-orange-500/60'
    case 'heroic': return 'bg-purple-500/15 ring-purple-500/60'
    case 'normal': return 'bg-blue-500/15 ring-blue-500/60'
    case 'lfr':    return 'bg-teal-500/15 ring-teal-500/60'
  }
}
</script>
