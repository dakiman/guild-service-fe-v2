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
        <label class="flex items-center gap-2 text-xs text-ma-muted/70">
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            v-model="includeFeatsOfStrength"
          />
          <span>Include Feats of Strength</span>
        </label>
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
            <div class="flex flex-col gap-0.5 min-w-0">
              <a
                :href="`https://www.wowhead.com/achievement=${visible[virtualRow.index].entry.achievement_id}`"
                :data-wowhead="`achievement=${visible[virtualRow.index].entry.achievement_id}`"
                target="_blank"
                rel="noopener"
                class="text-sm truncate"
              >
                {{ visible[virtualRow.index].label }}
              </a>
              <span
                v-if="visible[virtualRow.index].categoryName"
                class="text-[10px] text-ma-muted/50 truncate"
              >
                {{ visible[virtualRow.index].categoryName }}
              </span>
            </div>
            <span class="text-xs text-ma-muted/60 tabular-nums shrink-0 ml-4">
              {{ formatTimestamp(visible[virtualRow.index].entry.completed_timestamp) }}
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
import { useGameDataAchievements } from '@/composables/useGameDataAchievements'
import type { CharacterAchievement } from '@/types/character'

const FEATS_OF_STRENGTH_CATEGORY_NAME = 'Feats of Strength'

const props = defineProps<{
  entries: CharacterAchievement[]
}>()

const parentRef = ref<HTMLElement | null>(null)
const includeFeatsOfStrength = ref(false)

const { byId } = useGameDataAchievements()

interface VisibleRow {
  entry: CharacterAchievement
  label: string
  categoryName: string | null
  isFeatsOfStrength: boolean
}

const resolved = computed<VisibleRow[]>(() => {
  const map = byId.value
  const out: VisibleRow[] = []

  for (const entry of props.entries) {
    const meta = map.get(entry.achievement_id)
    const categoryName = meta?.category?.name ?? null
    out.push({
      entry,
      label: meta ? meta.name : `Achievement ${entry.achievement_id}`,
      categoryName,
      isFeatsOfStrength: categoryName === FEATS_OF_STRENGTH_CATEGORY_NAME,
    })
  }

  return out
})

const visible = computed<VisibleRow[]>(() => {
  const filtered = includeFeatsOfStrength.value
    ? resolved.value
    : resolved.value.filter((r) => !r.isFeatsOfStrength)

  return [...filtered].sort((a, b) => {
    const aTs = a.entry.completed_timestamp ?? -1
    const bTs = b.entry.completed_timestamp ?? -1

    return bTs - aTs
  })
})

const virtualizer = useVirtualizer(
  computed(() => ({
    count: visible.value.length,
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
