<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import PageHeader from '@/components/layout/PageHeader.vue'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'
import TopRunsTable from '@/components/stats/TopRunsTable.vue'
import RealmCombobox, { type RealmPick } from '@/components/form/RealmCombobox.vue'
import LeaderboardTable from '@/components/leaderboards/LeaderboardTable.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import { fetchCharacterLeaderboard, fetchRealmRuns } from '@/api/leaderboards'
import { useMythicDungeons, useSeasons } from '@/composables/usePveGameData'
import { isAxiosError } from 'axios'
import { seasonSegment, seasonSlugFromSegment } from '@/utils/seasonSlugs'
import { CLASSES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import { classIdFromSlug, classSlug, specIdFromSlug, specSlug } from '@/utils/leaderboardSlugs'
import { displayRealm } from '@/utils/display'
import { relativeTime } from '@/utils/relativeTime'
import type { LeaderboardQuery, LeaderboardScope } from '@/types/leaderboards'
import type { Region } from '@/types/api'

const route = useRoute()
const router = useRouter()

const REGIONS: Region[] = ['eu', 'us']
const SCOPES: Array<{ key: LeaderboardScope; label: string }> = [
  { key: 'region', label: 'Region' },
  { key: 'realm', label: 'Realm' },
  { key: 'class', label: 'Class' },
  { key: 'spec', label: 'Spec' },
  { key: 'world', label: 'World' },
]

const SCOPE_BY_ROUTE: Record<string, LeaderboardScope> = {
  'leaderboards-world': 'world', 'leaderboards-season-world': 'world',
  'leaderboards-realm': 'realm', 'leaderboards-season-realm': 'realm',
  'leaderboards-class': 'class', 'leaderboards-season-class': 'class',
  'leaderboards-spec': 'spec', 'leaderboards-season-spec': 'spec',
}
const scope = computed<LeaderboardScope>(() => SCOPE_BY_ROUTE[String(route.name ?? '')] ?? 'region')
/** Registry slug from the URL segment; null = current season (plain routes). */
const seasonSlug = computed(() => (route.params.season ? seasonSlugFromSegment(route.params.season as string) : null))

const { data: seasonData } = useSeasons()
const seasons = computed(() => seasonData.value?.seasons ?? [])
const currentSeasonSlug = computed(() => seasons.value.find((s) => s.is_current)?.slug ?? null)
const region = computed<Region>(() => (scope.value === 'world' ? 'eu' : ((route.params.region as Region) ?? 'eu')))
const realm = computed(() => (route.params.realm as string | undefined) ?? null)
const classId = computed(() => (route.params.classSlug ? classIdFromSlug(route.params.classSlug as string) : null))
const specId = computed(() => (route.params.specSlug ? specIdFromSlug(route.params.specSlug as string) : null))

/** A class/spec slug that maps to nothing → not-found state, no fetch. */
const unknownSlug = computed(
  () => (scope.value === 'class' && classId.value === null) || (scope.value === 'spec' && specId.value === null),
)

const query = computed<LeaderboardQuery | null>(() => {
  if (unknownSlug.value) return null
  let q: LeaderboardQuery | null
  switch (scope.value) {
    case 'world': q = { scope: 'world' }; break
    case 'realm': q = realm.value ? { scope: 'realm', region: region.value, realm: realm.value } : null; break
    case 'class': q = { scope: 'class', region: region.value, class_id: classId.value! }; break
    case 'spec': q = { scope: 'spec', region: region.value, spec_id: specId.value! }; break
    default: q = { scope: 'region', region: region.value }
  }
  // Season only on season URLs so current-season query keys are unchanged.
  return q && seasonSlug.value ? { ...q, season: seasonSlug.value } : q
})

const board = useQuery({
  queryKey: computed(() => ['leaderboards', 'characters', query.value] as const),
  queryFn: ({ signal }) => fetchCharacterLeaderboard(query.value!, { signal }),
  enabled: computed(() => query.value !== null),
  staleTime: 300_000,
  refetchOnWindowFocus: false,
  // A 404 is deterministic (unknown season/realm) — retrying it just delays
  // the not-found state by three round trips for no benefit.
  retry: (count, err) => !(isAxiosError(err) && err.response?.status === 404) && count < 3,
})

/** Season-less URL, or the URL names the registry's current season, or the BE says so. */
const isCurrentSeason = computed(
  () => !seasonSlug.value || seasonSlug.value === currentSeasonSlug.value || board.data.value?.meta.season?.is_current === true,
)
const unknownSeason = computed(() => {
  const e = board.error.value
  return seasonSlug.value !== null && isAxiosError(e) && e.response?.status === 404 && e.response.data?.message === 'Unknown season'
})
const frozenDate = computed(() => {
  const iso = board.data.value?.meta.computed_at
  return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
})

const realmRuns = useQuery({
  queryKey: computed(() => ['leaderboards', 'realm-runs', region.value, realm.value] as const),
  queryFn: ({ signal }) => fetchRealmRuns(region.value, realm.value!, { signal }),
  enabled: computed(() => scope.value === 'realm' && realm.value !== null && isCurrentSeason.value),
  staleTime: 300_000,
  refetchOnWindowFocus: false,
})

const { data: dungeonData } = useMythicDungeons()
const dungeons = computed(() => dungeonData.value?.dungeons ?? [])

const rows = computed(() => board.data.value?.data ?? [])
const meta = computed(() => board.data.value?.meta ?? null)

// ── filter bar → routes ─────────────────────────────────────────────
function go(next: {
  scope?: LeaderboardScope; region?: Region; realm?: string | null
  classId?: number | null; specId?: number | null
  /** Registry slug; the current season (or null) goes back to the plain routes. */
  season?: string | null
}) {
  const s = next.scope ?? scope.value
  const r = next.region ?? region.value
  const c = next.classId === undefined ? classId.value : next.classId
  const sp = next.specId === undefined ? specId.value : next.specId
  // A region switch on a realm ladder can't carry the realm slug across —
  // it belongs to the old region and 404s in the new one. Treat a region
  // change as clearing the realm pick.
  const regionChanged = next.region !== undefined && next.region !== region.value
  const rl = next.realm === undefined ? (regionChanged && s === 'realm' ? null : realm.value) : next.realm
  const targetSeason = next.season === undefined ? seasonSlug.value : next.season
  const seg = targetSeason && targetSeason !== currentSeasonSlug.value ? seasonSegment(targetSeason) : null
  const name = (base: string) => (seg ? `leaderboards-season-${base}` : `leaderboards-${base}`)
  const params = (p: Record<string, string>) => (seg ? { season: seg, ...p } : p)
  switch (s) {
    case 'world': return router.push({ name: name('world'), params: params({}) })
    case 'realm': return rl
      ? router.push({ name: name('realm'), params: params({ region: r, realm: rl }) })
      : router.push({ name: name('region'), params: params({ region: r }) })
    case 'class': return router.push({ name: name('class'), params: params({ region: r, classSlug: classSlug(c ?? 9)! }) })
    case 'spec': {
      const id = sp ?? Object.keys(SPEC_TO_CLASS).map(Number).find((k) => SPEC_TO_CLASS[k] === (c ?? 9))!
      return router.push({ name: name('spec'), params: params({ region: r, specSlug: specSlug(id)! }) })
    }
    default: return router.push({ name: name('region'), params: params({ region: r }) })
  }
}

const realmPick = ref<RealmPick | null>(realm.value ? { slug: realm.value, region: region.value } : null)
watch(realmPick, (pick) => {
  if (pick && (pick.slug !== realm.value || pick.region !== region.value)) {
    go({ scope: 'realm', region: pick.region, realm: pick.slug })
  }
})
watch([realm, region], ([rl, r]) => {
  realmPick.value = rl ? { slug: rl, region: r } : null
})

const classOptions = Object.entries(CLASSES).map(([id, name]) => ({ id: Number(id), name })).sort((a, b) => a.name.localeCompare(b.name))
const specClassId = computed(() => (specId.value ? SPEC_TO_CLASS[specId.value] : classId.value) ?? 9)
const specOptions = computed(() =>
  Object.keys(SPEC_TO_CLASS).map(Number).filter((id) => SPEC_TO_CLASS[id] === specClassId.value && SPEC_NAMES[id])
    .map((id) => ({ id, name: SPEC_NAMES[id]! })),
)

const title = computed(() => {
  switch (scope.value) {
    case 'world': return 'World leaderboard'
    case 'realm': return realm.value ? `${displayRealm(realm.value, null)} leaderboard` : 'Realm leaderboard'
    case 'class': return `${classId.value ? CLASSES[classId.value] : 'Class'} leaderboard · ${region.value.toUpperCase()}`
    case 'spec': return `${specId.value ? SPEC_NAMES[specId.value] : 'Spec'} ${specId.value ? CLASSES[SPEC_TO_CLASS[specId.value]] : ''} leaderboard · ${region.value.toUpperCase()}`
    default: return `${region.value.toUpperCase()} leaderboard`
  }
})
const realmTitle = computed(() => (realm.value ? displayRealm(realm.value, null) : ''))
const realmRunsAge = computed(() => relativeTime(realmRuns.data.value?.meta.computed_at))
</script>

<template>
  <div class="space-y-4">
    <PageHeader icon="/brand/icon-mythicplus.jpg" title="Leaderboards">
      <template #right>
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-if="seasons.length"
            :value="seasonSlug ?? currentSeasonSlug ?? ''"
            class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
            aria-label="Season"
            @change="go({ season: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="s in seasons" :key="s.slug" :value="s.slug">{{ s.name }}</option>
          </select>
          <select
            v-if="scope !== 'world'"
            :value="region"
            class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
            aria-label="Region"
            @change="go({ region: ($event.target as HTMLSelectElement).value as Region })"
          >
            <option v-for="r in REGIONS" :key="r" :value="r">{{ r.toUpperCase() }}</option>
          </select>
          <div class="inline-flex rounded border border-wsa-border overflow-hidden" role="tablist">
            <button
              v-for="s in SCOPES"
              :key="s.key"
              type="button"
              role="tab"
              :aria-selected="scope === s.key"
              :data-testid="`scope-${s.key}`"
              class="px-2 py-1 text-xs"
              :class="scope === s.key ? 'bg-wsa-muted/20 text-wsa-heading' : 'text-wsa-muted hover:text-wsa-heading'"
              @click="go({ scope: s.key })"
            >{{ s.label }}</button>
          </div>
        </div>
      </template>
    </PageHeader>

    <div v-if="scope === 'realm'" class="max-w-sm">
      <RealmCombobox v-model="realmPick" placeholder="Pick a realm" aria-label="Realm" />
    </div>
    <div v-else-if="scope === 'class' || scope === 'spec'" class="flex flex-wrap gap-2">
      <select
        :value="scope === 'class' ? classId : specClassId"
        class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
        aria-label="Class"
        @change="go({ classId: Number(($event.target as HTMLSelectElement).value), specId: null })"
      >
        <option v-for="c in classOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select
        v-if="scope === 'spec'"
        :value="specId"
        class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
        aria-label="Spec"
        @change="go({ specId: Number(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="s in specOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <section v-if="unknownSlug || unknownSeason" class="wsa-card p-6 text-center text-wsa-muted">
      <p class="font-semibold text-wsa-heading">{{ unknownSeason ? 'No such season' : 'No such leaderboard' }}</p>
      <p class="text-sm">{{ unknownSeason ? "That season isn't in our registry." : "That class or spec isn't one we rank." }}</p>
    </section>

    <section v-else class="wsa-card p-4 space-y-3">
      <h2 class="text-lg font-bold text-wsa-heading">
        {{ title }}
        <span v-if="!isCurrentSeason && meta?.season" class="ml-2 text-sm font-normal text-wsa-muted">{{ meta.season.name }}</span>
      </h2>
      <p v-if="scope === 'realm' && !realm" class="text-sm text-wsa-muted">Pick a realm to see its ladder.</p>
      <div v-else-if="board.isPending.value" class="h-40 animate-pulse rounded bg-wsa-border/20" />
      <ErrorState
        v-else-if="board.isError.value"
        compact
        title="Couldn't load this leaderboard"
        :error="board.error.value"
        @retry="board.refetch()"
      />
      <LeaderboardTable
        v-else
        :rows="rows"
        :empty-text="isCurrentSeason ? undefined : 'No standings were recorded for this season.'"
      />
      <template v-if="isCurrentSeason">
        <CoverageStamp variant="crawled" :timestamp="meta?.computed_at" :count="meta?.population" />
        <p v-if="meta?.computed_at" class="text-[10px] text-wsa-disabled">Ranks computed nightly from Blizzard's own M+ rating · top 100 shown</p>
      </template>
      <p v-else-if="meta" class="text-[10px] text-wsa-disabled" data-testid="frozen-stamp">
        {{ meta.season?.name ?? 'This season' }} · final standings as of the last nightly<template v-if="frozenDate"> ({{ frozenDate }})</template>
        · among {{ (meta.population ?? 0).toLocaleString() }} characters tracked by Peon · top 100 shown
      </p>
    </section>

    <section v-if="scope === 'realm' && realm && isCurrentSeason" class="wsa-card p-4 space-y-3">
      <h2 class="text-lg font-bold text-wsa-heading">Top runs this week on {{ realmTitle }}</h2>
      <div v-if="realmRuns.isPending.value" class="h-24 animate-pulse rounded bg-wsa-border/20" />
      <TopRunsTable v-else-if="realmRuns.data.value?.data.length" :runs="realmRuns.data.value.data" :rank-offset="0" :dungeons="dungeons" />
      <p v-else class="py-4 text-center text-sm text-wsa-disabled">No runs recorded yet this week.</p>
      <p v-if="realmRunsAge" class="text-[10px] text-wsa-disabled">
        From Blizzard's official M+ leaderboard for this realm · updated {{ realmRunsAge }}
      </p>
    </section>
  </div>
</template>
