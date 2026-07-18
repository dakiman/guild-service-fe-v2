<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getClassColor } from '@/utils/wowConstants'
import { capitalizeName } from '@/utils/display'
import { upgradeCount } from '@/utils/keystoneUpgrades'
import type { TopRun } from '@/types/stats'
import type { KeystoneUpgradeThreshold } from '@/types/gameData'

// Presentational core shared by the live leaderboard (server-paginated) and
// the season-archive page (client-paginated over a frozen 100-run blob).
const props = defineProps<{
  runs: TopRun[]
  rankOffset: number
  dungeons: Array<{
    id: number
    media_url: string | null
    keystone_upgrades: KeystoneUpgradeThreshold[] | null
  }>
}>()

const dungeonsById = computed(() => new Map(props.dungeons.map((d) => [d.id, d])))

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function dungeonIcon(run: TopRun): string | null {
  return dungeonsById.value.get(run.dungeon_id)?.media_url ?? null
}

function stars(run: TopRun): string {
  const dungeon = dungeonsById.value.get(run.dungeon_id)
  return '✦'.repeat(upgradeCount(run.duration, dungeon?.keystone_upgrades))
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-xs min-w-[560px]">
      <thead>
        <tr class="text-wsa-muted text-left">
          <th class="py-1.5 w-8">#</th>
          <th class="py-1.5">Dungeon</th>
          <th class="py-1.5 w-12 text-center">Key</th>
          <th class="py-1.5 w-14 text-right">Time</th>
          <th class="py-1.5 pl-3">Team</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(run, index) in runs"
          :key="run.id"
          class="border-b border-wsa-border/20"
        >
          <td
            class="py-2 font-bold tabular-nums"
            :class="rankOffset + index + 1 < 3 ? 'text-wsa-muted' : 'text-wsa-disabled'"
          >
            {{ rankOffset + index + 1 }}
          </td>
          <td class="py-2 text-wsa-text">
            <div class="flex items-center gap-1.5 max-w-[160px]">
              <img
                v-if="dungeonIcon(run)"
                :src="dungeonIcon(run)!"
                :alt="run.dungeon_name"
                class="w-5 h-5 rounded shrink-0"
                loading="lazy"
              />
              <span class="truncate">{{ run.dungeon_name }}</span>
            </div>
          </td>
          <td class="py-2 text-center font-bold text-wsa-gold whitespace-nowrap">
            +{{ run.keystone_level
            }}<span v-if="stars(run)" class="text-[9px] align-super text-wsa-gold">{{
              stars(run)
            }}</span>
          </td>
          <td class="py-2 text-right tabular-nums text-wsa-text">
            {{ formatDuration(run.duration) }}
          </td>
          <td class="py-2 pl-3">
            <div class="flex flex-wrap gap-x-2 gap-y-0.5">
              <RouterLink
                v-for="member in run.members"
                :key="`${member.region}-${member.realm}-${member.name}`"
                :to="{
                  name: 'character-detail',
                  params: {
                    region: member.region,
                    realm: member.realm,
                    name: member.name,
                  },
                }"
                class="hover:underline truncate max-w-[80px]"
                :style="{ color: getClassColor(member.class_id ?? 0) ?? 'rgb(var(--wsa-text))' }"
              >
                {{ capitalizeName(member.name) }}
              </RouterLink>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
