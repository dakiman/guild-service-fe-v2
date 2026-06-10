<template>
  <span
    v-if="pos"
    class="inline-block align-middle"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url(${specsSprite})`,
      backgroundSize: `${(SPECS_SPRITE_W * size) / TILE_SIZE}px ${(SPECS_SPRITE_H * size) / TILE_SIZE}px`,
      backgroundPosition: `${(pos[0] * size) / TILE_SIZE}px ${(pos[1] * size) / TILE_SIZE}px`,
    }"
    :title="title"
  />
  <ClassIcon
    v-else-if="fallbackClassId != null && hasFallback"
    :class-id="fallbackClassId"
    :size="size"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import { CLASSES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import {
  specsSprite,
  SPEC_ICON_POS,
  SPEC_NAMES,
  SPECS_SPRITE_W,
  SPECS_SPRITE_H,
  TILE_SIZE,
} from '@/utils/wowIcons'

const props = withDefaults(
  defineProps<{
    specId: number | null
    size?: number
    fallbackClassId?: number | null
  }>(),
  { size: 24, fallbackClassId: null },
)

const pos = computed(() => (props.specId != null ? SPEC_ICON_POS[props.specId] : undefined))

const hasFallback = computed(
  () => props.fallbackClassId != null && CLASSES[props.fallbackClassId] != null,
)

const title = computed(() => {
  if (props.specId == null) return undefined
  const classId = SPEC_TO_CLASS[props.specId]
  const className = classId != null ? CLASSES[classId] : undefined
  const specName = SPEC_NAMES[props.specId]
  if (className && specName) return `${className} — ${specName}`
  return specName ?? className ?? undefined
})
</script>
