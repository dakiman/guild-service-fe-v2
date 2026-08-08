<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ points: number[]; width?: number; height?: number }>(), {
  width: 80,
  height: 20,
})

const polyline = computed(() => {
  const pts = props.points
  if (pts.length < 2) return null
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const stepX = props.width / (pts.length - 1)
  return pts
    .map(
      (p, i) =>
        `${(i * stepX).toFixed(1)},${(props.height - ((p - min) / span) * (props.height - 2) - 1).toFixed(1)}`,
    )
    .join(' ')
})
</script>

<template>
  <svg
    v-if="polyline"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    fill="none"
    aria-hidden="true"
  >
    <polyline :points="polyline" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
  </svg>
</template>
