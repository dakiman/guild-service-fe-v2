<template>
  <section class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h2 class="ma-text-heading text-xl">Mythic+ Progression</h2>
      <span v-if="seasonLabel" class="text-xs text-ma-muted/70 uppercase tracking-wider">
        {{ seasonLabel }}
      </span>
    </header>

    <MythicPlusKpiTiles
      :runs="runs"
      :rating="rating"
      :current-season="currentSeason"
    />

    <div v-if="isLoading" class="ma-card p-6 text-sm text-ma-muted/70">
      Loading dungeon data…
    </div>
    <div v-else-if="isError" class="ma-card p-6 text-sm text-red-300">
      Couldn't load dungeon data.
      <button type="button" class="underline" @click="() => refetch()">Retry</button>
    </div>
    <template v-else>
      <nav class="flex gap-1" role="tablist">
        <button
          v-for="view in VIEWS"
          :key="view.key"
          type="button"
          class="ma-tab"
          :class="{ 'ma-tab--active': activeView === view.key }"
          role="tab"
          :aria-selected="activeView === view.key"
          @click="activeView = view.key"
        >
          <component :is="view.icon" class="w-4 h-4" />
          <span>{{ view.label }}</span>
        </button>
      </nav>

      <MythicPlusBestPerDungeon
        v-if="activeView === 'best'"
        :runs="runs"
        :dungeons="dungeons"
        :affixes="affixes"
        :current-season="currentSeason"
      />
      <MythicPlusAllRuns
        v-else
        :runs="runs"
        :affixes="affixes"
        :current-season="currentSeason"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Trophy, ListOrdered } from 'lucide-vue-next'
import MythicPlusKpiTiles from './MythicPlusKpiTiles.vue'
import MythicPlusBestPerDungeon from './MythicPlusBestPerDungeon.vue'
import MythicPlusAllRuns from './MythicPlusAllRuns.vue'
import { useMythicDungeons } from '@/composables/usePveGameData'
import type { DungeonRun, MythicPlusRating } from '@/types/character'

const props = defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
}>()

interface ViewDescriptor {
  key: 'best' | 'all'
  label: string
  icon: Component
}

const VIEWS: ViewDescriptor[] = [
  { key: 'best', label: 'Best per Dungeon', icon: Trophy },
  { key: 'all',  label: 'All Runs',         icon: ListOrdered },
]

const activeView = ref<ViewDescriptor['key']>('best')

const { data, isLoading, isError, refetch } = useMythicDungeons()

const dungeons = computed(() => data.value?.dungeons ?? [])
const affixes = computed(() => data.value?.affixes ?? {})
const currentSeason = computed<number | null>(() => data.value?.season?.id ?? null)
const seasonLabel = computed<string | null>(() => data.value?.season?.name ?? null)

// Re-export so the linter doesn't trip on the unused-variable rule for `props`.
void props
</script>
