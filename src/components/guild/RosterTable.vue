<script setup lang="ts">
import { computed } from 'vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { CLASS_COLORS, STALE_DATA_DAYS } from '@/utils/wowConstants'
import { displayName } from '@/utils/display'
import { useTableSort } from '@/composables/useTableSort'
import type { Paginated } from '@/types/api'
import type { GuildMember } from '@/types/guild'

const props = defineProps<{
  members: Paginated<GuildMember>
  page: number
  filterText?: string
}>()

const emit = defineEmits<{ pageChange: [page: number] }>()

const currentPage = computed(() => props.members.current_page)
const lastPage = computed(() => props.members.last_page)

const filteredRows = computed(() => {
  const rows = props.members.data
  const q = (props.filterText ?? '').trim().toLowerCase()
  if (!q) return rows
  return rows.filter((m) => m.name.toLowerCase().includes(q))
})

// Flatten nested mythic_plus_rating onto a top-level sort key.
const sortableRows = computed(() =>
  filteredRows.value.map((m) => ({
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
    <div class="overflow-x-auto rounded-md border border-base-300">
      <table class="table table-zebra table-xs roster-table">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-base-content/70">
            <th
              role="columnheader"
              :aria-sort="ariaSort('name')"
              class="cursor-pointer select-none"
              @click="toggle('name')"
            >
              Name<span class="text-base-content/50">{{ sortGlyph('name') }}</span>
            </th>
            <th class="w-8 text-center">Cls</th>
            <th class="w-8 text-center hidden sm:table-cell">Spec</th>
            <th class="w-8 text-center">Race</th>
            <th class="w-8 text-center hidden sm:table-cell">Side</th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('level')"
              class="text-right cursor-pointer select-none w-12"
              @click="toggle('level')"
            >
              Lvl<span class="text-base-content/50">{{ sortGlyph('level') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('equipped_item_level')"
              class="text-right cursor-pointer select-none w-14 hidden sm:table-cell"
              @click="toggle('equipped_item_level')"
            >
              iLvl<span class="text-base-content/50">{{ sortGlyph('equipped_item_level') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('mythic_plus_score')"
              class="text-right cursor-pointer select-none w-16 hidden sm:table-cell"
              @click="toggle('mythic_plus_score')"
            >
              M+<span class="text-base-content/50">{{ sortGlyph('mythic_plus_score') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('rank')"
              class="text-right cursor-pointer select-none w-12"
              @click="toggle('rank')"
            >
              Rank<span class="text-base-content/50">{{ sortGlyph('rank') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedRows.length === 0">
            <td colspan="9" class="text-center text-base-content/60">No members match your filter.</td>
          </tr>
          <tr v-for="m in sortedRows" :key="m.id">
            <td class="font-medium" :style="{ color: classColor(m.class_id) }">
              {{ displayName(m.name, m.display_name) }}
            </td>
            <td class="text-center">
              <ClassIcon :class-id="m.class_id" :size="18" />
            </td>
            <td class="text-center hidden sm:table-cell">
              <SpecIcon
                v-if="m.active_specialization_id"
                :spec-id="m.active_specialization_id"
                :size="18"
              />
              <span v-else class="text-base-content/40">—</span>
            </td>
            <td class="text-center">
              <RaceIcon :race-id="m.race_id" :size="18" />
            </td>
            <td class="text-center hidden sm:table-cell">
              <FactionBadge v-if="m.faction" :faction="m.faction" :size="14" />
            </td>
            <td class="text-right tabular-nums">{{ m.level }}</td>
            <td
              class="text-right tabular-nums hidden sm:table-cell"
              :class="{ 'italic text-base-content/50': isStaleSync(m.synced_at) }"
            >
              <template v-if="m.equipped_item_level != null">{{ m.equipped_item_level }}</template>
              <span v-else class="text-base-content/40">—</span>
            </td>
            <td
              class="text-right tabular-nums hidden sm:table-cell"
              :class="{ 'italic opacity-70': isStaleSync(m.synced_at) }"
            >
              <span
                v-if="m.mythic_plus_rating"
                :style="{ color: m.mythic_plus_rating.color ?? undefined }"
              >
                {{ m.mythic_plus_rating.rating }}
              </span>
              <span v-else class="text-base-content/40">—</span>
            </td>
            <td class="text-right tabular-nums">{{ m.rank }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="flex items-center justify-between gap-2">
      <p class="text-xs text-base-content/60">
        Page {{ currentPage }} of {{ lastPage }} · {{ members.total }} members
      </p>
      <div class="join">
        <button type="button" class="btn btn-sm join-item" :disabled="!hasPrev" @click="goPrev">Previous</button>
        <button
          v-for="p in pageWindow"
          :key="p"
          type="button"
          class="btn btn-sm join-item"
          :class="{ 'btn-active': p === currentPage }"
          @click="goTo(p)"
        >
          {{ p }}
        </button>
        <button type="button" class="btn btn-sm join-item" :disabled="!hasNext" @click="goNext">Next</button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.roster-table :deep(td),
.roster-table :deep(th) {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
</style>
