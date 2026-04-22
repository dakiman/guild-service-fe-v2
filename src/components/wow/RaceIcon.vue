<template>
  <span
    class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white bg-neutral"
    :title="name"
  >
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RACES } from '@/utils/wowConstants'

const props = defineProps<{ raceId: number }>()
const name = computed(() => RACES[props.raceId] ?? 'Unknown')
const initial = computed(() => (name.value[0] ?? '?').toUpperCase())
</script>
