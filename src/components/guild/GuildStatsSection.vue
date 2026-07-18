<script setup lang="ts">
import StatMiniCard from '@/components/stats/StatMiniCard.vue'
import { useGuildStats } from '@/composables/useGuildStats'

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
</script>

<template>
  <div v-if="isLoading" class="text-xs text-wsa-disabled py-2">Loading stats...</div>

  <div v-else-if="isError" class="text-xs text-[#ff6b6b] py-2">Couldn't load guild stats.</div>

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
      <div class="flex flex-col gap-1.5">
        <div v-for="k in data.best_keys" :key="k.dungeon_id" class="flex items-center justify-between">
          <span class="text-xs text-wsa-text truncate">{{ k.dungeon_name }}</span>
          <span class="text-sm font-bold text-wsa-gold">+{{ k.key_level }}</span>
        </div>
      </div>
    </div>
  </template>
</template>
