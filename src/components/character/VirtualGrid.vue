<template>
  <div ref="scrollEl" class="wsa-card overflow-y-auto" :style="{ height: `${height}px` }">
    <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }">
      <div
        v-for="row in virtualizer.getVirtualItems()"
        :key="String(row.key)"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${row.start}px)`,
        }"
      >
        <div class="grid gap-2 p-1" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
          <slot
            v-for="item in rowItems(row.index)"
            :key="getKey(item)"
            name="item"
            :item="item"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

const props = withDefaults(
  defineProps<{
    items: T[]
    getKey: (item: T) => string | number
    estimateRowHeight?: number
    minColumnWidth?: number
    height?: number
    overscan?: number
  }>(),
  {
    estimateRowHeight: 64,
    minColumnWidth: 260,
    height: 600,
    overscan: 6,
  },
)

const scrollEl = ref<HTMLElement | null>(null)
const columns = ref(1)

// Responsive column count from the container width — falls back to 1 column
// where layout isn't measurable (SSR / jsdom). ResizeObserver keeps it current.
let observer: ResizeObserver | null = null
function recompute() {
  const width = scrollEl.value?.clientWidth ?? 0
  if (width <= 0) return
  columns.value = Math.max(1, Math.floor((width + 8) / (props.minColumnWidth + 8)))
}

onMounted(() => {
  recompute()
  if (typeof ResizeObserver !== 'undefined' && scrollEl.value) {
    observer = new ResizeObserver(recompute)
    observer.observe(scrollEl.value)
  }
})

onBeforeUnmount(() => observer?.disconnect())

const rowCount = computed(() => Math.ceil(props.items.length / columns.value))

function rowItems(rowIndex: number): T[] {
  const start = rowIndex * columns.value
  return props.items.slice(start, start + columns.value)
}

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rowCount.value,
    getScrollElement: () => scrollEl.value,
    estimateSize: () => props.estimateRowHeight,
    overscan: props.overscan,
  })),
)
</script>
