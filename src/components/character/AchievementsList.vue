<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <p class="text-sm text-ma-muted/70">
        <template v-if="totalLabel">{{ totalLabel }}</template>
        <template v-else>Loading achievements…</template>
      </p>
      <label class="flex items-center gap-2 text-xs text-ma-muted/70">
        <input
          v-model="includeFeats"
          type="checkbox"
          class="checkbox checkbox-xs"
        />
        <span>Include Feats of Strength</span>
      </label>
    </div>

    <div v-if="isError" class="ma-card p-4 text-sm text-red-300">
      Couldn't load achievements. <button class="link" @click="() => refetch()">Retry</button>
    </div>

    <div v-else-if="!isLoading && rows.length === 0" class="text-ma-muted/70 text-sm">
      No achievements recorded.
    </div>

    <div v-else ref="parentRef" class="ma-card overflow-y-auto" style="height: 600px">
      <div
        :style="{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualRow in virtualizer.getVirtualItems()"
          :key="String(virtualRow.key)"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }"
          class="px-4 py-3 border-b border-ma-border/30 flex items-center justify-between"
        >
          <div class="flex flex-col gap-0.5 min-w-0">
            <a
              :href="`https://www.wowhead.com/achievement=${rows[virtualRow.index].achievement_id}`"
              :data-wowhead="`achievement=${rows[virtualRow.index].achievement_id}`"
              target="_blank"
              rel="noopener"
              class="text-sm truncate"
            >
              {{ rows[virtualRow.index].name ?? `Achievement ${rows[virtualRow.index].achievement_id}` }}
            </a>
            <span
              v-if="rows[virtualRow.index].category_name"
              class="text-[10px] text-ma-muted/50 truncate"
            >
              {{ rows[virtualRow.index].category_name }}
            </span>
          </div>
          <span class="text-xs text-ma-muted/60 tabular-nums shrink-0 ml-4">
            {{ formatTimestamp(rows[virtualRow.index].completed_timestamp) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { fetchCharacterAchievements, type AchievementsPage } from '@/api/achievements'
import type { Region } from '@/types/api'

const props = defineProps<{
  region: Region
  realm: string
  name: string
}>()

const PER_PAGE = 100
const PREFETCH_THRESHOLD_PX = 200

const includeFeats = ref(false)
const parentRef = ref<HTMLElement | null>(null)

const query = useInfiniteQuery<AchievementsPage>({
  queryKey: computed(() => ['character-achievements', props.region, props.realm, props.name, includeFeats.value]),
  queryFn: ({ pageParam }) =>
    fetchCharacterAchievements(props.region, props.realm, props.name, {
      cursor: (pageParam as string | null) ?? null,
      perPage: PER_PAGE,
      includeFeats: includeFeats.value,
    }),
  initialPageParam: null,
  getNextPageParam: (last) => last.meta.next_cursor,
  staleTime: 60_000,
})

const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = query

const rows = computed(() => (data.value?.pages ?? []).flatMap((p) => p.data))
const total = computed(() => data.value?.pages?.[0]?.meta?.total ?? null)

const totalLabel = computed(() =>
  total.value === null ? '' : `${total.value.toLocaleString()} achievements completed`,
)

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => 56,
    overscan: 8,
  })),
)

// Prefetch the next page when the virtualizer renders rows close to the end.
watch(
  () => virtualizer.value.getVirtualItems(),
  (items) => {
    if (!hasNextPage.value || isFetchingNextPage.value) return
    if (items.length === 0) return

    const last = items[items.length - 1]
    const totalSize = virtualizer.value.getTotalSize()
    if (last.start + last.size >= totalSize - PREFETCH_THRESHOLD_PX) {
      void fetchNextPage()
    }
  },
)

function formatTimestamp(ms: number | null): string {
  if (ms === null || ms === 0) return '—'
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
