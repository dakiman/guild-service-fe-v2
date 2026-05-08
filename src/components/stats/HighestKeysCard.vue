<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTopKeys } from '@/composables/useCharacterStats'
import { getClassColor } from '@/utils/wowConstants'

const { data, isLoading } = useTopKeys()

const sortedDungeons = computed(() =>
  [...(data.value?.dungeons ?? [])].sort((a, b) => b.key_level - a.key_level)
)

function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}
</script>

<template>
  <div class="stats-card">
    <h3 class="stats-card-title mb-3">Highest Keys</h3>

    <div v-if="isLoading" class="text-xs text-[#665533] py-2">Loading...</div>

    <div v-else-if="sortedDungeons.length" class="flex flex-col gap-2">
      <div v-for="d in sortedDungeons" :key="d.dungeon_id"
        class="flex items-center justify-between">
        <span class="text-xs text-[#e0d0b0] truncate flex-1">{{ d.dungeon_name }}</span>
        <span class="text-sm font-bold text-[#ffcc88] mx-2">+{{ d.key_level }}</span>
        <RouterLink v-if="d.character"
          :to="{ name: 'character-detail', params: { region: d.character.region, realm: d.character.realm, name: d.character.name } }"
          class="text-xs font-semibold truncate max-w-[100px] hover:underline"
          :style="{ color: getClassColor(d.character.class_id ?? 0) ?? '#e0d0b0' }">
          {{ displayName(d.character.name) }}
        </RouterLink>
      </div>
    </div>

    <div v-else class="text-xs text-[#665533] italic">No key data yet</div>
  </div>
</template>
