<script setup lang="ts">
import { computed, toRef } from 'vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import MetaDungeonTable from '@/components/stats/MetaDungeonTable.vue'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'
import { isNotWarmedError, useMetaDungeons } from '@/composables/useMetaStats'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

const props = defineProps<{ period: MetaPeriodParam; region: MetaRegion }>()

const { data, isLoading, isError, error } = useMetaDungeons(
  toRef(props, 'period'),
  toRef(props, 'region'),
)

const notWarmed = computed(() => isNotWarmedError(error.value))

const pick = computed(() =>
  data.value?.dungeons.find((d) => d.dungeon_id === data.value?.dungeon_of_the_week) ?? null,
)
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-4">Dungeon Report</h3>

    <div v-if="isLoading" class="wsa-skeleton h-64" />
    <div v-else-if="isError && notWarmed" class="text-xs text-wsa-disabled italic py-4 text-center">
      Dungeon report isn't warmed yet — check back after the next crawl.
    </div>
    <ErrorState
      v-else-if="isError"
      hide-retry
      title="Failed to load dungeon report"
      message="The dungeon report couldn't be loaded right now. Try again in a moment."
    />
    <template v-else-if="data">
      <div v-if="pick" class="wsa-card-inner mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="text-[10px] uppercase tracking-wide text-wsa-muted whitespace-nowrap">
          Dungeon of the Week
        </span>
        <span class="wsa-text-heading text-base whitespace-nowrap">{{ pick.name }}</span>
        <span class="text-xs text-wsa-muted">
          {{ Math.round(pick.timed_rate * 100) }}% timed over {{ pick.runs.toLocaleString() }} runs
        </span>
      </div>
      <MetaDungeonTable :dungeons="data.dungeons" :trends="data.trends" :highlight-id="data.dungeon_of_the_week" />
      <CoverageStamp class="mt-3" variant="official" :timestamp="data.computed_at" />
    </template>
  </div>
</template>
