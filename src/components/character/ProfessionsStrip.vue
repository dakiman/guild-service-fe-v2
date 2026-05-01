<template>
  <div v-if="entries && entries.length > 0" class="flex flex-wrap gap-2">
    <div
      v-for="group in groupedProfessions"
      :key="group.professionId"
      class="w-full sm:w-auto"
    >
      <button
        type="button"
        class="ma-stat-pill w-full sm:w-auto py-2"
        :class="{ 'cursor-pointer hover:bg-base-200/60': group.tiers.length > 1, 'cursor-default': group.tiers.length <= 1 }"
        :aria-expanded="group.tiers.length > 1 ? isExpanded(group.professionId) : undefined"
        :aria-disabled="group.tiers.length <= 1 ? true : undefined"
        @click="toggle(group.professionId, group.tiers.length)"
      >
        <Hammer v-if="group.isPrimary" class="w-3.5 h-3.5 text-ma-gold" />
        <Wrench v-else class="w-3.5 h-3.5 text-ma-muted/70" />
        <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">
          {{ group.professionName }}
        </span>
        <span class="font-bold text-ma-gold tabular-nums">
          {{ group.latest.skill_points }}/{{ group.latest.max_skill_points }}
        </span>
        <ChevronRight
          v-if="group.tiers.length > 1"
          class="w-3.5 h-3.5 text-ma-muted/70 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded(group.professionId) }"
        />
      </button>

      <div
        v-if="group.tiers.length > 1 && isExpanded(group.professionId)"
        class="mt-1 ml-4 flex flex-col gap-1 pl-3 border-l border-ma-border/30"
      >
        <div
          v-for="tier in group.older"
          :key="`${group.professionId}-${tier.tier_name}`"
          class="flex items-center justify-between gap-3 text-xs"
        >
          <span class="text-ma-muted/70 truncate">
            {{ tier.tier_name || tier.bucketLabel }}
          </span>
          <span class="font-semibold text-ma-muted tabular-nums">
            {{ tier.skill_points }}/{{ tier.max_skill_points }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Profession } from '@/types/character'
import { ChevronRight, Hammer, Wrench } from 'lucide-vue-next'

const props = defineProps<{
  entries: Profession[] | null
}>()

interface ProfessionGroup {
  professionId: number
  professionName: string
  isPrimary: boolean
  tiers: TierWithBucket[]
  latest: TierWithBucket
  older: TierWithBucket[]
}

interface TierWithBucket extends Profession {
  bucketOrder: number
  bucketLabel: string
}

// Mirrors ReputationsList.vue's bucketOf() / Legacy fallback semantics:
// null expansion → display_order = 99 (sorts to the end).
function bucketOf(p: Profession): { order: number; label: string } {
  if (p.expansion) {
    return { order: p.expansion.display_order, label: p.expansion.name }
  }
  return { order: 99, label: 'Legacy' }
}

const groupedProfessions = computed<ProfessionGroup[]>(() => {
  if (!props.entries) return []

  const byId = new Map<number, ProfessionGroup>()
  for (const entry of props.entries) {
    const { order, label } = bucketOf(entry)
    const tier: TierWithBucket = { ...entry, bucketOrder: order, bucketLabel: label }

    let group = byId.get(entry.profession_id)
    if (!group) {
      group = {
        professionId: entry.profession_id,
        professionName: entry.profession_name,
        isPrimary: entry.is_primary,
        tiers: [],
        latest: tier,
        older: [],
      }
      byId.set(entry.profession_id, group)
    }
    group.tiers.push(tier)
  }

  // Sort tiers within each group: newest first (lowest display_order),
  // null/Legacy falls to the end via bucketOrder = 99.
  for (const group of byId.values()) {
    group.tiers.sort((a, b) => a.bucketOrder - b.bucketOrder)
    group.latest = group.tiers[0]
    group.older = group.tiers.slice(1)
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
    return a.professionName.localeCompare(b.professionName)
  })
})

const expanded = ref<Set<number>>(new Set())

function isExpanded(professionId: number): boolean {
  return expanded.value.has(professionId)
}

function toggle(professionId: number, tierCount: number): void {
  if (tierCount <= 1) return
  const next = new Set(expanded.value)
  if (next.has(professionId)) {
    next.delete(professionId)
  } else {
    next.add(professionId)
  }
  expanded.value = next
}
</script>
