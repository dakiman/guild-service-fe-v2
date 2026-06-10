<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  subtitle?: string
  accentColor?: string
  tooltip?: string
}>()
</script>

<template>
  <div
    class="stats-card p-4 transition-all hover:brightness-110"
    :class="{ 'stats-border-accent': accentColor }"
    :style="accentColor ? { '--stats-accent': accentColor } as any : undefined"
    :title="tooltip"
  >
    <p class="stats-label font-medium uppercase tracking-wide">
      {{ label }}
    </p>
    <p class="stats-value mt-1 text-2xl">{{ value }}</p>
    <p v-if="subtitle" class="mt-0.5 text-xs stats-muted">
      {{ subtitle }}
    </p>
  </div>
</template>
