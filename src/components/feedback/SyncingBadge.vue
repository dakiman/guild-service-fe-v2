<template>
  <span class="wsa-badge !border-sky-500/30 !text-sky-400 gap-1.5">
    <span class="wsa-spinner !w-3 !h-3 shrink-0" />
    <span>
      Syncing character data — sections fill in as they arrive.
      <template v-if="(queueDepth ?? 0) > QUEUE_BUSY_THRESHOLD">
        Queue is busy — this may take a few minutes.
      </template>
    </span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ queueDepth?: number }>()

const QUEUE_BUSY_THRESHOLD = 50
</script>
