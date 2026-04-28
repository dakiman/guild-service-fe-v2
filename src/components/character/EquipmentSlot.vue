<template>
  <div
    class="ma-card-inner flex items-center gap-3 p-3 min-h-[3rem]"
    :class="orientationClass"
  >
    <span class="text-[10px] uppercase tracking-wider text-ma-muted/60 shrink-0 w-20">
      {{ formatSlotLabel(slot) }}
    </span>

    <template v-if="item">
      <WowheadLink
        :item-id="item.id"
        :item-level="item.item_level"
        :quality-id="itemQualityToId(item.quality)"
        :bonus="item.bonus"
        :gems="item.gems"
        :enchantments="item.enchantments"
        :pcs="pcs"
        class="flex-1 truncate text-sm"
      >
        {{ item.name || formatQuality(item.quality) }}
      </WowheadLink>
      <span class="text-xs font-mono text-ma-gold shrink-0">
        {{ item.item_level }}
      </span>
    </template>

    <span v-else class="flex-1 text-xs italic text-ma-disabled/50">Empty</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import { itemQualityToId } from '@/utils/wowConstants'
import { formatSlotLabel } from '@/utils/equipmentLayout'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{
  item: EquipmentItem | null
  slot: Slot
  mirrored?: 'left' | 'right' | 'center'
  pcs?: number[]
}>()

const orientationClass = computed(() =>
  props.mirrored === 'right' ? 'flex-row-reverse text-right' : '',
)

function formatQuality(quality: string): string {
  if (!quality) return ''
  return quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase()
}
</script>
