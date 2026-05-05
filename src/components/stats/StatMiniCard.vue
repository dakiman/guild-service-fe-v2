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
    class="rounded-lg border border-base-content/5 bg-base-100 p-4 shadow-sm transition-all hover:shadow-md hover:border-base-content/10"
    :style="accentColor ? { borderLeftWidth: '3px', borderLeftColor: accentColor } : undefined"
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
