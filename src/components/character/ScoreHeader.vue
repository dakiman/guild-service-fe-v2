<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CLASSES } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import { classSlug, specSlug } from '@/utils/leaderboardSlugs'
import { displayRealm as fmtRealm } from '@/utils/display'
import { relativeTime } from '@/utils/relativeTime'
import { seasonSegment } from '@/utils/seasonSlugs'
import { useSeasons } from '@/composables/usePveGameData'
import type { CharacterResource } from '@/types/character'

const props = defineProps<{ character: CharacterResource }>()

const { data: seasons } = useSeasons()
const currentSeasonName = computed(() => seasons.value?.seasons.find((s) => s.is_current)?.name ?? null)
const isClassic = computed(() => props.character.game_version === 'classic')

const rating = computed(() => props.character.mythic_plus_rating)
const rank = computed(() => props.character.rank)
const color = computed(() => rating.value?.color ?? 'rgb(var(--wsa-text))')
const n = (v: number) => v.toLocaleString('en-US')
const ratedThisSeason = computed(() => !!rating.value && rating.value.is_current)
const previousSeasonSeg = computed(() => (rating.value?.season_slug ? seasonSegment(rating.value.season_slug) : null))

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
const previous = computed(() => props.character.previous_rank)
const previousSeg = computed(() => (previous.value?.season_slug ? seasonSegment(previous.value.season_slug) : null))
const sameSeason = computed(
  () => !!previous.value?.season_slug && previous.value.season_slug === rating.value?.season_slug,
)
// Unrated this season and the previous rank is from the same season the rating
// is from → say that season once, on one line, instead of two blocks.
const mergedPrevious = computed(
  () => !ratedThisSeason.value && !!rating.value && !!previous.value && sameSeason.value,
)
</script>

<template>
  <div v-if="!isClassic" class="flex flex-col items-start sm:items-end gap-1 shrink-0" data-testid="score-header">
    <div class="text-[10px] uppercase tracking-wider text-wsa-muted">
      M+ Rating<template v-if="currentSeasonName"> · {{ currentSeasonName }}</template>
    </div>

    <template v-if="ratedThisSeason && rating">
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
    </template>

    <template v-else>
      <div class="text-4xl md:text-5xl font-bold leading-none text-wsa-muted" data-testid="score-value">—</div>
      <div v-if="rating" class="text-xs text-wsa-muted" data-testid="score-unrated">Not yet rated this season</div>
      <div v-if="rating" class="flex flex-wrap sm:justify-end gap-x-2 text-xs text-wsa-muted" data-testid="score-season">
        <RouterLink
          v-if="previousSeasonSeg"
          :to="{ name: 'leaderboards-season-region', params: { season: previousSeasonSeg, region: character.region } }"
          class="hover:text-wsa-gold hover:underline"
        >{{ rating.season_name ?? previous?.season_name ?? 'Earlier season' }}: {{ n(rating.rating) }}</RouterLink>
        <span v-else>{{ rating.season_name ?? previous?.season_name ?? 'Earlier season' }}: {{ n(rating.rating) }}</span>
        <template v-if="mergedPrevious && previous && previousSeg">
          <span aria-hidden="true">·</span>
          <RouterLink
            :to="{ name: 'leaderboards-season-region', params: { season: previousSeg, region: character.region } }"
            class="hover:text-wsa-gold hover:underline"
          >#{{ n(previous.region) }} {{ regionUpper }}</RouterLink>
          <template v-if="previous.realm != null">
            <span aria-hidden="true">·</span>
            <RouterLink
              :to="{ name: 'leaderboards-season-realm', params: { season: previousSeg, region: character.region, realm: character.realm } }"
              class="hover:text-wsa-gold hover:underline"
            >#{{ n(previous.realm) }} on {{ realmName }}</RouterLink>
          </template>
        </template>
      </div>
      <div v-else class="text-xs text-wsa-muted" data-testid="score-unrated">No M+ rating yet</div>
    </template>

    <div
      v-if="previous && previousSeg && !mergedPrevious"
      class="flex flex-wrap sm:justify-end gap-x-2 text-xs text-wsa-muted"
      data-testid="score-previous"
    >
      <span>{{ previous.season_name ?? 'Last season' }}</span>
      <span aria-hidden="true">·</span>
      <RouterLink
        :to="{ name: 'leaderboards-season-region', params: { season: previousSeg, region: character.region } }"
        class="hover:text-wsa-gold hover:underline"
      >#{{ n(previous.region) }} {{ regionUpper }}</RouterLink>
      <template v-if="previous.realm != null">
        <span aria-hidden="true">·</span>
        <RouterLink
          :to="{ name: 'leaderboards-season-realm', params: { season: previousSeg, region: character.region, realm: character.realm } }"
          class="hover:text-wsa-gold hover:underline"
        >#{{ n(previous.realm) }} on {{ realmName }}</RouterLink>
      </template>
    </div>
  </div>
</template>
