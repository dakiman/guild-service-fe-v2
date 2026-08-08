<script setup lang="ts">
import { toRef } from 'vue'
import MetaCompsList from '@/components/stats/MetaCompsList.vue'
import { useMetaComps } from '@/composables/useMetaStats'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

const props = defineProps<{ period: MetaPeriodParam; region: MetaRegion }>()

const { data, isLoading, isError } = useMetaComps(toRef(props, 'period'), toRef(props, 'region'))
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-4">Top Comps</h3>

    <div v-if="isLoading" class="wsa-skeleton h-64" />
    <div v-else-if="isError" class="text-xs text-wsa-disabled italic py-4 text-center">
      Comp data isn't warmed yet — check back after the next crawl.
    </div>
    <MetaCompsList v-else-if="data" :comps="data.comps" :pairings="data.pairings" />
  </div>
</template>
