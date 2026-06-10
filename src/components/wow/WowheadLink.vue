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
import { buildWowheadHref } from '@/utils/wowhead'

const props = defineProps<{
  itemId?: number
  spellId?: number
  itemLevel?: number
  qualityId?: number
  label?: string
  bonus?: number[]
  gems?: number[]
  enchantments?: number[]
  pcs?: number[]
  classic?: boolean
}>()

const href = computed(() =>
  buildWowheadHref({
    itemId: props.itemId,
    spellId: props.spellId,
    itemLevel: props.itemLevel,
    bonus: props.bonus,
    gems: props.gems,
    enchantments: props.enchantments,
    pcs: props.pcs,
    classic: props.classic,
  }),
)

const qualityClass = computed(() => (props.qualityId !== undefined ? `q${props.qualityId}` : ''))
</script>
