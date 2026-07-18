<script setup lang="ts">
import { computed } from 'vue'
import StatMiniCard from '@/components/stats/StatMiniCard.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import HighestKeysList from '@/components/stats/HighestKeysList.vue'
import { useGuildStats } from '@/composables/useGuildStats'
import { useMythicDungeons } from '@/composables/usePveGameData'

const props = defineProps<{
  region: string
  realm: string
  name: string
}>()

// Pass getters so route-param changes flow into the query (P1.7).
const { data, isLoading, isError } = useGuildStats(
  () => props.region,
  () => props.realm,
  () => props.name,
)

const { data: dungeonData } = useMythicDungeons()
const gameDataDungeons = computed(() => dungeonData.value?.dungeons ?? [])
</script>

<template>
  <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
    <div v-for="i in 6" :key="i" class="wsa-skeleton h-[88px]" />
  </div>

  <ErrorState v-else-if="isError" hide-retry title="Couldn't load guild stats" class="!p-3" />

  <template v-else-if="data">
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      <StatMiniCard
        label="Avg iLvl"
        :value="data.avg_item_level.toFixed(1)"
        tooltip="Max level characters with raid or M+ activity"
      />
      <StatMiniCard
        label="Avg M+ Rating"
        :value="data.avg_mythic_plus_rating.toFixed(0)"
        tooltip="Max level characters with raid or M+ activity"
      />
      <StatMiniCard
        v-if="data.top_mythic_plus"
        label="Top M+"
        :value="data.top_mythic_plus.rating.toFixed(0)"
        :subtitle="data.top_mythic_plus.character.name"
      />
      <StatMiniCard label="Tanks" :value="data.role_coverage.tank" />
      <StatMiniCard label="Healers" :value="data.role_coverage.healer" />
      <StatMiniCard label="DPS" :value="data.role_coverage.dps" />
    </div>

    <div v-if="data.best_keys.length" class="wsa-card mb-4">
      <h3 class="wsa-text-heading text-[15px] mb-3">Best Keys</h3>
      <HighestKeysList :dungeons="data.best_keys" :game-data-dungeons="gameDataDungeons" />
    </div>
  </template>
</template>
