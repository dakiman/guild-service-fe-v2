<script setup lang="ts">
import { computed } from 'vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'
import { CLASSES, RACES } from '@/utils/wowConstants'
import { displayName } from '@/utils/display'
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

function className(classId: number): string {
  return CLASSES[classId] ?? 'Unknown'
}

function raceName(raceId: number): string {
  return RACES[raceId] ?? 'Unknown'
}

function goPrev() {
  if (currentPage.value > 1) emit('pageChange', currentPage.value - 1)
}

function goNext() {
  if (currentPage.value < lastPage.value) emit('pageChange', currentPage.value + 1)
}

function goTo(p: number) {
  if (p !== currentPage.value && p >= 1 && p <= lastPage.value) emit('pageChange', p)
}

// Render a small window of page numbers around the current page.
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
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Race</th>
            <th>Level</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRows.length === 0">
            <td colspan="5" class="text-center text-base-content/60">No members match your filter.</td>
          </tr>
          <tr v-for="m in filteredRows" :key="m.id">
            <td class="font-medium">{{ displayName(m.name, m.display_name) }}</td>
            <td>
              <span class="inline-flex items-center gap-2">
                <ClassIcon :class-id="m.class_id" />
                <span>{{ className(m.class_id) }}</span>
              </span>
            </td>
            <td>
              <span class="inline-flex items-center gap-2">
                <RaceIcon :race-id="m.race_id" />
                <span>{{ raceName(m.race_id) }}</span>
              </span>
            </td>
            <td>{{ m.level }}</td>
            <td>{{ m.rank }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="flex items-center justify-between gap-2">
      <p class="text-xs text-base-content/60">
        Page {{ currentPage }} of {{ lastPage }} · {{ members.total }} members
      </p>
      <div class="join">
        <button
          type="button"
          class="btn btn-sm join-item"
          :disabled="!hasPrev"
          @click="goPrev"
        >
          Previous
        </button>
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
        <button
          type="button"
          class="btn btn-sm join-item"
          :disabled="!hasNext"
          @click="goNext"
        >
          Next
        </button>
      </div>
    </nav>
  </div>
</template>
