<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import LookupForm from '@/components/form/LookupForm.vue'
import StatsHeroCard from '@/components/stats/StatsHeroCard.vue'
import StatMiniCard from '@/components/stats/StatMiniCard.vue'
import PerformanceByClassCard from '@/components/stats/PerformanceByClassCard.vue'
import TopPerformersCard from '@/components/stats/TopPerformersCard.vue'
import { useCharacterStats } from '@/composables/useCharacterStats'
import { CLASSES, CLASS_COLORS, RACES } from '@/utils/wowConstants'
import type { Region } from '@/types/api'

const router = useRouter()
const searchOpen = ref(false)

const { data: stats, isLoading, isError } = useCharacterStats()

function onSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'character-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}

const avgIlvl = computed(() => {
  if (!stats.value?.class_distribution.length) return '—'
  const total = stats.value.class_distribution.reduce((sum, c) => sum + c.avg_ilvl * c.count, 0)
  const count = stats.value.class_distribution.reduce((sum, c) => sum + c.count, 0)
  return (total / count).toFixed(1)
})

const avgRating = computed(() => {
  if (!stats.value?.class_distribution.length) return '—'
  const total = stats.value.class_distribution.reduce((sum, c) => sum + c.avg_mythic_plus_rating * c.count, 0)
  const count = stats.value.class_distribution.reduce((sum, c) => sum + c.count, 0)
  return (total / count).toFixed(0)
})

const topRace = computed(() => {
  if (!stats.value?.race_distribution.length) return { name: '—', count: 0 }
  const top = stats.value.race_distribution[0]
  return { name: RACES[top.race_id] ?? `Race ${top.race_id}`, count: top.count }
})

const topSpec = computed(() => {
  if (!stats.value?.spec_distribution.length) return { name: '—', count: 0 }
  const top = stats.value.spec_distribution[0]
  const className = CLASSES[top.class_id] ?? ''
  return { name: className, count: top.count, classId: top.class_id }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Collapsible Search -->
    <div class="card bg-base-200 shadow-sm">
      <button
        class="flex w-full items-center justify-between px-6 py-3 text-left"
        @click="searchOpen = !searchOpen"
      >
        <span class="text-sm font-medium text-base-content/70">Search Characters</span>
        <component :is="searchOpen ? ChevronUp : ChevronDown" class="h-4 w-4 text-base-content/50" />
      </button>
      <div v-show="searchOpen" class="px-6 pb-4">
        <LookupForm kind="character" @submit="onSubmit" />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="isError" class="alert alert-error">
      Failed to load character stats.
    </div>

    <!-- Dashboard content -->
    <template v-else-if="stats">
      <!-- Hero: Class Distribution Donut -->
      <StatsHeroCard :distribution="stats.class_distribution" :total="stats.total_characters" />

      <!-- Summary KPI Grid -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Total Characters"
          :value="stats.total_characters.toLocaleString()"
        />
        <StatMiniCard
          label="Faction Split"
          :value="`${stats.faction_distribution.horde}H / ${stats.faction_distribution.alliance}A`"
          :subtitle="`${((stats.faction_distribution.horde / stats.total_characters) * 100).toFixed(0)}% Horde`"
        />
        <StatMiniCard
          label="Avg Item Level"
          :value="avgIlvl"
        />
        <StatMiniCard
          label="Avg M+ Rating"
          :value="avgRating"
        />
        <StatMiniCard
          label="Top Race"
          :value="topRace.name"
          :subtitle="`${topRace.count} characters`"
        />
        <StatMiniCard
          label="Top Class"
          :value="topSpec.name"
          :subtitle="`${topSpec.count} characters (by spec)`"
          :accent-color="topSpec.classId ? CLASS_COLORS[topSpec.classId] : undefined"
        />
      </div>

      <!-- Performance by Class -->
      <PerformanceByClassCard :classes="stats.class_distribution" />

      <!-- Top Performers -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopPerformersCard
          title="Top M+ Rating"
          :entries="stats.top_performers.mythic_plus"
          value-label="Rating"
          :format-value="(v: number) => v.toFixed(1)"
        />
        <TopPerformersCard
          title="Top Item Level"
          :entries="stats.top_performers.item_level"
          value-label="iLvl"
          :format-value="(v: number) => v.toFixed(1)"
        />
        <TopPerformersCard
          title="Top Achievement Points"
          :entries="stats.top_performers.achievement_points"
          value-label="Points"
          :format-value="(v: number) => v.toLocaleString()"
        />
      </div>
    </template>
  </div>
</template>
