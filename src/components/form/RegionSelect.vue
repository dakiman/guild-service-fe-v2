<template>
  <select
    class="wsa-input !py-1.5 text-sm"
    :value="modelValue"
    @change="(e) => emit('update:modelValue', (e.target as HTMLSelectElement).value as Region)"
  >
    <option v-for="r in regions" :key="r" :value="r">{{ r.toUpperCase() }}</option>
  </select>
</template>

<script setup lang="ts">
import type { Region } from '@/types/api'

defineProps<{ modelValue: Region }>()
const emit = defineEmits<{ 'update:modelValue': [value: Region] }>()
const regions: Region[] = ['eu', 'us', 'kr', 'tw']
</script>
