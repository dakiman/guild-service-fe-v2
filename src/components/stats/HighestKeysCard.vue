<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStats, useTopKeys } from '@/composables/useCharacterStats'
import { useMythicDungeons } from '@/composables/usePveGameData'
import HighestKeysList from '@/components/stats/HighestKeysList.vue'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'

const { data, isLoading, isError, error, refetch } = useTopKeys()
const { data: dungeonData } = useMythicDungeons()
const { data: siteStats } = useCharacterStats()

const dungeons = computed(() => data.value?.dungeons ?? [])
const gameDataDungeons = computed(() => dungeonData.value?.dungeons ?? [])
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-3">Highest Keys</h3>

    <div v-if="isLoading" class="flex flex-col gap-2 py-1">
      <div v-for="i in 8" :key="i" class="wsa-skeleton h-5" />
    </div>

    <ErrorState v-else-if="isError" compact title="Couldn't load highest keys" :error="error" @retry="refetch()" />

    <HighestKeysList v-else-if="dungeons.length" :dungeons="dungeons" :game-data-dungeons="gameDataDungeons" />

    <div v-else class="text-xs text-wsa-disabled italic">No key data yet</div>

    <CoverageStamp
      class="mt-3"
      variant="crawled"
      :timestamp="siteStats?.generated_at"
      :count="siteStats?.total_characters"
    />
  </div>
</template>
