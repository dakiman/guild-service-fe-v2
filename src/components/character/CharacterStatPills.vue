<template>
  <div class="flex flex-wrap gap-2">
    <div class="ma-stat-pill">
      <Shield class="w-4 h-4 text-ma-gold" />
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">iLvl</span>
      <span class="font-bold text-ma-gold tabular-nums">{{ character.equipped_item_level }}</span>
    </div>
    <div class="ma-stat-pill">
      <Swords class="w-4 h-4 text-ma-gold" />
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">M+</span>
      <span class="font-bold text-ma-gold tabular-nums">{{ mythicRating }}</span>
    </div>
    <div class="ma-stat-pill">
      <Trophy class="w-4 h-4 text-ma-gold" />
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Achievements</span>
      <span class="font-bold text-ma-gold tabular-nums">{{ formatNumber(character.achievement_points) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Swords, Trophy } from 'lucide-vue-next'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{ character: CharacterResource }>()

const mythicRating = computed(() => {
  const rating = props.character.mythic_plus_rating?.rating
  return typeof rating === 'number' ? Math.round(rating).toLocaleString() : 'N/A'
})

function formatNumber(n: number): string {
  return n.toLocaleString()
}
</script>
