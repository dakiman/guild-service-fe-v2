<script setup lang="ts">
import { toRef } from 'vue'
import SparkLine from '@/components/ui/SparkLine.vue'
import TableScrollHint from '@/components/ui/TableScrollHint.vue'
import { useTableSort, type SortDir } from '@/composables/useTableSort'
import type { DungeonReportEntry, DungeonTrendPoint } from '@/types/meta'

const props = withDefaults(
  defineProps<{
    dungeons: DungeonReportEntry[]
    trends: Record<string, DungeonTrendPoint[]>
    highlightId?: number | null
  }>(),
  {
    highlightId: null,
  },
)

type ColumnKey = keyof DungeonReportEntry

interface Column {
  key: ColumnKey
  label: string
  // First click on a fresh column: names read best A→Z, numbers best-first.
  defaultDir: SortDir
  align: string
}

const columns: Column[] = [
  { key: 'name', label: 'Dungeon', defaultDir: 'asc', align: 'text-left' },
  { key: 'runs', label: 'Runs', defaultDir: 'desc', align: 'text-right' },
  { key: 'timed_rate', label: 'Timed %', defaultDir: 'desc', align: 'text-right' },
  { key: 'avg_key', label: 'Avg Key', defaultDir: 'desc', align: 'text-right' },
  { key: 'avg_margin_ms', label: 'Avg vs Timer', defaultDir: 'desc', align: 'text-right' },
  { key: 'highest_key', label: 'Best', defaultDir: 'desc', align: 'text-right' },
]

const { sortKey, sortDir, sortedRows, toggle } = useTableSort<DungeonReportEntry>(
  toRef(props, 'dungeons'),
  'runs',
)
// useTableSort always starts ascending; the table's default view is runs desc.
sortDir.value = 'desc'

function sortBy(col: Column): void {
  if (sortKey.value === col.key) {
    toggle(col.key)
    return
  }
  sortKey.value = col.key
  sortDir.value = col.defaultDir
}

function ariaSort(key: ColumnKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function sortGlyph(key: ColumnKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

function formatMargin(ms: number | null): string {
  if (ms === null) return '—'
  const sign = ms >= 0 ? '+' : '-'
  const totalSec = Math.round(Math.abs(ms) / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}`
}

// Positive margin = finished under the timer.
function marginClass(ms: number | null): string {
  if (ms === null) return 'text-wsa-disabled'
  return ms >= 0 ? 'text-green-500' : 'text-red-500'
}

function trendPoints(dungeonId: number): number[] {
  return (props.trends[String(dungeonId)] ?? []).map((p) => p.timed_rate)
}
</script>

<template>
  <div>
    <TableScrollHint />
    <div class="overflow-x-auto">
      <table class="w-full text-xs min-w-[520px]">
        <thead>
          <tr class="text-wsa-muted uppercase tracking-wide border-b border-wsa-border/40">
            <th
              v-for="col in columns"
              :key="col.key"
              role="columnheader"
              :aria-sort="ariaSort(col.key)"
              tabindex="0"
              class="py-2 px-2 cursor-pointer select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1"
              :class="col.align"
              @click="sortBy(col)"
              @keydown.enter.prevent="sortBy(col)"
              @keydown.space.prevent="sortBy(col)"
            >
              {{ col.label }}<span class="text-wsa-disabled">{{ sortGlyph(col.key) }}</span>
            </th>
            <th class="py-2 px-2 text-right">Trend</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedRows.length === 0">
            <td :colspan="columns.length + 1" class="text-center text-wsa-disabled py-4 italic">
              No dungeon data yet
            </td>
          </tr>
          <tr
            v-for="row in sortedRows"
            :key="row.dungeon_id"
            class="border-b border-wsa-border/20 hover:bg-black/20 transition-colors"
            :class="row.dungeon_id === highlightId ? 'bg-wsa-gold/5' : ''"
          >
            <td
              class="py-2 px-2 whitespace-nowrap"
              :class="row.dungeon_id === highlightId ? 'text-wsa-gold font-medium' : 'text-wsa-text'"
            >
              {{ row.name ?? `Dungeon ${row.dungeon_id}` }}
            </td>
            <td class="py-2 px-2 text-right stats-value">{{ row.runs.toLocaleString() }}</td>
            <td class="py-2 px-2 text-right tabular-nums text-wsa-text">
              {{ Math.round(row.timed_rate * 100) }}%
            </td>
            <td class="py-2 px-2 text-right tabular-nums text-wsa-text">
              {{ row.avg_key.toFixed(1) }}
            </td>
            <td class="py-2 px-2 text-right tabular-nums" :class="marginClass(row.avg_margin_ms)">
              {{ formatMargin(row.avg_margin_ms) }}
            </td>
            <td class="py-2 px-2 text-right tabular-nums font-bold text-wsa-gold">
              +{{ row.highest_key }}
            </td>
            <td class="py-2 px-2 text-right text-wsa-muted">
              <SparkLine :points="trendPoints(row.dungeon_id)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
