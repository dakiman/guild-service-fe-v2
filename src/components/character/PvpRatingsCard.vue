<template>
  <div class="wsa-card p-4">
    <h3 class="wsa-text-heading text-sm uppercase tracking-wider mb-3">PvP</h3>
    <div v-if="isSyncingSlice" class="flex items-center gap-2 text-wsa-muted/70 text-sm">
      <span class="wsa-spinner !w-3 !h-3 inline-block" />
      Syncing PvP data…
    </div>
    <div v-else-if="!brackets || brackets.length === 0" class="text-wsa-muted/70 text-sm">
      No ranked PvP this season.
    </div>
    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="bracket in sortedBrackets"
        :key="bracket.bracket"
        class="flex items-center justify-between text-sm"
      >
        <span class="text-wsa-text">{{ formatBracket(bracket.bracket) }}</span>
        <div class="flex items-center gap-3">
          <span class="text-wsa-gold tabular-nums font-bold">{{ bracket.rating }}</span>
          <span class="text-wsa-muted/70 tabular-nums text-xs">
            {{ bracket.season.won }}–{{ bracket.season.lost }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterContext } from '@/composables/useCharacterContext'
import type { PvpBracketStats } from '@/types/character'

const props = defineProps<{
  brackets: PvpBracketStats[] | null
}>()

const { freshness } = useCharacterContext()
const isSyncingSlice = computed(() => freshness.value.pvp === 'never_synced')

const sortedBrackets = computed(() =>
  [...(props.brackets ?? [])].sort((a, b) => b.rating - a.rating)
)

function formatBracket(slug: string): string {
  if (slug === '2v2') return '2v2'
  if (slug === '3v3') return '3v3'
  if (slug === 'rbg') return 'RBG'
  if (slug.startsWith('blitz-')) {
    const parts = slug.slice(6).split('-')
    return 'Blitz ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  if (slug.startsWith('shuffle-')) {
    const parts = slug.slice(8).split('-')
    return 'Shuffle ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return slug
}
</script>
