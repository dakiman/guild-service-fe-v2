<template>
  <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <a
      v-if="item"
      :href="`https://www.wowhead.com/${href}`"
      :data-wowhead="href"
      class="block w-full h-full rounded border-2"
      :style="{ borderColor: qualityColor ?? 'rgb(var(--wsa-border) / 0.3)' }"
      target="_blank"
      rel="noopener"
      tabindex="-1"
    />
    <div
      v-else
      class="w-full h-full rounded border border-dashed border-wsa-disabled/15"
    />
    <span
      v-if="item"
      class="absolute -bottom-1 -right-1 text-[9px] font-mono leading-none
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
  size?: number
}>()

const size = computed(() => props.size ?? 36)

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
