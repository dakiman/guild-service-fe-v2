<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CLASSES } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import { classSlug, specSlug } from '@/utils/leaderboardSlugs'
import { displayRealm as fmtRealm } from '@/utils/display'
import { relativeTime } from '@/utils/relativeTime'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{ character: CharacterResource }>()

const rating = computed(() => props.character.mythic_plus_rating)
const rank = computed(() => props.character.rank)
const color = computed(() => rating.value?.color ?? 'rgb(var(--wsa-text))')
const n = (v: number) => v.toLocaleString('en-US')

const regionUpper = computed(() => props.character.region.toUpperCase())
const realmName = computed(() => fmtRealm(props.character.realm, props.character.display_realm))
const className = computed(() => CLASSES[props.character.class_id] ?? 'Class')
const specName = computed(() =>
  props.character.active_specialization_id ? (SPEC_NAMES[props.character.active_specialization_id] ?? null) : null,
)
const cSlug = computed(() => classSlug(props.character.class_id))
const sSlug = computed(() =>
  props.character.active_specialization_id ? specSlug(props.character.active_specialization_id) : null,
)
const stamp = computed(() => relativeTime(rank.value?.computed_at))
</script>

<template>
  <div v-if="rating" class="flex flex-col items-start sm:items-end gap-1 shrink-0" data-testid="score-header">
    <div class="text-[10px] uppercase tracking-wider text-wsa-muted">M+ Rating</div>
    <div
      class="text-4xl md:text-5xl font-bold tabular-nums leading-none drop-shadow-md"
      :style="{ color }"
      data-testid="score-value"
    >
      {{ n(rating.rating) }}
    </div>

    <template v-if="rank">
      <div class="flex flex-wrap sm:justify-end gap-x-2 text-sm text-wsa-text/80">
        <RouterLink
          v-if="rank.realm != null"
          :to="{ name: 'leaderboards-realm', params: { region: character.region, realm: character.realm } }"
          class="hover:text-wsa-gold hover:underline"
        >#{{ n(rank.realm) }} on {{ realmName }}</RouterLink>
        <span v-if="rank.realm != null" aria-hidden="true">·</span>
        <RouterLink
          :to="{ name: 'leaderboards-region', params: { region: character.region } }"
          class="hover:text-wsa-gold hover:underline"
        >#{{ n(rank.region) }} {{ regionUpper }}</RouterLink>
        <span v-if="rank.percentile != null" aria-hidden="true">·</span>
        <span v-if="rank.percentile != null">top {{ rank.percentile }}% of tracked characters</span>
      </div>
      <div class="flex flex-wrap sm:justify-end gap-x-2 text-xs text-wsa-muted">
        <RouterLink
          v-if="cSlug"
          :to="{ name: 'leaderboards-class', params: { region: character.region, classSlug: cSlug } }"
          class="hover:text-wsa-gold hover:underline"
        >#{{ n(rank.class) }} {{ className }}</RouterLink>
        <template v-if="rank.spec != null && sSlug && specName">
          <span aria-hidden="true">·</span>
          <RouterLink
            :to="{ name: 'leaderboards-spec', params: { region: character.region, specSlug: sSlug } }"
            class="hover:text-wsa-gold hover:underline"
          >#{{ n(rank.spec) }} {{ specName }}</RouterLink>
        </template>
      </div>
      <div v-if="stamp" class="text-[10px] text-wsa-disabled">ranks computed nightly · {{ stamp }}</div>
    </template>
    <div v-else class="text-xs text-wsa-disabled">not yet ranked this season</div>
  </div>
</template>
