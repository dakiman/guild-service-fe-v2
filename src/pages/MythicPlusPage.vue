<script setup lang="ts">
import TopRunsLeaderboard from '@/components/stats/TopRunsLeaderboard.vue'
import HighestKeysCard from '@/components/stats/HighestKeysCard.vue'
import TopPerformersCard from '@/components/stats/TopPerformersCard.vue'
import { useCharacterStats } from '@/composables/useCharacterStats'

const { data: stats, isLoading, isError } = useCharacterStats()
</script>

<template>
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
      <TopPerformersCard
        v-else-if="stats"
        title="Top M+ Rating"
        :entries="stats.top_performers.mythic_plus"
        value-label="Rating"
        :format-value="(v: number) => v.toFixed(1)"
      />
    </div>
  </div>
</template>
