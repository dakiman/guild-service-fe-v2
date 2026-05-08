<script setup lang="ts">
import { computed } from 'vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { CLASS_COLORS, STALE_DATA_DAYS } from '@/utils/wowConstants'
import { displayName } from '@/utils/display'
import { useTableSort } from '@/composables/useTableSort'
import type { Paginated, Region } from '@/types/api'
import type { GuildMember } from '@/types/guild'

const props = defineProps<{
  members: Paginated<GuildMember>
  page: number
  region: Region
}>()

const emit = defineEmits<{ pageChange: [page: number] }>()

const currentPage = computed(() => props.members.current_page)
const lastPage = computed(() => props.members.last_page)

// Flatten nested mythic_plus_rating onto a top-level sort key.
// Filter is applied server-side; rows arriving here are already filtered.
const sortableRows = computed(() =>
  props.members.data.map((m) => ({
    ...m,
    mythic_plus_score: m.mythic_plus_rating?.rating ?? null,
  })),
)

const { sortedRows, sortKey, sortDir, toggle } = useTableSort(sortableRows, 'rank')

const STALE_MS = STALE_DATA_DAYS * 24 * 60 * 60 * 1000
function isStaleSync(syncedAt: string | null): boolean {
  if (!syncedAt) return false
  return Date.now() - new Date(syncedAt).getTime() > STALE_MS
}

function classColor(classId: number): string | undefined {
  return CLASS_COLORS[classId]
}

type SortKey = keyof GuildMember | 'mythic_plus_score'

function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function sortGlyph(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

function goPrev() { if (currentPage.value > 1) emit('pageChange', currentPage.value - 1) }
function goNext() { if (currentPage.value < lastPage.value) emit('pageChange', currentPage.value + 1) }
function goTo(p: number) {
  if (p !== currentPage.value && p >= 1 && p <= lastPage.value) emit('pageChange', p)
}

const pageWindow = computed<number[]>(() => {
  const total = lastPage.value
  const cur = currentPage.value
  if (total <= 1) return [1]
  const radius = 2
  const start = Math.max(1, cur - radius)
  const end = Math.min(total, cur + radius)
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
})

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < lastPage.value)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-x-auto rounded-md border border-wsa-border/40">
      <table class="w-full text-xs roster-table">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-wsa-muted">
            <th
              role="columnheader"
              :aria-sort="ariaSort('name')"
              tabindex="0"
              class="text-left cursor-pointer select-none py-2 px-2 focus-visible:outline-2 focus-visible:outline-offset-1"
              @click="toggle('name')"
              @keydown.enter.prevent="toggle('name')"
              @keydown.space.prevent="toggle('name')"
            >
              Name<span class="text-wsa-disabled">{{ sortGlyph('name') }}</span>
            </th>
            <th class="w-8 text-center py-2 px-2">Class</th>
            <th class="w-8 text-center py-2 px-2 hidden sm:table-cell">Spec</th>
            <th class="w-8 text-center py-2 px-2">Race</th>
            <th class="w-8 text-center py-2 px-2 hidden sm:table-cell">Side</th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('level')"
              tabindex="0"
              class="text-right cursor-pointer select-none w-12 py-2 px-2 focus-visible:outline-2 focus-visible:outline-offset-1"
              @click="toggle('level')"
              @keydown.enter.prevent="toggle('level')"
              @keydown.space.prevent="toggle('level')"
            >
              Lvl<span class="text-wsa-disabled">{{ sortGlyph('level') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('equipped_item_level')"
              tabindex="0"
              class="text-right cursor-pointer select-none w-14 py-2 px-2 hidden sm:table-cell focus-visible:outline-2 focus-visible:outline-offset-1"
              @click="toggle('equipped_item_level')"
              @keydown.enter.prevent="toggle('equipped_item_level')"
              @keydown.space.prevent="toggle('equipped_item_level')"
            >
              iLvl<span class="text-wsa-disabled">{{ sortGlyph('equipped_item_level') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('mythic_plus_score')"
              tabindex="0"
              class="text-right cursor-pointer select-none w-16 py-2 px-2 hidden sm:table-cell focus-visible:outline-2 focus-visible:outline-offset-1"
              @click="toggle('mythic_plus_score')"
              @keydown.enter.prevent="toggle('mythic_plus_score')"
              @keydown.space.prevent="toggle('mythic_plus_score')"
            >
              M+<span class="text-wsa-disabled">{{ sortGlyph('mythic_plus_score') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('rank')"
              tabindex="0"
              class="text-right cursor-pointer select-none w-12 py-2 px-2 focus-visible:outline-2 focus-visible:outline-offset-1"
              @click="toggle('rank')"
              @keydown.enter.prevent="toggle('rank')"
              @keydown.space.prevent="toggle('rank')"
            >
              Rank<span class="text-wsa-disabled">{{ sortGlyph('rank') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedRows.length === 0">
            <td colspan="9" class="text-center text-wsa-disabled py-4">No members match your filter.</td>
          </tr>
          <tr v-for="m in sortedRows" :key="m.id" class="border-b border-wsa-border/20 hover:bg-black/20 transition-colors">
            <td class="font-medium py-1.5 px-2">
              <router-link
                :to="{
                  name: 'character-summary',
                  params: { region, realm: m.realm, name: m.name },
                }"
                :style="{ color: classColor(m.class_id) }"
                class="hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-1 rounded-sm"
              >
                {{ displayName(m.name, m.display_name) }}
              </router-link>
            </td>
            <td class="text-center py-1.5 px-2">
              <ClassIcon :class-id="m.class_id" :size="18" />
            </td>
            <td class="text-center py-1.5 px-2 hidden sm:table-cell">
              <SpecIcon
                v-if="m.active_specialization_id"
                :spec-id="m.active_specialization_id"
                :size="18"
              />
              <span v-else class="text-wsa-disabled">—</span>
            </td>
            <td class="text-center py-1.5 px-2">
              <RaceIcon :race-id="m.race_id" :size="18" />
            </td>
            <td class="text-center py-1.5 px-2 hidden sm:table-cell">
              <FactionBadge v-if="m.faction" :faction="m.faction" :size="14" />
            </td>
            <td class="text-right tabular-nums text-wsa-text py-1.5 px-2">{{ m.level }}</td>
            <td
              class="text-right tabular-nums text-wsa-text py-1.5 px-2 hidden sm:table-cell"
              :class="{ 'italic opacity-70': isStaleSync(m.synced_at) }"
            >
              <template v-if="m.equipped_item_level != null">{{ m.equipped_item_level }}</template>
              <span v-else class="text-wsa-disabled">—</span>
            </td>
            <td
              class="text-right tabular-nums py-1.5 px-2 hidden sm:table-cell"
              :class="{ 'italic opacity-70': isStaleSync(m.synced_at) }"
            >
              <span
                v-if="m.mythic_plus_rating"
                :style="{ color: m.mythic_plus_rating.color ?? undefined }"
              >
                {{ m.mythic_plus_rating.rating }}
              </span>
              <span v-else class="text-wsa-disabled">—</span>
            </td>
            <td class="text-right tabular-nums text-wsa-text py-1.5 px-2">{{ m.rank }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="flex items-center justify-between gap-2">
      <p class="text-xs text-wsa-disabled">
        Page {{ currentPage }} of {{ lastPage }} · {{ members.total }} members
      </p>
      <div class="flex justify-center gap-2">
        <button type="button" class="wsa-btn" :disabled="!hasPrev" @click="goPrev">Prev</button>
        <button
          v-for="p in pageWindow"
          :key="p"
          type="button"
          class="wsa-btn"
          :class="{ 'wsa-btn--primary': p === currentPage }"
          @click="goTo(p)"
        >
          {{ p }}
        </button>
        <button type="button" class="wsa-btn" :disabled="!hasNext" @click="goNext">Next</button>
      </div>
    </nav>
  </div>
</template>

