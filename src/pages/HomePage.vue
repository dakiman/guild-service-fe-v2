<template>
  <div class="p-4 max-w-6xl mx-auto">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-wsa-heading">WoW Service</h1>
      <p class="text-wsa-muted mt-1">
        Browse World of Warcraft guilds and characters across regions and realms.
      </p>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="wsa-card">
        <h2 class="stats-card-title mb-3">Find a character</h2>
        <LookupForm kind="character" @submit="onCharacterSubmit" @pick="onCharacterSubmit" />
      </div>
      <div class="wsa-card">
        <h2 class="stats-card-title mb-3">Find a guild</h2>
        <LookupForm kind="guild" @submit="onGuildSubmit" @pick="onGuildSubmit" />
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

        <GuildSummaryCard
          title="Most popular"
          :items="guildsQuery.data.value?.most_popular"
          :is-pending="guildsQuery.isPending.value"
          :is-error="guildsQuery.isError.value"
          :error="guildsQuery.error.value"
          :on-retry="() => guildsQuery.refetch()"
          empty-message="No popular guilds yet."
        />
      </section>

      <section aria-labelledby="characters-heading" class="space-y-4">
        <h2 id="characters-heading" class="text-xl font-semibold text-wsa-heading">Characters</h2>

        <div class="wsa-card">
          <h3 class="stats-card-title mb-3">Recently searched</h3>

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
              </router-link>
            </li>
          </ul>

          <p v-else class="text-wsa-disabled text-sm italic">No recent character searches.</p>
        </div>

        <div class="wsa-card">
          <h3 class="stats-card-title mb-3">Most popular</h3>

          <div v-if="charactersQuery.isPending.value" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-6 w-full rounded bg-wsa-border/20 animate-pulse"></div>
          </div>

          <ErrorState
            v-else-if="charactersQuery.isError.value"
            :error="charactersQuery.error.value"
            @retry="charactersQuery.refetch()"
          />

          <ul v-else-if="charactersQuery.data.value?.most_popular.length" class="space-y-1">
            <li v-for="c in charactersQuery.data.value.most_popular" :key="c.id">
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
              </router-link>
            </li>
          </ul>

          <p v-else class="text-wsa-disabled text-sm italic">No popular characters yet.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { fetchPopularGuilds } from '@/api/guilds'
import { fetchPopularCharacters } from '@/api/characters'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LookupForm from '@/components/form/LookupForm.vue'
import GuildSummaryCard from '@/components/guild/GuildSummaryCard.vue'
import { displayName, displayRealm } from '@/utils/display'
import type { Region } from '@/types/api'

const router = useRouter()

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
