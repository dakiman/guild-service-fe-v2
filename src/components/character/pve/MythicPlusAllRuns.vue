<template>
  <div class="flex flex-col gap-3">
    <div v-if="seasonRuns.length === 0" class="ma-card p-6 text-sm text-ma-muted/70">
      No mythic+ runs recorded this season.
    </div>
    <div v-for="run in sortedRuns" :key="run.id" class="ma-card p-4">
      <div class="flex flex-wrap items-center gap-3 mb-3">
        <h3 class="font-semibold flex-1 text-ma-text">{{ run.dungeon_name }}</h3>
        <span class="ma-stat-pill !py-1 !px-2 text-sm font-bold">
          <span class="text-ma-gold">+{{ run.keystone_level }}</span>
        </span>
        <span
          class="text-xs px-2 py-0.5 rounded border"
          :class="run.is_completed_on_time
            ? 'border-emerald-400/40 text-emerald-300'
            : 'border-red-400/40 text-red-300'"
        >
          {{ run.is_completed_on_time ? 'On time' : 'Over time' }}
        </span>
        <span class="text-sm text-ma-muted/70 tabular-nums">{{ formatDuration(run.duration) }}</span>
        <span class="text-xs text-ma-muted/50 tabular-nums">{{ formatTimestamp(run.completed_timestamp) }}</span>
      </div>

      <div v-if="run.affixes.length" class="flex flex-wrap gap-1 mb-3">
        <AffixIcon
          v-for="affix in run.affixes"
          :key="affix.id"
          :affix-id="affix.id"
          :affixes="affixes"
        />
      </div>

      <div v-if="run.members.length" class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[10px] uppercase tracking-wider text-ma-muted/70">
              <th class="text-left px-2 py-1 font-medium">Name</th>
              <th class="text-left px-2 py-1 font-medium">Realm</th>
              <th class="text-left px-2 py-1 font-medium">Spec</th>
              <th class="text-right px-2 py-1 font-medium">iLvl</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(member, idx) in run.members"
              :key="`${member.character_region}:${member.character_realm}:${member.character_name}:${idx}`"
              class="border-t border-ma-border/15"
            >
              <td class="px-2 py-1">
                <RouterLink
                  :to="memberRoute(member)"
                  class="text-ma-text hover:text-ma-gold transition-colors"
                >
                  {{ member.character_name }}
                </RouterLink>
              </td>
              <td class="px-2 py-1 text-ma-muted/70">{{ formatRealm(member.character_realm) }}</td>
              <td class="px-2 py-1 text-ma-muted/70">{{ member.spec_name }}</td>
              <td class="px-2 py-1 text-right tabular-nums">{{ member.equipped_item_level }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AffixIcon from './AffixIcon.vue'
import type { DungeonRun, DungeonRunMember } from '@/types/character'
import type { KeystoneAffixGameData } from '@/types/gameData'

const props = defineProps<{
  runs: DungeonRun[]
  affixes: Record<number, KeystoneAffixGameData> | undefined | null
  currentSeason: number | null
}>()

function memberRoute(member: DungeonRunMember) {
  return {
    name: 'character-detail',
    params: {
      region: member.character_region,
      realm: member.character_realm,
      name: member.character_name.toLowerCase(),
    },
  }
}

function formatRealm(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const sortedRuns = computed<DungeonRun[]>(() =>
  [...seasonRuns.value].sort((a, b) => b.completed_timestamp - a.completed_timestamp),
)

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTimestamp(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
