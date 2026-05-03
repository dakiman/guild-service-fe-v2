<template>
  <div class="flex flex-col gap-6">
    <DungeonsHeadline
      :runs="character.dungeon_runs"
      :rating="character.mythic_plus_rating"
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
        :runs="character.dungeon_runs"
        :dungeons="dungeons"
        :affixes="affixes"
        :current-season="currentSeason"
      />
      <MythicPlusAllRuns
        v-else
        :runs="character.dungeon_runs"
        :dungeons="dungeons"
        :affixes="affixes"
        :current-season="currentSeason"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Trophy, ListOrdered } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import { useMythicDungeons } from '@/composables/usePveGameData'
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

const dungeons = computed(() => data.value?.dungeons ?? [])
const affixes = computed(() => data.value?.affixes ?? {})
const currentSeason = computed<number | null>(() => data.value?.season?.id ?? null)
</script>
