<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="card-title">Talents</h2>
        <div v-if="!classic" class="flex items-center gap-2">
          <a
            v-if="loadoutCode"
            class="btn btn-sm btn-ghost"
            target="_blank"
            rel="noopener"
            :href="`https://www.wowhead.com/talent-calc/blizzard/${loadoutCode}`"
          >
            Talent Calculator ↗
          </a>
          <button
            v-if="loadoutCode"
            type="button"
            class="btn btn-sm btn-outline"
            @click="copyLoadout"
          >
            {{ justCopied ? 'Copied!' : 'Copy loadout' }}
          </button>
        </div>
      </header>

      <!-- Classic short-circuit -->
      <p v-if="classic" class="text-base-content/60 text-sm mt-3">
        Talent rendering for Classic characters is not supported.
      </p>

      <!-- Loading -->
      <div v-else-if="treeQuery.isLoading.value" class="mt-3 flex flex-col gap-3">
        <div class="flex gap-1.5">
          <div v-for="i in 5" :key="i" class="w-9 h-9 rounded-full bg-base-300 animate-pulse" />
        </div>
        <div class="h-72 rounded bg-base-300 animate-pulse" />
      </div>

      <!-- 404 / fetch error fallback: render today's flat-list -->
      <div v-else-if="treeUnavailable" class="mt-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section v-for="(label, key) in fallbackSections" :key="key">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
              {{ label }}
            </h3>
            <p v-if="!talents[key].length" class="text-base-content/60 text-sm">None</p>
            <ul v-else class="flex flex-col gap-1">
              <li v-for="t in talents[key]" :key="`${key}-${t.id}`">
                <WowheadLink :spell-id="t.spell_id">
                  {{ t.rank }}/{{ t.max_rank }}
                </WowheadLink>
              </li>
            </ul>
          </section>
        </div>
        <p class="text-xs text-base-content/50 mt-3">
          Full tree not available for this spec yet.
        </p>
      </div>

      <!-- Full tree -->
      <div v-else-if="topology" class="mt-3 flex flex-col gap-4">
        <TalentSummaryStrip :refs="summaryRefs" :class-color="classColor" />
        <div class="flex flex-col md:flex-row gap-6">
          <TalentTreeColumn
            title="Class"
            :nodes="topology.class_nodes"
            :edges="filterEdges(topology.edges, topology.class_nodes)"
            :picked="talents.class"
            :class-color="classColor"
          />
          <TalentTreeColumn
            v-if="activeHero"
            :title="`Hero — ${activeHero.name}`"
            :nodes="activeHero.nodes"
            :edges="filterEdges(topology.edges, activeHero.nodes)"
            :picked="talents.hero"
            :class-color="classColor"
          />
          <TalentTreeColumn
            title="Spec"
            :nodes="topology.spec_nodes"
            :edges="filterEdges(topology.edges, topology.spec_nodes)"
            :picked="talents.spec"
            :class-color="classColor"
          />
        </div>
      </div>

      <!-- Empty (low-level char) -->
      <p v-else class="text-base-content/60 text-sm mt-3">
        No talents picked yet.
      </p>

      <!-- PvP row (independent of tree fetch state) -->
      <section v-if="!classic && talents.pvp && talents.pvp.length" class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
          PvP
        </h3>
        <ul class="flex flex-wrap gap-2">
          <li v-for="p in talents.pvp" :key="`pvp-${p.slot}`">
            <WowheadLink :spell-id="p.spell_id">Slot {{ p.slot + 1 }}</WowheadLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import TalentSummaryStrip from './TalentSummaryStrip.vue'
import TalentTreeColumn from './TalentTreeColumn.vue'
import { useTalentTree } from '@/composables/useTalentTree'
import { computeTalentSummary } from '@/composables/useTalentSummary'
import { useWowheadRefresh } from '@/composables/useWowhead'
import { CLASS_COLORS } from '@/utils/wowConstants'
import type { CharacterTalents } from '@/types/character'

const props = defineProps<{
  talents: CharacterTalents
  loadoutCode?: string | null
  classic?: boolean
  classId?: number | null
  treeId?: number | null
  specId?: number | null
}>()

const justCopied = ref(false)

const fallbackSections = { class: 'Class', hero: 'Hero', spec: 'Spec' } as const

const treeQuery = useTalentTree(
  () => (props.classic ? null : props.treeId),
  () => (props.classic ? null : props.specId),
)

const topology = computed(() => treeQuery.data.value?.tree ?? null)

const treeUnavailable = computed(() => {
  if (props.classic) return false
  if (treeQuery.isLoading.value) return false
  if (treeQuery.isError.value) return true
  // Have ids but no topology resolved (e.g. row not yet synced in DB → 404).
  if (props.treeId && props.specId && topology.value === null) return true
  return false
})

const activeHero = computed(() => {
  if (!topology.value) return null
  const pickedIds = new Set((props.talents.hero ?? []).map((t) => t.id))
  return (
    topology.value.hero_trees.find((h) => h.nodes.some((n) => pickedIds.has(n.id))) ?? null
  )
})

const summaryRefs = computed(() => {
  if (!topology.value) return []
  return computeTalentSummary(props.talents, topology.value)
})

const classColor = computed(() => {
  if (!props.classId) return null
  return CLASS_COLORS[props.classId] ?? null
})

function filterEdges(edges: { from: number; to: number }[], nodes: { id: number }[]) {
  const ids = new Set(nodes.map((n) => n.id))
  return edges.filter((e) => ids.has(e.from) && ids.has(e.to))
}

useWowheadRefresh(() => [topology.value, summaryRefs.value])

async function copyLoadout() {
  if (!props.loadoutCode) return
  try {
    await navigator.clipboard.writeText(props.loadoutCode)
    justCopied.value = true
    toast.success("Loadout code copied — paste it into WoW's Import Loadout box")
    setTimeout(() => (justCopied.value = false), 2000)
  } catch {
    toast.error('Could not copy to clipboard')
  }
}
</script>
