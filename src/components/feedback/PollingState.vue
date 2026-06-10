<template>
  <div class="wsa-card flex flex-col items-center text-center gap-3 py-8">
    <div class="wsa-spinner" />
    <p class="text-sm font-medium text-wsa-text">{{ message ?? defaultMessage }}</p>
    <p class="text-xs text-wsa-disabled">{{ subtext ?? defaultSubtext }}</p>
    <p v-if="queueDepth && queueDepth > 0" class="text-xs text-wsa-disabled">
      ~{{ queueDepth.toLocaleString() }} jobs in queue
    </p>
    <p v-if="attempt !== undefined" class="text-xs text-wsa-disabled">
      Attempt {{ attempt }} of {{ maxAttempts ?? 12 }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  attempt?: number
  maxAttempts?: number
  queueDepth?: number
  message?: string
  subtext?: string
}>()

const defaultMessage = 'Fetching latest data from Blizzard…'
const defaultSubtext = "This usually takes a few seconds — we'll keep checking."
</script>
