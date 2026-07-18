<template>
  <div class="flex flex-col gap-6">
    <DungeonsHeadline
      :runs="character.dungeon_runs ?? []"
      :rating="isCurrentSelected ? character.mythic_plus_rating : null"
      :current-season="selectedSeason"
      :season-name="selectedSeasonName"
    />

    <div v-if="isLoading" class="wsa-card overflow-hidden">
      <div
        v-for="i in 6"
        :key="i"
        class="flex items-center gap-3 px-3 py-2.5 border-b border-wsa-border/15 last:border-0"
      >
        <div class="wsa-skeleton w-7 h-7 shrink-0" />
        <div class="wsa-skeleton h-4 w-1/3" />
        <div class="wsa-skeleton h-4 w-10 ml-auto" />
        <div class="wsa-skeleton h-4 w-12 hidden sm:block" />
      </div>
    </div>
    <div v-else-if="isError" class="wsa-card p-6 text-sm text-red-300">
      Couldn't load dungeon data.
      <button type="button" class="underline" @click="() => refetch()">Retry</button>
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <nav class="flex gap-1" role="tablist">
          <button
            v-for="view in VIEWS"
            :key="view.key"
            type="button"
            class="wsa-tab"
            :class="{ 'wsa-tab--active': activeView === view.key }"
            role="tab"
            :aria-selected="activeView === view.key"
            @click="activeView = view.key"
          >
            <component :is="view.icon" class="w-4 h-4" />
            <span>{{ view.label }}</span>
          </button>
        </nav>

        <select
          v-if="seasonOptions.length > 1"
          aria-label="Season"
          class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
          :value="selectedSeason ?? ''"
          @change="onSeasonChange"
        >
          <option v-for="opt in seasonOptions" :key="opt.id" :value="opt.id">
            {{ opt.name }}
          </option>
        </select>
      </div>

      <MythicPlusBestPerDungeon
        v-if="activeView === 'best'"
        :runs="character.dungeon_runs ?? []"
        :dungeons="dungeons"
        :current-season="selectedSeason"
      />
      <MythicPlusAllRuns
        v-else
        :runs="character.dungeon_runs ?? []"
        :dungeons="dungeons"
        :current-season="selectedSeason"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { Trophy, ListOrdered } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import { useMythicDungeons, useSeasons } from '@/composables/usePveGameData'
import DungeonsHeadline from '@/components/character/pve/DungeonsHeadline.vue'
import MythicPlusBestPerDungeon from '@/components/character/pve/MythicPlusBestPerDungeon.vue'
import MythicPlusAllRuns from '@/components/character/pve/MythicPlusAllRuns.vue'

const { character } = useCharacterContext()

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
const { data: seasonData } = useSeasons()

const dungeons = computed(() => data.value?.dungeons ?? [])
const currentSeason = computed<number | null>(() => data.value?.season?.id ?? null)

// Season switcher: every distinct season this character has stored runs
// for (our crawl keeps past-season runs Blizzard's armory no longer
// shows), newest first, named via the registry.
const seasonNameById = computed(() => {
  const map = new Map<number, string>()
  for (const s of seasonData.value?.seasons ?? []) map.set(s.id, s.name)
  return map
})

const seasonOptions = computed(() => {
  const ids = [...new Set((character.value.dungeon_runs ?? []).map((r) => r.season))]
  // The current season is always offered, even before any runs are stored.
  if (currentSeason.value != null && !ids.includes(currentSeason.value)) ids.push(currentSeason.value)
  return ids
    .sort((a, b) => b - a)
    .map((id) => ({ id, name: seasonNameById.value.get(id) ?? `Season ${id}` }))
})

// null until the registry answers → identical to today's unfiltered view.
const selectedSeason = ref<number | null>(null)
watch(currentSeason, (id) => {
  if (selectedSeason.value === null && id != null) selectedSeason.value = id
}, { immediate: true })

const isCurrentSelected = computed(
  () => selectedSeason.value === null || selectedSeason.value === currentSeason.value,
)
const selectedSeasonName = computed(() =>
  selectedSeason.value == null
    ? null
    : (seasonNameById.value.get(selectedSeason.value) ?? `Season ${selectedSeason.value}`),
)

function onSeasonChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  selectedSeason.value = value === '' ? null : Number(value)
}
</script>
