<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getClassColor } from '@/utils/wowConstants'
import { capitalizeName } from '@/utils/display'
import { upgradeCount } from '@/utils/keystoneUpgrades'
import type { TopKeyDungeon } from '@/types/stats'
import type { KeystoneUpgradeThreshold } from '@/types/gameData'

// Presentational core shared by the live Highest Keys card and the
// season-archive page.
const props = defineProps<{
  dungeons: Array<{
    dungeon_id: number
    dungeon_name: string
    key_level: number
    duration?: number
    character?: TopKeyDungeon['character']
  }>
  gameDataDungeons: Array<{
    id: number
    media_url: string | null
    keystone_upgrades: KeystoneUpgradeThreshold[] | null
  }>
}>()

const sortedDungeons = computed(() => [...props.dungeons].sort((a, b) => b.key_level - a.key_level))

const dungeonsById = computed(() => new Map(props.gameDataDungeons.map((gd) => [gd.id, gd])))

function dungeonIcon(d: { dungeon_id: number }): string | null {
  return dungeonsById.value.get(d.dungeon_id)?.media_url ?? null
}

function stars(d: { dungeon_id: number; duration?: number }): string {
  if (d.duration == null) return ''
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
      <span class="text-xs text-wsa-text truncate flex-1">{{ d.dungeon_name }}</span>
      <span class="text-sm font-bold text-wsa-gold mx-2 whitespace-nowrap">+{{ d.key_level
      }}<span v-if="stars(d)" class="text-[9px] align-super text-wsa-gold">{{ stars(d) }}</span></span>
      <RouterLink v-if="d.character"
        :to="{ name: 'character-detail', params: { region: d.character.region, realm: d.character.realm, name: d.character.name } }"
        class="text-xs font-semibold truncate max-w-[100px] hover:underline"
        :style="{ color: getClassColor(d.character.class_id ?? 0) ?? 'rgb(var(--wsa-text))' }">
        {{ capitalizeName(d.character.name) }}
      </RouterLink>
    </div>
  </div>
</template>
