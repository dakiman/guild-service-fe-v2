<script setup lang="ts">
import { computed } from 'vue'
import { useTopKeys } from '@/composables/useCharacterStats'
import { useMythicDungeons } from '@/composables/usePveGameData'
import HighestKeysList from '@/components/stats/HighestKeysList.vue'

const { data, isLoading } = useTopKeys()
const { data: dungeonData } = useMythicDungeons()

const dungeons = computed(() => data.value?.dungeons ?? [])
const gameDataDungeons = computed(() => dungeonData.value?.dungeons ?? [])
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-3">Highest Keys</h3>

    <div v-if="isLoading" class="text-xs text-[#665533] py-2">Loading...</div>

    <HighestKeysList v-else-if="dungeons.length" :dungeons="dungeons" :game-data-dungeons="gameDataDungeons" />

    <div v-else class="text-xs text-[#665533] italic">No key data yet</div>
  </div>
</template>
