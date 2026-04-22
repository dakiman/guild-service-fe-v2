<template>
  <span
    class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white"
    :style="{ backgroundColor: color }"
    :title="name"
  >
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CLASSES, CLASS_COLORS } from '@/utils/wowConstants'

const props = defineProps<{ classId: number }>()
const name = computed(() => CLASSES[props.classId] ?? 'Unknown')
const color = computed(() => CLASS_COLORS[props.classId] ?? '#888')
const initial = computed(() => (name.value[0] ?? '?').toUpperCase())
</script>
