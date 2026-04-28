<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Equipment</h2>
      <p v-if="!equipment.length" class="text-base-content/60">No equipment recorded.</p>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="item in sortedEquipment"
          :key="`${item.slot}-${item.id}`"
          class="flex items-center justify-between gap-2 px-3 py-2 rounded bg-base-100"
        >
          <span class="text-xs uppercase text-base-content/60 w-24">
            {{ formatSlot(item.slot) }}
          </span>
          <WowheadLink
            :item-id="item.id"
            :item-level="item.item_level"
            :quality-id="itemQualityToId(item.quality)"
            :bonus="item.bonus"
            :gems="item.gems"
            :enchantments="item.enchantments"
            :pcs="pcsFor(item)"
            :classic="props.classic"
            class="flex-1 truncate"
          >
            {{ item.item_level }} {{ item.name || formatQuality(item.quality) }}
          </WowheadLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import { itemQualityToId } from '@/utils/wowConstants'
import { groupEquipmentBySetId, getPcsFor } from '@/utils/equipmentSets'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{ equipment: EquipmentItem[]; classic?: boolean }>()

const SLOT_ORDER: Slot[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'shirt',
  'tabard',
  'wrist',
  'hands',
  'waist',
  'legs',
  'feet',
  'finger_1',
  'finger_2',
  'trinket_1',
  'trinket_2',
  'main_hand',
  'off_hand',
  'ranged',
]

const sortedEquipment = computed(() => {
  const order = new Map<Slot, number>(SLOT_ORDER.map((s, i) => [s, i]))
  return [...props.equipment].sort((a, b) => {
    const ai = order.get(a.slot) ?? 999
    const bi = order.get(b.slot) ?? 999
    return ai - bi
  })
})

const sets = computed(() => groupEquipmentBySetId(props.equipment))

function pcsFor(item: EquipmentItem): number[] | undefined {
  return getPcsFor(item, sets.value)
}

function formatSlot(slot: string): string {
  return slot.replace(/_/g, ' ')
}

function formatQuality(quality: string): string {
  if (!quality) return ''
  return quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase()
}
</script>
