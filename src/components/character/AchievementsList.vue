<template>
  <div class="flex flex-col gap-4">
    <div v-if="!entries || entries.length === 0" class="text-ma-muted/70 text-sm">
      No achievements recorded.
    </div>

    <template v-else>
      <div class="flex justify-between items-center">
        <p class="text-sm text-ma-muted/70">
          {{ entries.length.toLocaleString() }} achievements completed
        </p>
      </div>

      <div ref="parentRef" class="ma-card overflow-y-auto" style="height: 600px">
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
            <a
              :href="`https://www.wowhead.com/achievement=${sorted[virtualRow.index].achievement_id}`"
              :data-wowhead="`achievement=${sorted[virtualRow.index].achievement_id}`"
              target="_blank"
              rel="noopener"
              class="text-sm"
            >
              Achievement {{ sorted[virtualRow.index].achievement_id }}
            </a>
            <span class="text-xs text-ma-muted/60 tabular-nums">
              {{ formatTimestamp(sorted[virtualRow.index].completed_timestamp) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { CharacterAchievement } from '@/types/character'

const props = defineProps<{
  entries: CharacterAchievement[]
}>()

const parentRef = ref<HTMLElement | null>(null)

const sorted = computed<CharacterAchievement[]>(() => {
  return [...props.entries].sort((a, b) => {
    const aTs = a.completed_timestamp ?? -1
    const bTs = b.completed_timestamp ?? -1
    return bTs - aTs
  })
})

const virtualizer = useVirtualizer(
  computed(() => ({
    count: sorted.value.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => 56,
    overscan: 8,
  })),
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
