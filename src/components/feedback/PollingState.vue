<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body items-center text-center gap-3">
      <span class="loading loading-spinner loading-lg text-primary" />
      <p class="text-base-content font-medium">{{ message ?? defaultMessage }}</p>
      <p class="text-sm text-base-content/60">{{ subtext ?? defaultSubtext }}</p>
      <p v-if="attempt !== undefined" class="text-xs text-base-content/50">
        Attempt {{ attempt }} of {{ maxAttempts ?? 12 }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  attempt?: number
  maxAttempts?: number
  message?: string
  subtext?: string
}>()

const defaultMessage = 'Fetching latest data from Blizzard…'
const defaultSubtext = "This usually takes a few seconds — we'll keep checking."
</script>
