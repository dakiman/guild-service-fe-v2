<template>
  <div class="flex flex-col gap-3">
    <div v-if="seasonRuns.length === 0" class="ma-card p-6 text-sm text-ma-muted/70">
      No mythic+ runs recorded this season.
    </div>
    <div v-for="run in sortedRuns" :key="run.id" class="ma-card p-4">
      <button
        type="button"
        class="flex flex-wrap items-center gap-3 w-full text-left"
        :aria-expanded="isOpen(run)"
        :aria-controls="runBodyId(run)"
        @click="toggle(run)"
      >
        <ChevronRight
          aria-hidden="true"
          class="w-4 h-4 shrink-0 text-ma-muted/70 transition-transform duration-150"
          :class="{ 'rotate-90': isOpen(run) }"
        />
        <span class="font-semibold flex-1 text-ma-text">{{ run.dungeon_name }}</span>
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
        <span class="flex flex-wrap items-center gap-1">
          <span
            v-for="(member, idx) in run.members"
            :key="`pill:${run.id}:${idx}`"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-ma-border/30 bg-ma-card/40 text-[11px] text-ma-muted/80"
            :title="`${displayName(member.character_name)} • ${formatRealm(member.character_realm, member.character_realm_display)}`"
          >
            <SpecIcon
              :spec-id="member.spec_id"
              :fallback-class-id="member.spec_id != null ? SPEC_TO_CLASS[member.spec_id] ?? null : null"
              :size="14"
            />
            <span class="tabular-nums">{{ member.equipped_item_level }}</span>
          </span>
        </span>
      </button>

      <div :id="runBodyId(run)" v-show="isOpen(run)" class="mt-3">
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
                    class="font-semibold hover:underline transition-colors"
                    :style="{ color: memberColor(member) }"
                  >
                    {{ displayName(member.character_name) }}
                  </RouterLink>
                </td>
                <td class="px-2 py-1 text-ma-muted/70">{{ formatRealm(member.character_realm, member.character_realm_display) }}</td>
                <td class="px-2 py-1 text-ma-muted/70">
                  <span class="inline-flex items-center gap-1.5">
                    <SpecIcon
                      :spec-id="member.spec_id"
                      :fallback-class-id="member.spec_id != null ? SPEC_TO_CLASS[member.spec_id] ?? null : null"
                      :size="18"
                    />
                    <span>{{ member.spec_name }}</span>
                  </span>
                </td>
                <td class="px-2 py-1 text-right tabular-nums">{{ member.equipped_item_level }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-xs text-ma-muted/60 italic m-0">No member data recorded.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import AffixIcon from './AffixIcon.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import type { DungeonRun, DungeonRunMember } from '@/types/character'
import type { KeystoneAffixGameData } from '@/types/gameData'
import { CLASS_COLORS, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { displayName } from '@/utils/display'

const props = defineProps<{
  runs: DungeonRun[]
  affixes: Record<number, KeystoneAffixGameData> | undefined | null
  currentSeason: number | null
}>()

const expanded = ref<Set<number>>(new Set())

function isOpen(run: DungeonRun): boolean {
  return expanded.value.has(run.id)
}

function toggle(run: DungeonRun): void {
  const next = new Set(expanded.value)
  if (next.has(run.id)) next.delete(run.id)
  else next.add(run.id)
  expanded.value = next
}

function runBodyId(run: DungeonRun): string {
  return `mplus-run-body-${run.id}`
}

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

function memberColor(member: DungeonRunMember): string | undefined {
  if (member.spec_id == null) return undefined
  const classId = SPEC_TO_CLASS[member.spec_id]
  return classId != null ? CLASS_COLORS[classId] : undefined
}

function formatRealm(slug: string, raw?: string | null): string {
  if (raw && raw.length > 0) return raw
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
