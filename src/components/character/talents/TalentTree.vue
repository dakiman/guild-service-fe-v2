<template>
  <div class="wsa-card">
    <div class="p-6">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="stats-card-title">Talents</h2>
        <div v-if="!classic" class="flex items-center gap-2">
          <a
            v-if="loadoutCode"
            class="wsa-btn"
            target="_blank"
            rel="noopener"
            :href="`https://www.wowhead.com/talent-calc/blizzard/${loadoutCode}`"
          >
            Talent Calculator ↗
          </a>
          <button
            v-if="loadoutCode"
            type="button"
            class="wsa-btn border-wsa-border"
            @click="copyLoadout"
          >
            {{ justCopied ? 'Copied!' : 'Copy loadout' }}
          </button>
        </div>
      </header>

      <!-- Classic short-circuit -->
      <p v-if="classic" class="text-wsa-disabled text-sm mt-3">
        Talent rendering for Classic characters is not supported.
      </p>

      <!-- Loading -->
      <div v-else-if="treeQuery.isLoading.value" class="mt-3 flex flex-col gap-3">
        <div class="flex gap-1.5">
          <div v-for="i in 5" :key="i" class="w-9 h-9 rounded-full bg-wsa-border/20 animate-pulse" />
        </div>
        <div class="h-72 rounded bg-wsa-border/20 animate-pulse" />
      </div>

      <!-- 404 / fetch error fallback: render today's flat-list -->
      <div v-else-if="treeUnavailable" class="mt-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section v-for="(label, key) in fallbackSections" :key="key">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-wsa-muted mb-2">
              {{ label }}
            </h3>
            <p v-if="!talents[key].length" class="text-wsa-disabled text-sm">None</p>
            <ul v-else class="flex flex-col gap-1">
              <li v-for="t in talents[key]" :key="`${key}-${t.id}`">
                <WowheadLink :spell-id="t.spell_id"> {{ t.rank }}/{{ t.max_rank }} </WowheadLink>
              </li>
            </ul>
          </section>
        </div>
        <p class="text-xs text-wsa-disabled mt-3">Full tree not available for this spec yet.</p>
      </div>

      <!-- Full tree -->
      <div v-else-if="topology" class="mt-3 flex flex-col gap-4">
        <TalentSummaryStrip :refs="summaryRefs" :class-color="classColor" />
        <div
          ref="treeWrapper"
          class="flex gap-6 min-w-0"
          :class="sideBySide ? 'flex-row justify-evenly' : 'flex-col items-center'"
        >
          <TalentTreeColumn
            title="Class"
            :nodes="topology.class_nodes"
            :edges="filterEdges(topology.edges, topology.class_nodes)"
            :picked="talents.class"
            :class-color="classColor"
            :cell-size="cellSize"
          />
          <TalentTreeColumn
            v-if="activeHero"
            :title="`Hero — ${activeHero.name}`"
            :nodes="activeHero.nodes"
            :edges="filterEdges(topology.edges, activeHero.nodes)"
            :picked="talents.hero"
            :class-color="classColor"
            :cell-size="cellSize"
            hoist-entry
          />
          <TalentTreeColumn
            title="Spec"
            :nodes="topology.spec_nodes"
            :edges="filterEdges(topology.edges, topology.spec_nodes)"
            :picked="talents.spec"
            :class-color="classColor"
            :cell-size="cellSize"
            hoist-entry
          />
        </div>
      </div>

      <!-- Empty (low-level char) -->
      <p v-else class="text-wsa-disabled text-sm mt-3">No talents picked yet.</p>

      <!-- PvP row (independent of tree fetch state) -->
      <section v-if="!classic && talents.pvp && talents.pvp.length" class="mt-6">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-wsa-muted mb-3">
          PvP Talents
        </h3>
        <ul class="flex flex-wrap gap-3">
          <li
            v-for="p in talents.pvp"
            :key="`pvp-${p.slot}`"
            class="flex items-center gap-3 bg-wsa-border/20 border border-wsa-border/30 rounded-lg px-3 py-2 hover:border-wsa-border/60 transition-colors"
          >
            <TalentNode
              :spell-id="p.spell_id"
              :is-picked="true"
              :is-choice="false"
              :class-color="classColor"
              :cell-size="36"
            />
            <div class="flex flex-col min-w-0">
              <span class="text-xs uppercase tracking-wide text-wsa-disabled">
                Slot {{ p.slot + 1 }}
              </span>
              <span class="text-sm font-medium leading-tight truncate">
                {{ p.name || `Spell ${p.spell_id}` }}
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize, useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import TalentSummaryStrip from './TalentSummaryStrip.vue'
import TalentTreeColumn from './TalentTreeColumn.vue'
import TalentNode from './TalentNode.vue'
import { useTalentTree } from '@/composables/useTalentTree'
import { computeTalentSummary } from '@/composables/useTalentSummary'
import { useWowheadRefresh } from '@/composables/useWowhead'
import { CLASS_COLORS } from '@/utils/wowConstants'
import type { CharacterTalents } from '@/types/character'
import type { TalentNode as TalentNodeT } from '@/types/talents'

const props = defineProps<{
  talents: CharacterTalents
  loadoutCode?: string | null
  classic?: boolean
  classId?: number | null
  treeId?: number | null
  specId?: number | null
}>()

const justCopied = ref(false)

const treeWrapper = ref<HTMLElement | null>(null)
const { width: wrapperWidth } = useElementSize(treeWrapper)
const isDesktop = useMediaQuery('(min-width: 768px)')

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
  return topology.value.hero_trees.find((h) => h.nodes.some((n) => pickedIds.has(n.id))) ?? null
})

const summaryRefs = computed(() => {
  if (!topology.value) return []
  return computeTalentSummary(props.talents, topology.value)
})

const classColor = computed(() => {
  if (!props.classId) return null
  return CLASS_COLORS[props.classId] ?? null
})

// Auto-fit cell size to the available container width so wide spec trees
// (~22 cols) don't introduce per-column horizontal scrollbars. Floors to a
// tappable minimum and caps so cells don't blow up on ultrawide. When even
// the minimum can't fit three columns side-by-side, stack vertically.
const COL_GAP_PX = 24 // tailwind gap-6
const CELL_MIN = 24
const CELL_MAX = 48
// Count unique columns rather than span — TalentTreeColumn packs sparse
// Blizzard coords (e.g. Sub Rogue class jumping 7 → 11) into a dense
// 0..N-1 sequence before render, so the column's true on-screen width is
// the unique count, not the raw max-min+1 span.
function colCount(nodes: TalentNodeT[] | undefined): number {
  if (!nodes || nodes.length === 0) return 0
  return new Set(nodes.map((n) => n.display_col)).size
}
const colCounts = computed(() => {
  if (!topology.value) return { classCols: 0, heroCols: 0, specCols: 0 }
  return {
    classCols: colCount(topology.value.class_nodes),
    heroCols: activeHero.value ? colCount(activeHero.value.nodes) : 0,
    specCols: colCount(topology.value.spec_nodes),
  }
})
// Side-by-side only if all three columns fit at CELL_MIN. Below that, stack.
const sideBySide = computed(() => {
  const w = wrapperWidth.value
  if (w === 0) return isDesktop.value
  const { classCols, heroCols, specCols } = colCounts.value
  const total = classCols + heroCols + specCols
  if (total === 0) return isDesktop.value
  const needed = total * CELL_MIN + 2 * COL_GAP_PX
  return w >= needed
})
const cellSize = computed(() => {
  const w = wrapperWidth.value
  if (!topology.value || w === 0) return isDesktop.value ? 44 : 36
  const { classCols, heroCols, specCols } = colCounts.value
  // Side-by-side fits total cols + 2 gaps; stacked fits the widest column
  // (since each column gets the full wrapper width).
  const denom = sideBySide.value
    ? classCols + heroCols + specCols
    : Math.max(classCols, heroCols, specCols)
  if (denom === 0) return sideBySide.value ? 44 : 36
  const usable = sideBySide.value ? Math.max(0, w - 2 * COL_GAP_PX) : w
  const fit = Math.floor(usable / denom)
  return Math.max(CELL_MIN, Math.min(CELL_MAX, fit))
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
