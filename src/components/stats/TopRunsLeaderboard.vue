<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTopRuns } from '@/composables/useCharacterStats'
import { useMythicDungeons } from '@/composables/usePveGameData'
import TopRunsTable from '@/components/stats/TopRunsTable.vue'
import PaginationControls from '@/components/ui/PaginationControls.vue'

const page = ref(1)
const { data, isLoading } = useTopRuns(page, 20)
const { data: dungeonData } = useMythicDungeons()

const runs = computed(() => data.value?.data ?? [])
const lastPage = computed(() => data.value?.last_page ?? 1)
const dungeons = computed(() => dungeonData.value?.dungeons ?? [])
const rankOffset = computed(() => (page.value - 1) * 20)
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-4">Top 100 M+ Runs</h3>

    <div v-if="isLoading" class="flex flex-col gap-2">
      <div v-for="i in 10" :key="i" class="wsa-skeleton h-8" />
    </div>

    <div v-else-if="runs.length">
      <TopRunsTable :runs="runs" :rank-offset="rankOffset" :dungeons="dungeons" />

      <PaginationControls
        v-if="lastPage > 1"
        class="mt-4"
        :page="page"
        :last-page="lastPage"
        @update:page="page = $event"
      />
    </div>

    <div v-else class="text-xs text-wsa-disabled italic py-4 text-center">No run data yet</div>
  </div>
</template>
