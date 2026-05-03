<template>
  <span
    role="img"
    :aria-label="faction"
    :title="faction"
    class="inline-block align-middle"
    :style="style"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Faction } from '@/types/wow'
import { FACTION_COLORS } from '@/utils/wowConstants'

const props = withDefaults(defineProps<{ faction: Faction; size?: number }>(), {
  size: 28,
})

const style = computed(() => {
  const url =
    props.faction === 'Alliance' ? '/factions/alliance.png' : '/factions/horde.png'
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundColor: FACTION_COLORS[props.faction],
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }
})
</script>
