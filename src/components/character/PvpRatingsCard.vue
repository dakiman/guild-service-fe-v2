<template>
  <div class="ma-card p-4">
    <h3 class="ma-text-heading text-sm uppercase tracking-wider mb-3">PvP</h3>
    <div v-if="!brackets || brackets.length === 0" class="text-ma-muted/70 text-sm">
      No ranked PvP this season.
    </div>
    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="bracket in sortedBrackets"
        :key="bracket.bracket"
        class="flex items-center justify-between text-sm"
      >
        <span class="text-ma-text">{{ formatBracket(bracket.bracket) }}</span>
        <div class="flex items-center gap-3">
          <span class="text-ma-gold tabular-nums font-bold">{{ bracket.rating }}</span>
          <span class="text-ma-muted/70 tabular-nums text-xs">
            {{ bracket.season.won }}–{{ bracket.season.lost }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PvpBracketStats } from '@/types/character'

const props = defineProps<{
  brackets: PvpBracketStats[] | null
}>()

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
  return slug
}
</script>
