<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTopRuns } from '@/composables/useCharacterStats'
import { useMythicDungeons } from '@/composables/usePveGameData'
import TopRunsTable from '@/components/stats/TopRunsTable.vue'

const page = ref(1)
const { data, isLoading } = useTopRuns(page, 20)
const { data: dungeonData } = useMythicDungeons()

const runs = computed(() => data.value?.data ?? [])
const lastPage = computed(() => data.value?.last_page ?? 1)
const dungeons = computed(() => dungeonData.value?.dungeons ?? [])
const rankOffset = computed(() => (page.value - 1) * 20)
</script>

<template>
  <div class="stats-card">
    <h3 class="stats-card-title mb-4">Top 100 M+ Runs</h3>

    <div v-if="isLoading" class="text-xs text-[#665533] py-4 text-center">Loading...</div>

    <div v-else-if="runs.length">
      <TopRunsTable :runs="runs" :rank-offset="rankOffset" :dungeons="dungeons" />

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

    <div v-else class="text-xs text-[#665533] italic py-4 text-center">No run data yet</div>
  </div>
</template>
