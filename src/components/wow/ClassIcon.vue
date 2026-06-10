<template>
  <span
    v-if="pos"
    class="inline-block align-middle"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url(${classesSprite})`,
      backgroundSize: `${(CLASS_SPRITE_SIZE * size) / TILE_SIZE}px ${(CLASS_SPRITE_SIZE * size) / TILE_SIZE}px`,
      backgroundPosition: `${(pos[0] * size) / TILE_SIZE}px ${(pos[1] * size) / TILE_SIZE}px`,
    }"
    :title="name"
  />
  <span
    v-else
    class="inline-flex items-center justify-center rounded font-bold align-middle"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.floor(size * 0.55))}px`,
      backgroundColor: 'rgb(var(--wsa-card))',
      color: 'rgb(var(--wsa-heading))',
    }"
    :title="name"
  >
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CLASSES } from '@/utils/wowConstants'
import {
  classesSprite,
  CLASS_ICON_POS,
  CLASS_SPRITE_SIZE,
  TILE_SIZE,
} from '@/utils/wowIcons'

const props = withDefaults(defineProps<{ classId: number; size?: number }>(), {
  size: 24,
})

const pos = computed(() => CLASS_ICON_POS[props.classId])
const name = computed(() => CLASSES[props.classId] ?? 'Unknown')
const initial = computed(() => (name.value[0] ?? '?').toUpperCase())
</script>
