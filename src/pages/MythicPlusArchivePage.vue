<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useSeasonArchive } from '@/composables/useSeasonArchive'
import TopRunsTable from '@/components/stats/TopRunsTable.vue'
import HighestKeysList from '@/components/stats/HighestKeysList.vue'
import TopPerformersCard from '@/components/stats/TopPerformersCard.vue'
import PerformanceByClassCard from '@/components/stats/PerformanceByClassCard.vue'

const props = defineProps<{ slug: string }>()

const { data, isLoading, isError } = useSeasonArchive(toRef(props, 'slug'))

const PER_PAGE = 20
const page = ref(1)

const allRuns = computed(() => data.value?.top_runs ?? [])
const lastPage = computed(() => Math.max(1, Math.ceil(allRuns.value.length / PER_PAGE)))
const pageRuns = computed(() =>
  allRuns.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE),
)
const rankOffset = computed(() => (page.value - 1) * PER_PAGE)

const frozenAt = computed(() => {
  const iso = data.value?.meta.snapshotted_at
  return iso ? new Date(iso).toLocaleDateString() : null
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Frozen-season banner -->
    <div v-if="data" class="wsa-card !p-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-bold text-[#e0d0b0]">{{ data.meta.name }}</h2>
        <p class="text-xs text-[#aa8855]">
          Frozen at season end<span v-if="frozenAt"> — {{ frozenAt }}</span> ·
          {{ data.meta.total_runs.toLocaleString() }} runs recorded
        </p>
      </div>
      <RouterLink :to="{ name: 'mythic-plus' }" class="text-xs text-[#aa8855] hover:underline">
        ← Current season
      </RouterLink>
    </div>

    <div v-if="isLoading" class="flex justify-center py-6">
      <div class="wsa-spinner"></div>
    </div>
    <div v-else-if="isError" class="wsa-card !border-red-800/50 !p-4">
      <p class="text-sm text-[#ff4444]">No archive found for this season.</p>
    </div>

    <div v-else-if="data" class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_350px]">
      <!-- Frozen Top 100 (client-side pagination over the blob) -->
      <div class="wsa-card">
        <h3 class="wsa-text-heading text-[15px] mb-4">Top 100 M+ Runs</h3>
        <TopRunsTable :runs="pageRuns" :rank-offset="rankOffset" :dungeons="data.dungeons" />
        <div v-if="lastPage > 1" class="flex justify-center gap-2 mt-4">
          <button
            @click="page = Math.max(1, page - 1)"
            :disabled="page <= 1"
            class="text-xs px-3 py-1 rounded border border-[#5c4a32] text-[#aa8855] disabled:opacity-30"
          >
            Prev
          </button>
          <span class="text-xs text-[#665533] flex items-center">{{ page }} / {{ lastPage }}</span>
          <button
            @click="page = Math.min(lastPage, page + 1)"
            :disabled="page >= lastPage"
            class="text-xs px-3 py-1 rounded border border-[#5c4a32] text-[#aa8855] disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="wsa-card">
          <h3 class="wsa-text-heading text-[15px] mb-3">Highest Keys</h3>
          <HighestKeysList :dungeons="data.top_keys.dungeons" :game-data-dungeons="data.dungeons" />
        </div>
        <TopPerformersCard
          title="Top M+ Rating"
          :entries="data.top_performers.mythic_plus"
          value-label="Rating"
          :format-value="(v: number) => v.toFixed(1)"
        />
        <PerformanceByClassCard :classes="data.class_distribution" />
      </div>
    </div>
  </div>
</template>
