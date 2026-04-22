<template>
  <a
    :href="`https://www.wowhead.com/${href}`"
    :data-wowhead="href"
    :class="qualityClass"
    target="_blank"
    rel="noopener"
  >
    <slot>{{ label }}</slot>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  itemId?: number
  spellId?: number
  itemLevel?: number
  qualityId?: number
  label?: string
}>()

const href = computed(() => {
  let h = ''
  if (props.itemId) h += `item=${props.itemId}`
  if (props.spellId) h += `spell=${props.spellId}`
  if (props.itemLevel) h += `&ilvl=${props.itemLevel}`
  return h
})

const qualityClass = computed(() => (props.qualityId !== undefined ? `q${props.qualityId}` : ''))
</script>
