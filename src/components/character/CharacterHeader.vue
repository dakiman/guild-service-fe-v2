<template>
  <div class="wsa-hero-banner">
    <div
      v-if="character.media?.inset"
      class="wsa-hero-banner__bg"
      :style="{ backgroundImage: `url(${character.media.inset})` }"
    />
    <div
      class="wsa-hero-banner__accent"
      :style="{ backgroundColor: classColor }"
    />

    <div class="wsa-hero-banner__content p-6 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="relative shrink-0 self-start">
        <div class="w-14 h-14 sm:w-24 sm:h-24 rounded-lg bg-wsa-card overflow-hidden ring-2 ring-wsa-border/30">
          <img
            v-if="character.media?.avatar"
            :src="character.media.avatar"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
        </div>
        <SpecIcon
          v-if="character.active_specialization_id"
          :spec-id="character.active_specialization_id"
          :fallback-class-id="character.class_id"
          :size="22"
          class="absolute -bottom-1 -right-1 rounded-full ring-2 ring-black/60 bg-wsa-card"
        />
      </div>

      <div class="flex flex-col gap-2 flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold text-wsa-text drop-shadow-md">{{ displayName }}</h1>
          <FactionBadge :faction="character.faction" />
          <button
            type="button"
            class="p-1.5 rounded-md text-wsa-muted/60 hover:text-wsa-gold transition-colors"
            title="Copy profile link"
            aria-label="Copy profile link"
            @click="onShareLink"
          >
            <Share2 class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="text-wsa-text/70">
            {{ displayRealm }} ({{ character.region.toUpperCase() }})
            <template v-if="character.guild && guildRoute">
              &middot;
              <RouterLink
                :to="guildRoute"
                class="text-wsa-gold hover:underline"
              >
                &lt;{{ displayGuildName(character.guild.name, character.guild.display_name) }}&gt;
              </RouterLink>
            </template>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="text-wsa-text/70">Level {{ character.level }}</span>
          <span class="text-wsa-text/70">{{ raceName }}</span>
          <span class="font-semibold" :style="{ color: classColor }">
            {{ className }}
          </span>
          <span v-if="relativeTime" class="inline-flex items-center gap-1 text-xs text-wsa-disabled">
            <Clock class="w-3 h-3" />
            {{ relativeTime }}
          </span>
        </div>

        <CharacterStatPills :character="character" :achievements-enabled="achievementsEnabled" class="mt-1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Share2, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import CharacterStatPills from '@/components/character/CharacterStatPills.vue'
import { CLASSES, CLASS_COLORS, RACES } from '@/utils/wowConstants'
import { displayGuildName, displayName as fmtName, displayRealm as fmtRealm } from '@/utils/display'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{
  character: CharacterResource
  achievementsEnabled?: boolean
  syncedAt?: string | null
}>()

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

const relativeTime = computed(() => {
  if (!props.syncedAt) return null
  const then = new Date(props.syncedAt).getTime()
  if (Number.isNaN(then)) return null
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
})

async function onShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Profile link copied')
  } catch {
    toast.error('Could not copy link')
  }
}
</script>
