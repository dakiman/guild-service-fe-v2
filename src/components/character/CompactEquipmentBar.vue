<template>
  <div class="wsa-card overflow-hidden">
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 cursor-pointer
             hover:brightness-110 transition"
      @click="expanded = !expanded"
    >
      <div
        v-if="renderUrl"
        class="hidden sm:block shrink-0 w-[120px] h-[90px] overflow-hidden rounded"
      >
        <img
          :src="renderUrl"
          :alt="`${characterName} render`"
          class="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>

      <div class="flex flex-wrap gap-1.5 flex-1 min-w-0 items-center">
        <CompactEquipmentIcon
          v-for="slot in ALL_SLOTS"
          :key="slot"
          :item="bySlot.get(slot) ?? null"
          :slot="slot"
          :pcs="pcsBySlot.get(slot)"
          :classic="classic"
        />
      </div>

      <div class="hidden sm:block w-px self-stretch bg-wsa-border/30" />

      <div class="flex items-center gap-2 shrink-0">
        <SpecIcon
          v-if="specId"
          :spec-id="specId"
          :fallback-class-id="classId"
          :size="28"
          class="rounded-full ring-1 ring-wsa-border/30"
        />
        <span
          v-if="heroTreeName"
          class="text-xs text-wsa-muted whitespace-nowrap"
        >
          {{ heroTreeName }}
        </span>
        <TalentSummaryStrip
          v-if="summaryRefs.length > 0"
          :refs="summaryRefs"
          :class-color="classColor"
        />
      </div>

      <ChevronDown
        class="w-4 h-4 text-wsa-muted/60 shrink-0 transition-transform duration-300"
        :class="{ 'rotate-180': expanded }"
      />
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :style="{ gridTemplateRows: expanded ? '1fr' : '0fr' }"
    >
      <div class="overflow-hidden min-h-0">
        <div class="px-4 pb-4 border-t border-wsa-border/20">
          <MirroredEquipmentLayout
            :equipment="equipment"
            :render-url="renderUrl"
            :character-name="characterName"
            bare
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import CompactEquipmentIcon from '@/components/character/CompactEquipmentIcon.vue'
import MirroredEquipmentLayout from '@/components/character/MirroredEquipmentLayout.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import TalentSummaryStrip from '@/components/character/talents/TalentSummaryStrip.vue'
import { LEFT_COLUMN_SLOTS, RIGHT_COLUMN_SLOTS, WEAPON_SLOTS } from '@/utils/equipmentLayout'
import { groupEquipmentBySetId, getPcsFor } from '@/utils/equipmentSets'
import { CLASS_COLORS } from '@/utils/wowConstants'
import { useTalentTree } from '@/composables/useTalentTree'
import { computeTalentSummary } from '@/composables/useTalentSummary'
import { useWowheadRefresh } from '@/composables/useWowhead'
import type { EquipmentItem, CharacterTalents } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{
  equipment: EquipmentItem[]
  renderUrl?: string | null
  characterName: string
  classId: number
  specId: number | null
  treeId: number | null
  talents: CharacterTalents
  classic?: boolean
}>()

const expanded = ref(false)

const SKIP_SLOTS: Set<Slot> = new Set(['shirt', 'tabard'])
const ALL_SLOTS: Slot[] = [...LEFT_COLUMN_SLOTS, ...WEAPON_SLOTS, ...RIGHT_COLUMN_SLOTS]
  .filter((s) => !SKIP_SLOTS.has(s))

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

const { data: treeData } = useTalentTree(
  () => props.treeId,
  () => props.specId,
)

const topology = computed(() => treeData.value?.tree ?? null)

const activeHero = computed(() => {
  if (!topology.value) return null
  const pickedIds = new Set((props.talents.hero ?? []).map((t) => t.id))
  return topology.value.hero_trees.find((h) => h.nodes.some((n) => pickedIds.has(n.id))) ?? null
})

const heroTreeName = computed(() => activeHero.value?.name ?? null)

const summaryRefs = computed(() => {
  if (!topology.value) return []
  return computeTalentSummary(props.talents, topology.value)
})

const classColor = computed(() => CLASS_COLORS[props.classId] ?? null)

useWowheadRefresh(() => [props.equipment, topology.value, expanded.value])
</script>
