<template>
  <div class="flex flex-col gap-6">
    <DungeonsHeadline
      :runs="character.dungeon_runs ?? []"
      :rating="isCurrentSelected && character.mythic_plus_rating?.is_current ? character.mythic_plus_rating : null"
      :current-season="effectiveSeason"
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
    <ErrorState
      v-else-if="isError"
      :error="error"
      title="Couldn't load dungeon data"
      @retry="refetch()"
    />
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
          :value="effectiveSeason ?? ''"
          @change="onSeasonChange"
        >
          <option v-for="opt in seasonOptions" :key="opt.id" :value="opt.id">
            {{ opt.name }}
          </option>
        </select>
      </div>

      <EmptyTab
        v-if="seasonRuns.length === 0"
        slice="mythic_plus"
        :freshness="freshnessState"
        title="No runs this season"
        :message="emptyMessage"
        :icon="Skull"
      />
      <MythicPlusBestPerDungeon v-else-if="activeView === 'best'" :runs="seasonRuns" :dungeons="dungeons" />
      <MythicPlusAllRuns v-else :runs="seasonRuns" :dungeons="dungeons" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Trophy, ListOrdered, Skull } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import { useMythicDungeons, useSeasons } from '@/composables/usePveGameData'
import { useQueryParam, intParam } from '@/composables/useQueryParam'
import DungeonsHeadline from '@/components/character/pve/DungeonsHeadline.vue'
import MythicPlusBestPerDungeon from '@/components/character/pve/MythicPlusBestPerDungeon.vue'
import MythicPlusAllRuns from '@/components/character/pve/MythicPlusAllRuns.vue'
import EmptyTab from '@/components/character/EmptyTab.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'

const { character, freshness } = useCharacterContext()
const freshnessState = computed(() => freshness?.value?.mythic_plus)

interface ViewDescriptor {
  key: 'best' | 'all'
  label: string
  icon: Component
}

const VIEWS: ViewDescriptor[] = [
  { key: 'best', label: 'Best per Dungeon', icon: Trophy },
  { key: 'all',  label: 'All Runs',         icon: ListOrdered },
]

const activeView = useQueryParam<'best' | 'all'>('view', {
  default: 'best',
  parse: (raw) => (raw === 'all' || raw === 'best' ? raw : null),
})

const { data, isLoading, isError, error, refetch } = useMythicDungeons()
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

// null means "the current season" — the canonical URL carries no ?season=.
const selectedSeason = useQueryParam<number | null>('season', { default: null, parse: intParam })
const effectiveSeason = computed(() => selectedSeason.value ?? currentSeason.value)

const isCurrentSelected = computed(
  () => selectedSeason.value === null || selectedSeason.value === currentSeason.value,
)
const selectedSeasonName = computed(() =>
  effectiveSeason.value == null
    ? null
    : (seasonNameById.value.get(effectiveSeason.value) ?? `Season ${effectiveSeason.value}`),
)

const seasonRuns = computed(() => {
  const runs = character.value.dungeon_runs ?? []
  return effectiveSeason.value == null ? runs : runs.filter((r) => r.season === effectiveSeason.value)
})
const emptyMessage = computed(() => {
  const base = `No ${selectedSeasonName.value ?? 'Mythic+'} runs recorded yet.`
  return seasonOptions.value.length > 1 ? `${base} Pick an earlier season above to see past runs.` : base
})

function onSeasonChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const id = Number(value)
  selectedSeason.value = id === currentSeason.value ? null : id
}
</script>
