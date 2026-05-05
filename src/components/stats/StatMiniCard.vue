<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  subtitle?: string
  accentColor?: string
}>()
</script>

<template>
  <div
    class="rounded-lg bg-base-100 p-4 transition-colors"
    :style="accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined"
  >
    <p class="text-xs font-medium uppercase tracking-wide text-base-content/60">
      {{ label }}
    </p>
    <p class="mt-1 text-2xl font-bold">{{ value }}</p>
    <p v-if="subtitle" class="mt-0.5 text-xs text-base-content/50">
      {{ subtitle }}
    </p>
  </div>
</template>
