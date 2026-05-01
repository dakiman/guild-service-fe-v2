<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="avatar">
        <div class="w-24 h-24 rounded-lg bg-base-300">
          <img
            v-if="character.media?.avatar"
            :src="character.media.avatar"
            :alt="displayName"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 flex-1">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold">{{ displayName }}</h1>
          <FactionBadge :faction="character.faction" />
        </div>

        <p class="text-base-content/70">
          {{ displayRealm }} ({{ character.region.toUpperCase() }})
        </p>

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="font-semibold" :style="{ color: classColor }">
            {{ className }}
          </span>
          <span class="text-base-content/70">{{ raceName }}</span>
          <span class="text-base-content/70">Level {{ character.level }}</span>
          <span v-if="character.active_specialization" class="badge badge-outline">
            {{ character.active_specialization }}
          </span>
        </div>

        <div class="stats stats-horizontal bg-base-100 shadow mt-2 w-fit">
          <div class="stat py-2 px-4">
            <div class="stat-title text-xs">Equipped iLvl</div>
            <div class="stat-value text-xl">{{ character.equipped_item_level }}</div>
          </div>
          <div class="stat py-2 px-4">
            <div class="stat-title text-xs">Average iLvl</div>
            <div class="stat-value text-xl">{{ character.average_item_level }}</div>
          </div>
          <div class="stat py-2 px-4">
            <div class="stat-title text-xs">Achievements</div>
            <div class="stat-value text-xl">{{ character.achievement_points }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { CLASSES, CLASS_COLORS, RACES } from '@/utils/wowConstants'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{ character: CharacterResource }>()

const className = computed(() => CLASSES[props.character.class_id] ?? 'Unknown')
const classColor = computed(() => CLASS_COLORS[props.character.class_id] ?? '#888')
const raceName = computed(() => RACES[props.character.race_id] ?? 'Unknown')

const displayName = computed(() => {
  const n = props.character.name
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : n
})

const displayRealm = computed(() =>
  props.character.realm
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' '),
)
</script>
