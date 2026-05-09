<template>
  <div
    class="relative shrink-0 rounded"
    :class="item ? 'ring-2' : 'border border-dashed border-wsa-disabled/15'"
    :style="{
      width: '44px',
      height: '44px',
      '--tw-ring-color': item ? (qualityColor ?? 'rgb(var(--wsa-border) / 0.3)') : undefined,
    }"
  >
    <a
      v-if="item"
      :href="`https://www.wowhead.com/${href}`"
      :data-wowhead="href"
      class="block w-full h-full"
      target="_blank"
      rel="noopener"
      tabindex="-1"
    />
    <span
      v-if="item"
      class="absolute -bottom-1 -right-1 z-10 text-[11px] font-mono leading-none
             bg-black/80 text-wsa-gold px-0.5 rounded-sm tabular-nums"
    >
      {{ item.item_level }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildWowheadHref } from '@/utils/wowhead'
import { itemQualityColor } from '@/utils/wowConstants'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{
  item: EquipmentItem | null
  slot: Slot
  pcs?: number[]
  classic?: boolean
}>()

const href = computed(() =>
  props.item
    ? buildWowheadHref({
        itemId: props.item.id,
        itemLevel: props.item.item_level,
        bonus: props.item.bonus,
        gems: props.item.gems,
        enchantments: props.item.enchantments,
        pcs: props.pcs,
        classic: props.classic,
      })
    : '',
)

const qualityColor = computed(() =>
  props.item ? itemQualityColor(props.item.quality) : undefined,
)
</script>
