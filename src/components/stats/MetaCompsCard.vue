<script setup lang="ts">
import { computed, toRef } from 'vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import MetaCompsList from '@/components/stats/MetaCompsList.vue'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'
import { isNotWarmedError, useMetaComps } from '@/composables/useMetaStats'
import { SPEC_FILTER_GROUPS } from '@/utils/specLabels'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

const props = withDefaults(
  defineProps<{
    period: MetaPeriodParam
    region: MetaRegion
    /** Active spec filter (v-model:spec-filter from MetaPage). */
    specFilter?: number | null
  }>(),
  { specFilter: null },
)

const emit = defineEmits<{ 'update:specFilter': [specId: number | null] }>()

const { data, isLoading, isError, error } = useMetaComps(
  toRef(props, 'period'),
  toRef(props, 'region'),
)

const notWarmed = computed(() => isNotWarmedError(error.value))

// <select> values are strings; '' is the "All specs" sentinel.
const selectValue = computed(() => (props.specFilter === null ? '' : String(props.specFilter)))

function onFilterChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  emit('update:specFilter', value === '' ? null : Number(value))
}
</script>

<template>
  <div class="wsa-card">
    <div class="flex items-center justify-between gap-2 mb-4">
      <h3 class="wsa-text-heading text-[15px]">Top Comps</h3>
      <select
        class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted max-w-[14rem]"
        aria-label="Filter by spec"
        :value="selectValue"
        @change="onFilterChange"
      >
        <option value="">All specs</option>
        <optgroup v-for="group in SPEC_FILTER_GROUPS" :key="group.role" :label="group.label">
          <option v-for="opt in group.options" :key="opt.specId" :value="String(opt.specId)">
            {{ opt.label }}
          </option>
        </optgroup>
      </select>
    </div>

    <div v-if="isLoading" class="wsa-skeleton h-64" />
    <div v-else-if="isError && notWarmed" class="text-xs text-wsa-disabled italic py-4 text-center">
      Comp data isn't warmed yet — check back after the next crawl.
    </div>
    <ErrorState
      v-else-if="isError"
      hide-retry
      title="Failed to load comps"
      message="Comp data couldn't be loaded right now. Try again in a moment."
    />
    <template v-else-if="data">
      <MetaCompsList :comps="data.comps" :pairings="data.pairings" :spec-filter="specFilter" />
      <CoverageStamp class="mt-3" variant="official" :timestamp="data.computed_at" />
    </template>
  </div>
</template>
