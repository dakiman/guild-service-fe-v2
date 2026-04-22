<template>
  <span class="inline-flex items-center gap-2">
    <span class="badge badge-warning gap-2">
      <span class="loading loading-spinner loading-xs" />
      Refreshing…
    </span>
    <span v-if="lastSyncedAt" class="text-xs text-base-content/60">
      Last synced {{ relativeTime }} ago
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  lastSyncedAt?: string
}>()

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d`
}

const relativeTime = computed(() =>
  props.lastSyncedAt ? formatRelative(props.lastSyncedAt) : '',
)
</script>
