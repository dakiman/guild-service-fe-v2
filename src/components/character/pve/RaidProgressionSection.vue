<template>
  <section class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h2 class="ma-text-heading text-xl">Raid Progression</h2>
      <button
        v-if="legacyExpansions.length > 0"
        type="button"
        class="text-sm text-ma-violet-soft hover:text-ma-gold transition-colors"
        @click="showLegacy = !showLegacy"
      >
        {{ showLegacy ? 'Hide legacy raids' : 'Show legacy raids' }}
      </button>
    </header>

    <div v-if="isLoading" class="ma-card p-6 text-sm text-ma-muted/70">
      Loading raid data…
    </div>
    <div v-else-if="isError" class="ma-card p-6 text-sm text-red-300">
      Couldn't load raid data. <button type="button" class="underline" @click="() => refetch()">Retry</button>
    </div>
    <div v-else-if="!latestExpansion" class="ma-card p-6 text-sm text-ma-muted/70">
      No raid data available.
    </div>
    <template v-else>
      <RaidInstanceCard
        v-for="instance in latestExpansion.instances"
        :key="instance.id"
        :instance="instance"
        :progress="raidProgress"
      />

      <template v-if="showLegacy">
        <div
          v-for="exp in legacyExpansions"
          :key="exp.expansion.id"
          class="flex flex-col gap-3"
        >
          <h3 class="ma-text-heading text-base text-ma-muted/80 mt-2">{{ exp.expansion.name }}</h3>
          <RaidInstanceCard
            v-for="instance in exp.instances"
            :key="instance.id"
            :instance="instance"
            :progress="raidProgress"
          />
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RaidInstanceCard from './RaidInstanceCard.vue'
import { useRaidInstances } from '@/composables/usePveGameData'
import type { RaidEncounterProgress } from '@/types/character'
import type { RaidInstanceGameData } from '@/types/gameData'

defineProps<{
  raidProgress: RaidEncounterProgress[] | null
}>()

const { data, isLoading, isError, refetch } = useRaidInstances()
const showLegacy = ref(false)

interface ExpansionGroup {
  expansion: RaidInstanceGameData['expansion']
  instances: RaidInstanceGameData[]
}

const groupedByExpansion = computed<ExpansionGroup[]>(() => {
  const instances = data.value?.instances ?? []
  const map = new Map<number, ExpansionGroup>()
  for (const instance of instances) {
    const existing = map.get(instance.expansion.id)
    if (existing) {
      existing.instances.push(instance)
    } else {
      map.set(instance.expansion.id, {
        expansion: instance.expansion,
        instances: [instance],
      })
    }
  }
  // Sort within each expansion by display_order asc.
  for (const group of map.values()) {
    group.instances.sort((a, b) => a.display_order - b.display_order)
  }
  // Sort expansions by display_order DESC (latest first).
  return Array.from(map.values()).sort(
    (a, b) => b.expansion.display_order - a.expansion.display_order,
  )
})

const latestExpansion = computed<ExpansionGroup | null>(() => groupedByExpansion.value[0] ?? null)
const legacyExpansions = computed<ExpansionGroup[]>(() => groupedByExpansion.value.slice(1))
</script>
