<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getClassColor } from '@/utils/wowConstants'
import { upgradeCount } from '@/utils/keystoneUpgrades'
import type { TopKeyDungeon } from '@/types/stats'
import type { KeystoneUpgradeThreshold } from '@/types/gameData'

// Presentational core shared by the live Highest Keys card and the
// season-archive page.
const props = defineProps<{
  dungeons: TopKeyDungeon[]
  gameDataDungeons: Array<{
    id: number
    media_url: string | null
    keystone_upgrades: KeystoneUpgradeThreshold[] | null
  }>
}>()

const sortedDungeons = computed(() => [...props.dungeons].sort((a, b) => b.key_level - a.key_level))

const dungeonsById = computed(() => new Map(props.gameDataDungeons.map((gd) => [gd.id, gd])))

function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function dungeonIcon(d: TopKeyDungeon): string | null {
  return dungeonsById.value.get(d.dungeon_id)?.media_url ?? null
}

function stars(d: TopKeyDungeon): string {
  const dungeon = dungeonsById.value.get(d.dungeon_id)
  return '✦'.repeat(upgradeCount(d.duration, dungeon?.keystone_upgrades))
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="d in sortedDungeons" :key="d.dungeon_id"
      class="flex items-center justify-between gap-1.5">
      <img
        v-if="dungeonIcon(d)"
        :src="dungeonIcon(d)!"
        :alt="d.dungeon_name"
        class="w-5 h-5 rounded shrink-0"
        loading="lazy"
      />
      <span class="text-xs text-[#e0d0b0] truncate flex-1">{{ d.dungeon_name }}</span>
      <span class="text-sm font-bold text-[#ffcc88] mx-2 whitespace-nowrap">+{{ d.key_level
      }}<span v-if="stars(d)" class="text-[9px] align-super text-[#ffe0aa]">{{ stars(d) }}</span></span>
      <RouterLink v-if="d.character"
        :to="{ name: 'character-detail', params: { region: d.character.region, realm: d.character.realm, name: d.character.name } }"
        class="text-xs font-semibold truncate max-w-[100px] hover:underline"
        :style="{ color: getClassColor(d.character.class_id ?? 0) ?? '#e0d0b0' }">
        {{ displayName(d.character.name) }}
      </RouterLink>
    </div>
  </div>
</template>
