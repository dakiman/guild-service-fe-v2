<script setup lang="ts">
import { computed, toRef } from 'vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import MetaCompsList from '@/components/stats/MetaCompsList.vue'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'
import { isNotWarmedError, useMetaComps } from '@/composables/useMetaStats'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

const props = defineProps<{ period: MetaPeriodParam; region: MetaRegion }>()

const { data, isLoading, isError, error } = useMetaComps(
  toRef(props, 'period'),
  toRef(props, 'region'),
)

const notWarmed = computed(() => isNotWarmedError(error.value))
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-4">Top Comps</h3>

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
      <MetaCompsList :comps="data.comps" :pairings="data.pairings" />
      <CoverageStamp class="mt-3" variant="official" :timestamp="data.computed_at" />
    </template>
  </div>
</template>
