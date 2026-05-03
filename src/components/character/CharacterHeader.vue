<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="avatar shrink-0">
        <div class="w-14 h-14 sm:w-24 sm:h-24 rounded-lg bg-base-300">
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
          <template v-if="character.guild && guildRoute">
            &middot;
            <RouterLink
              :to="guildRoute"
              class="text-ma-gold hover:underline"
            >
              &lt;{{ displayGuildName(character.guild.name, character.guild.display_name) }}&gt;
            </RouterLink>
          </template>
        </p>

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="font-semibold" :style="{ color: classColor }">
            {{ className }}
          </span>
          <span class="text-base-content/70">{{ raceName }}</span>
          <span class="text-base-content/70">Level {{ character.level }}</span>
          <span v-if="character.active_specialization" class="inline-flex items-center gap-1.5">
            <SpecIcon
              :spec-id="character.active_specialization_id"
              :fallback-class-id="character.class_id"
              :size="20"
            />
            <span>{{ character.active_specialization }}</span>
          </span>
        </div>

        <CharacterStatPills :character="character" class="mt-1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import CharacterStatPills from '@/components/character/CharacterStatPills.vue'
import { CLASSES, CLASS_COLORS, RACES } from '@/utils/wowConstants'
import { displayGuildName, displayName as fmtName, displayRealm as fmtRealm } from '@/utils/display'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{ character: CharacterResource }>()

const className = computed(() => CLASSES[props.character.class_id] ?? 'Unknown')
const classColor = computed(() => CLASS_COLORS[props.character.class_id] ?? '#888')
const raceName = computed(() => RACES[props.character.race_id] ?? 'Unknown')

const displayName = computed(() => fmtName(props.character.name, props.character.display_name))
const displayRealm = computed(() => fmtRealm(props.character.realm, props.character.display_realm))

const guildRoute = computed(() => {
  const g = props.character.guild
  if (!g) return null
  return {
    name: 'guild-detail',
    params: { region: g.region, realm: g.realm, name: g.name },
  }
})
</script>
