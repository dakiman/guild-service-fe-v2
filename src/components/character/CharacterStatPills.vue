<template>
  <div class="flex flex-wrap gap-2">
    <RouterLink
      :to="summaryRoute"
      class="wsa-stat-pill wsa-stat-pill-link"
      title="Equipment & gear"
    >
      <Shield class="w-4 h-4 text-wsa-gold" />
      <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">iLvl</span>
      <span class="font-bold text-wsa-gold tabular-nums">{{ character.equipped_item_level }}</span>
    </RouterLink>
    <RouterLink
      :to="mythicPlusRoute"
      class="wsa-stat-pill wsa-stat-pill-link"
      title="Mythic+ progression"
    >
      <Swords class="w-4 h-4 text-wsa-gold" />
      <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">M+</span>
      <span class="font-bold text-wsa-gold tabular-nums">{{ mythicRating }}</span>
    </RouterLink>
    <RouterLink
      v-if="raidProgressionLabel"
      :to="raidRoute"
      class="wsa-stat-pill wsa-stat-pill-link"
      :title="bestRaidProgression?.instanceName ?? undefined"
    >
      <Skull class="w-4 h-4 text-wsa-gold" />
      <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">Raid</span>
      <span class="font-bold text-wsa-gold tabular-nums">{{ raidProgressionLabel }}</span>
    </RouterLink>
    <component
      :is="achievementsEnabled ? RouterLink : 'div'"
      :to="achievementsEnabled ? achievementsRoute : undefined"
      class="wsa-stat-pill"
      :class="achievementsEnabled ? 'wsa-stat-pill-link' : ''"
      title="Achievements"
    >
      <Trophy class="w-4 h-4 text-wsa-gold" />
      <span class="text-[10px] uppercase tracking-wider text-wsa-muted/70">Achievements</span>
      <span class="font-bold text-wsa-gold tabular-nums">{{ formatNumber(character.achievement_points) }}</span>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Shield, Skull, Swords, Trophy } from 'lucide-vue-next'
import { useBestRaidProgression, shortDifficulty } from '@/composables/useBestRaidProgression'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{ character: CharacterResource; achievementsEnabled?: boolean }>()

const mythicRating = computed(() => {
  const rating = props.character.mythic_plus_rating?.rating
  return typeof rating === 'number' ? Math.round(rating).toLocaleString() : 'N/A'
})

const bestRaidProgression = useBestRaidProgression(() => props.character.raid_progress)

const raidProgressionLabel = computed<string | null>(() => {
  const c = bestRaidProgression.value
  if (!c) return null
  return `${c.killed}/${c.total} ${shortDifficulty(c.difficulty)}`
})

const routeParams = computed(() => ({
  region: props.character.region,
  realm: props.character.realm,
  name: props.character.name,
}))

const summaryRoute = computed(() => ({ name: 'character-summary', params: routeParams.value }))
const mythicPlusRoute = computed(() => ({ name: 'character-dungeons', params: routeParams.value }))
const raidRoute = computed(() => ({ name: 'character-raids', params: routeParams.value }))
const achievementsRoute = computed(() => ({
  name: 'character-achievements',
  params: routeParams.value,
}))

function formatNumber(n: number): string {
  return n.toLocaleString()
}
</script>

<style scoped>
.wsa-stat-pill-link {
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.wsa-stat-pill-link:hover {
  background-color: rgba(var(--wsa-card) / 0.85);
  border-color: rgba(var(--wsa-gold) / 0.5);
}
</style>
