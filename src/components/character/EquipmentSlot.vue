<template>
  <div
    class="ma-card-inner flex items-center gap-3 p-3 min-h-[3rem]"
    :class="orientationClass"
  >
    <span class="text-[10px] uppercase tracking-wider text-ma-muted/60 shrink-0 w-20">
      {{ formatSlotLabel(slot) }}
    </span>

    <a
      v-if="item"
      :href="`https://www.wowhead.com/${href}`"
      :data-wowhead="href"
      class="shrink-0 inline-flex w-11 h-11 items-center justify-center"
      target="_blank"
      rel="noopener"
      aria-hidden="true"
      tabindex="-1"
    />
    <div
      v-else
      class="shrink-0 w-11 h-11 rounded border border-dashed border-ma-disabled/15"
      aria-hidden="true"
    />

    <template v-if="item">
      <a
        :href="`https://www.wowhead.com/${href}`"
        :data-wowhead="href"
        :class="['flex-1 truncate text-sm', qualityClass]"
        target="_blank"
        rel="noopener"
        data-wh-icon-added="true"
      >
        {{ item.name || formatQuality(item.quality) }}
      </a>
      <span class="text-xs font-mono text-ma-gold shrink-0">
        {{ item.item_level }}
      </span>
    </template>

    <span v-else class="flex-1 text-xs italic text-ma-disabled/50">Empty</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterContext } from '@/composables/useCharacterContext'
import { itemQualityToId } from '@/utils/wowConstants'
import { formatSlotLabel } from '@/utils/equipmentLayout'
import { buildWowheadHref } from '@/utils/wowhead'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{
  item: EquipmentItem | null
  slot: Slot
  mirrored?: 'left' | 'right' | 'center'
  pcs?: number[]
}>()

const { isClassic } = useCharacterContext()

const orientationClass = computed(() =>
  props.mirrored === 'right' ? 'flex-row-reverse text-right' : '',
)

const href = computed(() =>
  props.item
    ? buildWowheadHref({
        itemId: props.item.id,
        itemLevel: props.item.item_level,
        bonus: props.item.bonus,
        gems: props.item.gems,
        enchantments: props.item.enchantments,
        pcs: props.pcs,
        classic: isClassic.value,
      })
    : '',
)

const qualityClass = computed(() => {
  if (!props.item) return ''
  const id = itemQualityToId(props.item.quality)
  return id !== undefined ? `q${id}` : ''
})

function formatQuality(quality: string): string {
  if (!quality) return ''
  return quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase()
}
</script>
