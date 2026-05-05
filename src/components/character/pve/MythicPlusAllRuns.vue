<template>
  <div>
    <div v-if="isSyncingSlice && seasonRuns.length === 0" class="ma-card p-6 text-sm text-ma-muted/70 flex items-center gap-2">
      <span class="loading loading-spinner loading-xs" />
      Syncing dungeon data…
    </div>
    <div v-else-if="seasonRuns.length === 0" class="ma-card p-6 text-sm text-ma-muted/70">
      No mythic+ runs recorded this season.
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <button
        v-for="run in sortedRuns"
        :key="run.id"
        type="button"
        class="ma-card p-3 text-left transition-colors hover:border-ma-border/60 hover:bg-ma-card/80 flex flex-col gap-2"
        @click="openRun(run)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <img
            v-if="dungeonIcons[run.dungeon_id]"
            :src="dungeonIcons[run.dungeon_id]"
            :alt="run.dungeon_name"
            class="w-5 h-5 rounded shrink-0"
            loading="lazy"
          />
          <span class="font-semibold text-sm text-ma-text truncate">{{ run.dungeon_name }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="font-bold" :class="run.is_completed_on_time ? 'text-ma-gold' : 'text-ma-muted/70'">
            +{{ run.keystone_level }}
          </span>
          <span
            class="px-1.5 py-0.5 rounded border text-[10px]"
            :class="run.is_completed_on_time
              ? 'border-emerald-400/40 text-emerald-300'
              : 'border-red-400/40 text-red-300'"
          >
            {{ run.is_completed_on_time ? 'On time' : 'Over time' }}
          </span>
          <span class="text-ma-muted/70 tabular-nums ml-auto">{{ formatDuration(run.duration) }}</span>
        </div>
        <div class="flex items-center gap-0.5 overflow-hidden">
          <span
            v-for="(member, idx) in run.members"
            :key="`pill:${run.id}:${idx}`"
            class="inline-flex items-center gap-px px-0.5 rounded-full border border-ma-border/30 bg-ma-card/40 text-[9px] leading-tight text-ma-muted/80"
            :title="`${displayName(member.character_name)} • ${formatRealm(member.character_realm, member.character_realm_display)}`"
          >
            <SpecIcon
              :spec-id="member.spec_id"
              :fallback-class-id="member.spec_id != null ? SPEC_TO_CLASS[member.spec_id] ?? null : null"
              :size="10"
            />
            <span class="tabular-nums">{{ member.equipped_item_level }}</span>
          </span>
        </div>
      </button>
    </div>

    <dialog
      ref="dialogRef"
      class="backdrop:bg-black/60 bg-transparent p-0 m-auto max-w-lg w-full"
      @click="onBackdropClick"
    >
      <div v-if="selectedRun" class="ma-card p-5 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <img
            v-if="dungeonIcons[selectedRun.dungeon_id]"
            :src="dungeonIcons[selectedRun.dungeon_id]"
            :alt="selectedRun.dungeon_name"
            class="w-7 h-7 rounded shrink-0"
          />
          <span class="font-semibold text-lg text-ma-text flex-1">{{ selectedRun.dungeon_name }}</span>
          <button
            type="button"
            class="text-ma-muted/70 hover:text-ma-text transition-colors p-1"
            aria-label="Close"
            @click="closeDialog"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex items-center gap-3 text-sm">
          <span class="font-bold" :class="selectedRun.is_completed_on_time ? 'text-ma-gold' : 'text-ma-muted/70'">
            +{{ selectedRun.keystone_level }}
          </span>
          <span
            class="px-2 py-0.5 rounded border text-xs"
            :class="selectedRun.is_completed_on_time
              ? 'border-emerald-400/40 text-emerald-300'
              : 'border-red-400/40 text-red-300'"
          >
            {{ selectedRun.is_completed_on_time ? 'On time' : 'Over time' }}
          </span>
          <span class="text-ma-muted/70 tabular-nums">{{ formatDuration(selectedRun.duration) }}</span>
          <span class="text-ma-muted/50 tabular-nums text-xs ml-auto">{{ formatTimestamp(selectedRun.completed_timestamp) }}</span>
        </div>

        <div v-if="selectedRun.affixes.length" class="flex flex-wrap gap-1">
          <AffixIcon
            v-for="affix in selectedRun.affixes"
            :key="affix.id"
            :affix-id="affix.id"
          />
        </div>

        <div v-if="selectedRun.members.length" class="overflow-x-auto">
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
                v-for="(member, idx) in selectedRun.members"
                :key="`${member.character_region}:${member.character_realm}:${member.character_name}:${idx}`"
                class="border-t border-ma-border/15"
              >
                <td class="px-2 py-1">
                  <RouterLink
                    :to="memberRoute(member)"
                    class="font-semibold hover:underline transition-colors"
                    :style="{ color: memberColor(member) }"
                    @click="closeDialog"
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
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { X } from 'lucide-vue-next'
import AffixIcon from './AffixIcon.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import type { DungeonRun, DungeonRunMember } from '@/types/character'
import type { MythicKeystoneDungeonGameData } from '@/types/gameData'
import { CLASS_COLORS, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { displayName } from '@/utils/display'
import { useWowheadRefresh } from '@/composables/useWowhead'
import { useCharacterContext } from '@/composables/useCharacterContext'

const props = defineProps<{
  runs: DungeonRun[]
  dungeons: MythicKeystoneDungeonGameData[]
  currentSeason: number | null
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const selectedRun = ref<DungeonRun | null>(null)

const { freshness } = useCharacterContext()
const isSyncingSlice = computed(() => freshness.value.mythic_plus === 'never_synced')

function openRun(run: DungeonRun): void {
  selectedRun.value = run
  dialogRef.value?.showModal()
}

function closeDialog(): void {
  dialogRef.value?.close()
  selectedRun.value = null
}

function onBackdropClick(e: MouseEvent): void {
  if (e.target === dialogRef.value) closeDialog()
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

const dungeonIcons = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {}
  for (const d of props.dungeons) {
    if (d.media_url) map[d.id] = d.media_url
  }
  return map
})

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const sortedRuns = computed<DungeonRun[]>(() =>
  [...seasonRuns.value].sort((a, b) => b.completed_timestamp - a.completed_timestamp),
)

useWowheadRefresh(sortedRuns)

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
