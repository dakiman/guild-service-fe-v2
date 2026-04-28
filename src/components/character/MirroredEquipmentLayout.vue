<template>
  <div class="ma-card p-6">
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)_minmax(0,1fr)] gap-6 items-start">
      <div class="flex flex-col gap-2">
        <EquipmentSlot
          v-for="slot in LEFT_COLUMN_SLOTS"
          :key="slot"
          :item="bySlot.get(slot) ?? null"
          :slot="slot"
          mirrored="left"
          :pcs="pcsBySlot.get(slot)"
        />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="ma-card-inner overflow-hidden rounded-ma-row w-full max-w-[360px] aspect-[3/4]">
          <img
            v-if="renderUrl"
            :src="renderUrl"
            :alt="`${characterName} 3D render`"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-else class="w-full h-full grid place-items-center text-ma-muted/50 text-sm">
            No render available
          </div>
        </div>
        <div class="flex flex-col gap-2 w-full">
          <EquipmentSlot
            v-for="slot in WEAPON_SLOTS"
            :key="slot"
            :item="bySlot.get(slot) ?? null"
            :slot="slot"
            mirrored="center"
            :pcs="pcsBySlot.get(slot)"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <EquipmentSlot
          v-for="slot in RIGHT_COLUMN_SLOTS"
          :key="slot"
          :item="bySlot.get(slot) ?? null"
          :slot="slot"
          mirrored="right"
          :pcs="pcsBySlot.get(slot)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EquipmentSlot from '@/components/character/EquipmentSlot.vue'
import {
  LEFT_COLUMN_SLOTS,
  RIGHT_COLUMN_SLOTS,
  WEAPON_SLOTS,
} from '@/utils/equipmentLayout'
import { groupEquipmentBySetId, getPcsFor } from '@/utils/equipmentSets'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{
  equipment: EquipmentItem[]
  renderUrl?: string | null
  characterName: string
}>()

const bySlot = computed(() => {
  const map = new Map<Slot, EquipmentItem>()
  for (const item of props.equipment) map.set(item.slot, item)
  return map
})

const sets = computed(() => groupEquipmentBySetId(props.equipment))

const pcsBySlot = computed(() => {
  const map = new Map<Slot, number[] | undefined>()
  for (const item of props.equipment) {
    map.set(item.slot, getPcsFor(item, sets.value))
  }
  return map
})
</script>
