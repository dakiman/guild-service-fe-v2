<template>
  <div class="max-w-6xl mx-auto">
    <img
      src="/brand/hero-banner.jpg"
      alt=""
      aria-hidden="true"
      class="w-full h-28 sm:h-36 object-cover rounded-lg border-2 border-wsa-border mb-6"
    />
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="wsa-card">
        <h2 class="wsa-text-heading text-[15px] mb-3">Find a character</h2>
        <LookupForm
          ref="characterForm"
          :key="formKey"
          kind="character"
          :initial-name="initialCharacterName || undefined"
          @submit="onCharacterSubmit"
          @pick="onCharacterSubmit"
        />
      </div>
      <div class="wsa-card">
        <h2 class="wsa-text-heading text-[15px] mb-3">Find a guild</h2>
        <LookupForm
          :key="formKey"
          kind="guild"
          :initial-name="initialGuildName || undefined"
          @submit="onGuildSubmit"
          @pick="onGuildSubmit"
        />
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section aria-labelledby="guilds-heading" class="space-y-4">
        <h2 id="guilds-heading" class="text-xl font-semibold text-wsa-heading">Guilds</h2>

        <GuildSummaryCard
          title="Recently searched"
          :items="guildsQuery.data.value?.recently_searched"
          :is-pending="guildsQuery.isPending.value"
          :is-error="guildsQuery.isError.value"
          :error="guildsQuery.error.value"
          :on-retry="() => guildsQuery.refetch()"
          empty-message="No recent guild searches."
        />

        <router-link
          :to="{ name: 'guild-search' }"
          class="inline-flex items-center gap-1 text-sm text-wsa-muted hover:text-wsa-heading transition-colors"
        >
          Browse guild stats <ArrowRight class="h-4 w-4" />
        </router-link>
      </section>

      <section aria-labelledby="characters-heading" class="space-y-4">
        <h2 id="characters-heading" class="text-xl font-semibold text-wsa-heading">Characters</h2>

        <div class="wsa-card">
          <h3 class="wsa-text-heading text-[15px] mb-3">Recently searched</h3>

          <div v-if="charactersQuery.isPending.value" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-6 w-full rounded bg-wsa-border/20 animate-pulse"></div>
          </div>

          <ErrorState
            v-else-if="charactersQuery.isError.value"
            :error="charactersQuery.error.value"
            @retry="charactersQuery.refetch()"
          />

          <ul
            v-else-if="charactersQuery.data.value?.recently_searched.length"
            class="space-y-1"
          >
            <li v-for="c in charactersQuery.data.value.recently_searched" :key="c.id">
              <router-link
                :to="{
                  name: 'character-detail',
                  params: { region: c.region, realm: c.realm, name: c.name },
                }"
                class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-black/20 transition-colors"
              >
                <ClassIcon :class-id="c.class_id" />
                <span class="font-bold text-wsa-text">{{ displayName(c.name, c.display_name) }}</span>
                <span class="text-wsa-muted text-sm">
                  · {{ displayRealm(c.realm, c.display_realm) }} ({{ c.region.toUpperCase() }}) · L{{ c.level }}
                </span>
                <RatingChip :rating="c.mythic_plus_rating" :region-rank="c.region_rank" :is-current="c.mythic_plus_rating?.is_current ?? true" :season-name="c.mythic_plus_rating?.season_name" class="ml-auto" />
              </router-link>
            </li>
          </ul>

          <p v-else class="text-wsa-disabled text-sm italic">No recent character searches.</p>
        </div>

        <router-link
          :to="{ name: 'character-search' }"
          class="inline-flex items-center gap-1 text-sm text-wsa-muted hover:text-wsa-heading transition-colors"
        >
          Browse character stats <ArrowRight class="h-4 w-4" />
        </router-link>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { fetchPopularGuilds } from '@/api/guilds'
import { fetchPopularCharacters } from '@/api/characters'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import RatingChip from '@/components/wow/RatingChip.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LookupForm from '@/components/form/LookupForm.vue'
import GuildSummaryCard from '@/components/guild/GuildSummaryCard.vue'
import { displayName, displayRealm } from '@/utils/display'
import type { Region } from '@/types/api'

const router = useRouter()
const route = useRoute()

// Nav quick-search hand-off: `/?q=<name>` seeds the character form once (on mount AND on
// an in-place route update, since HomePage is reused when already on `/`), then the param
// is stripped so a refresh doesn't re-apply it.
const initialCharacterName = ref('')
const initialGuildName = ref('')
const formKey = ref(0)
const characterForm = ref<{ focusRealm: () => void } | null>(null)

async function consumeQ(query: typeof route.query) {
  if (!('q' in query)) return
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  if (q) {
    initialCharacterName.value = q
    initialGuildName.value = q
    formKey.value++
  }
  await router.replace({ name: 'home' })
  await nextTick()
  if (q) characterForm.value?.focusRealm()
}

onMounted(() => consumeQ(route.query))
// `onBeforeRouteUpdate` fires *before* `route` itself updates, so read the incoming
// query off `to` directly rather than the (still-stale) reactive `route.query`.
onBeforeRouteUpdate((to) => {
  if ('q' in to.query) consumeQ(to.query)
})

function onCharacterSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'character-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}

function onGuildSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'guild-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}

const guildsQuery = useQuery({
  queryKey: ['popular', 'guilds'] as const,
  queryFn: ({ signal }) => fetchPopularGuilds({ signal }),
  staleTime: 60_000,
  refetchOnWindowFocus: false,
})

const charactersQuery = useQuery({
  queryKey: ['popular', 'characters'] as const,
  queryFn: ({ signal }) => fetchPopularCharacters({ signal }),
  staleTime: 60_000,
  refetchOnWindowFocus: false,
})
</script>
