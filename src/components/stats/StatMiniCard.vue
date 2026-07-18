<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  subtitle?: string
  accentColor?: string
  valueColor?: string
  tooltip?: string
}>()
</script>

<template>
  <div
    class="wsa-card p-4 transition-all hover:brightness-110"
    :class="{ 'stats-border-accent': accentColor }"
    :style="accentColor ? { '--stats-accent': accentColor } as any : undefined"
    :title="tooltip"
  >
    <p class="stats-label font-medium uppercase tracking-wide">
      {{ label }}
    </p>
    <div class="mt-1 flex items-center gap-2">
      <slot name="icon" />
      <p
        data-test="stat-value"
        class="stats-value text-2xl"
        :style="valueColor ? { color: valueColor } : undefined"
      >
        {{ value }}
      </p>
    </div>
    <p v-if="subtitle" class="mt-0.5 text-xs stats-muted">
      {{ subtitle }}
    </p>
  </div>
</template>
