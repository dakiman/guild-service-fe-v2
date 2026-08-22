<script setup lang="ts">
import { computed } from 'vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import { SPEC_TO_CLASS, getClassColor } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import type { SpecMetaEntry } from '@/types/meta'

const props = withDefaults(
  defineProps<{
    entries: SpecMetaEntry[]
    prevShares?: Record<number, number> | null
  }>(),
  {
    prevShares: null,
  },
)

const maxShare = computed(() => Math.max(...props.entries.map((e) => e.share), 0.0001))

function movement(entry: SpecMetaEntry): '▲' | '▼' | null {
  const prev = props.prevShares?.[entry.spec_id]
  if (prev === undefined) return null
  const delta = entry.share - prev
  if (Math.abs(delta) < 0.005) return null
  return delta > 0 ? '▲' : '▼'
}
</script>

<template>
  <div v-if="entries.length === 0" class="text-xs text-wsa-disabled italic py-4 text-center">
    No run data yet
  </div>
  <ul v-else class="flex flex-col gap-1.5">
    <li v-for="entry in entries" :key="entry.spec_id" class="flex items-center gap-2 text-xs">
      <SpecIcon
        :spec-id="entry.spec_id"
        :fallback-class-id="SPEC_TO_CLASS[entry.spec_id] ?? null"
        :size="20"
      />
      <span
        class="w-28 truncate"
        :style="{
          color: getClassColor(SPEC_TO_CLASS[entry.spec_id] ?? 0) ?? 'rgb(var(--wsa-text))',
        }"
      >
        {{ SPEC_NAMES[entry.spec_id] ?? `Spec ${entry.spec_id}` }}
      </span>
      <span class="flex-1 h-2 rounded-sm bg-wsa-muted/10 overflow-hidden">
        <span
          class="block h-full rounded-sm"
          :style="{
            width: `${(entry.share / maxShare) * 100}%`,
            backgroundColor:
              getClassColor(SPEC_TO_CLASS[entry.spec_id] ?? 0) ?? 'rgb(var(--wsa-gold))',
            opacity: 0.85,
          }"
        />
      </span>
      <span class="w-14 text-right stats-value">{{ (entry.share * 100).toFixed(1) }}%</span>
      <span class="w-16 text-right text-wsa-muted" :title="`${entry.count} appearances · timed rate within the selected bracket`">
        {{ Math.round(entry.timed_rate * 100) }}% timed
      </span>
      <span
        class="w-4 text-center"
        :class="movement(entry) === '▲' ? 'text-green-500' : 'text-red-500'"
      >
        {{ movement(entry) ?? '' }}
      </span>
    </li>
  </ul>
</template>
