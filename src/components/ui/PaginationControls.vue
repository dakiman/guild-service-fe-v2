<template>
  <nav class="flex flex-wrap items-center gap-2" :class="summary ? 'justify-between' : 'justify-center'">
    <p v-if="summary" class="text-xs text-wsa-disabled">{{ summary }}</p>
    <div class="flex justify-center gap-2">
      <button type="button" class="wsa-btn" :disabled="page <= 1" @click="go(page - 1)">
        Prev
      </button>
      <template v-if="windowSize && windowSize > 0">
        <button
          v-for="p in pageWindow"
          :key="p"
          type="button"
          class="wsa-btn"
          :class="{ 'wsa-btn--primary': p === page }"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <span v-else class="text-xs text-wsa-disabled flex items-center tabular-nums">
        {{ page }} / {{ lastPage }}
      </span>
      <button type="button" class="wsa-btn" :disabled="page >= lastPage" @click="go(page + 1)">
        Next
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  lastPage: number
  windowSize?: number
  summary?: string
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

function go(p: number) {
  const clamped = Math.min(props.lastPage, Math.max(1, p))
  if (clamped !== props.page) emit('update:page', clamped)
}

const pageWindow = computed(() => {
  const size = props.windowSize ?? 0
  if (size <= 0) return []
  const half = Math.floor(size / 2)
  let start = Math.max(1, props.page - half)
  const end = Math.min(props.lastPage, start + size - 1)
  start = Math.max(1, end - size + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
</script>
