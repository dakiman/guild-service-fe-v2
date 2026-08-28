<script setup lang="ts">
import { computed } from 'vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import { SPEC_TO_CLASS, getClassColor } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import { specFullName } from '@/utils/specLabels'
import type { SpecMetaEntry } from '@/types/meta'

const props = withDefaults(
  defineProps<{
    entries: SpecMetaEntry[]
    prevShares?: Record<number, number> | null
    /** Spec currently used as the Top Comps filter; that row is highlighted. */
    activeSpecId?: number | null
  }>(),
  {
    prevShares: null,
    activeSpecId: null,
  },
)

const emit = defineEmits<{ 'select-spec': [specId: number] }>()

const maxShare = computed(() => Math.max(...props.entries.map((e) => e.share), 0.0001))

function movement(entry: SpecMetaEntry): '▲' | '▼' | null {
  const prev = props.prevShares?.[entry.spec_id]
  if (prev === undefined) return null
  const delta = entry.share - prev
  if (Math.abs(delta) < 0.005) return null
  return delta > 0 ? '▲' : '▼'
}

function movementTitle(entry: SpecMetaEntry): string | undefined {
  const m = movement(entry)
  if (m === null) return undefined
  return m === '▲' ? 'Share up vs previous week' : 'Share down vs previous week'
}

function isActive(entry: SpecMetaEntry): boolean {
  return entry.spec_id === props.activeSpecId
}

function rowTitle(entry: SpecMetaEntry): string {
  return isActive(entry) ? 'Clear comp filter' : `Show comps with ${specFullName(entry.spec_id)}`
}

function nameStyle(entry: SpecMetaEntry): Record<string, string> | undefined {
  if (isActive(entry)) return undefined
  return {
    color: getClassColor(SPEC_TO_CLASS[entry.spec_id] ?? 0) ?? 'rgb(var(--wsa-text))',
  }
}
</script>

<template>
  <div v-if="entries.length === 0" class="text-xs text-wsa-disabled italic py-4 text-center">
    No run data yet
  </div>
  <ul v-else class="flex flex-col gap-1.5">
    <li
      v-for="entry in entries"
      :key="entry.spec_id"
      role="button"
      tabindex="0"
      class="flex items-center gap-2 text-xs rounded px-1 -mx-1 cursor-pointer transition-colors hover:bg-black/20 focus-visible:outline-2 focus-visible:outline-offset-1"
      :class="isActive(entry) ? 'bg-wsa-gold/5' : ''"
      :title="rowTitle(entry)"
      @click="emit('select-spec', entry.spec_id)"
      @keydown.enter.prevent="emit('select-spec', entry.spec_id)"
      @keydown.space.prevent="emit('select-spec', entry.spec_id)"
    >
      <SpecIcon
        :spec-id="entry.spec_id"
        :fallback-class-id="SPEC_TO_CLASS[entry.spec_id] ?? null"
        :size="20"
      />
      <span
        class="w-28 truncate"
        :class="isActive(entry) ? 'text-wsa-gold font-medium' : ''"
        :style="nameStyle(entry)"
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
      <span
        class="w-[4.5rem] text-right text-wsa-muted whitespace-nowrap"
        :title="`${entry.count} appearances · timed rate within the selected bracket`"
      >
        {{ Math.round(entry.timed_rate * 100) }}% timed
      </span>
      <span
        data-testid="movement"
        class="w-4 text-center"
        :class="movement(entry) === '▲' ? 'text-green-500' : 'text-red-500'"
        :title="movementTitle(entry)"
      >
        {{ movement(entry) ?? '' }}
      </span>
    </li>
  </ul>
</template>
