<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TopRunsLeaderboard from '@/components/stats/TopRunsLeaderboard.vue'
import HighestKeysCard from '@/components/stats/HighestKeysCard.vue'
import TopPerformersCard from '@/components/stats/TopPerformersCard.vue'
import PerformanceByClassCard from '@/components/stats/PerformanceByClassCard.vue'
import { useCharacterStats } from '@/composables/useCharacterStats'
import { useSeasons } from '@/composables/usePveGameData'

const router = useRouter()
const { data: stats, isLoading, isError } = useCharacterStats()
const { data: seasonData } = useSeasons()

const currentSeason = computed(
  () => seasonData.value?.seasons.find((s) => s.is_current) ?? null,
)
const archivedSeasons = computed(
  () => (seasonData.value?.seasons ?? []).filter((s) => s.has_archive && !s.is_current),
)

function openArchive(event: Event) {
  const slug = (event.target as HTMLSelectElement).value
  if (slug) router.push({ name: 'mythic-plus-archive', params: { slug } })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Season header: only rendered once the registry answers -->
    <div
      v-if="currentSeason || archivedSeasons.length"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <h2 v-if="currentSeason" class="text-sm font-semibold text-wsa-muted">
        {{ currentSeason.name }}
      </h2>
      <select
        v-if="archivedSeasons.length"
        class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
        aria-label="Past seasons"
        @change="openArchive"
      >
        <option value="">Past seasons…</option>
        <option v-for="s in archivedSeasons" :key="s.slug" :value="s.slug">{{ s.name }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_350px]">
      <TopRunsLeaderboard />
      <div class="flex flex-col gap-4">
        <HighestKeysCard />
        <div v-if="isLoading" class="flex justify-center py-6">
          <div class="wsa-spinner"></div>
        </div>
        <div v-else-if="isError" class="wsa-card !border-red-800/50 !p-4">
          <p class="text-sm text-[#ff4444]">Failed to load character stats.</p>
        </div>
        <template v-else-if="stats">
          <TopPerformersCard
            title="Top M+ Rating"
            :entries="stats.top_performers.mythic_plus"
            value-label="Rating"
            :format-value="(v: number) => v.toFixed(1)"
          />
          <PerformanceByClassCard :classes="stats.class_distribution" />
        </template>
      </div>
    </div>
  </div>
</template>
