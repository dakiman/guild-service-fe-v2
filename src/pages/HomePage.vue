<template>
  <div class="p-4 max-w-6xl mx-auto">
    <header class="mb-6">
      <h1 class="text-3xl font-bold">WoW Service</h1>
      <p class="text-base-content/70 mt-1">
        Browse World of Warcraft guilds and characters across regions and realms.
      </p>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4">
          <h2 class="card-title text-base">Find a character</h2>
          <LookupForm kind="character" @submit="onCharacterSubmit" />
        </div>
      </div>
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4">
          <h2 class="card-title text-base">Find a guild</h2>
          <LookupForm kind="guild" @submit="onGuildSubmit" />
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section aria-labelledby="guilds-heading" class="space-y-4">
        <h2 id="guilds-heading" class="text-xl font-semibold">Guilds</h2>

        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title text-base">Recently searched</h3>

            <div v-if="guildsQuery.isPending.value" class="space-y-2 mt-2">
              <div v-for="i in 3" :key="i" class="skeleton h-6 w-full"></div>
            </div>

            <ErrorState
              v-else-if="guildsQuery.isError.value"
              :error="guildsQuery.error.value"
              @retry="guildsQuery.refetch()"
            />

            <ul v-else-if="guildsQuery.data.value?.recently_searched.length" class="space-y-1 mt-2">
              <li v-for="g in guildsQuery.data.value.recently_searched" :key="g.id">
                <router-link
                  :to="{
                    name: 'guild-detail',
                    params: { region: g.region, realm: g.realm, name: g.name },
                  }"
                  class="flex items-center gap-2 py-1 px-2 rounded hover:bg-base-300 transition-colors"
                >
                  <FactionBadge v-if="g.faction" :faction="g.faction" />
                  <span class="font-bold">{{ displayName(g.name, g.display_name) }}</span>
                  <span class="text-base-content/70 text-sm">
                    on {{ displayRealm(g.realm, g.display_realm) }} ({{ g.region.toUpperCase() }})
                  </span>
                </router-link>
              </li>
            </ul>

            <p v-else class="text-base-content/60 text-sm mt-2">No recent guild searches.</p>
          </div>
        </div>

        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title text-base">Most popular</h3>

            <div v-if="guildsQuery.isPending.value" class="space-y-2 mt-2">
              <div v-for="i in 3" :key="i" class="skeleton h-6 w-full"></div>
            </div>

            <ErrorState
              v-else-if="guildsQuery.isError.value"
              :error="guildsQuery.error.value"
              @retry="guildsQuery.refetch()"
            />

            <ul v-else-if="guildsQuery.data.value?.most_popular.length" class="space-y-1 mt-2">
              <li v-for="g in guildsQuery.data.value.most_popular" :key="g.id">
                <router-link
                  :to="{
                    name: 'guild-detail',
                    params: { region: g.region, realm: g.realm, name: g.name },
                  }"
                  class="flex items-center gap-2 py-1 px-2 rounded hover:bg-base-300 transition-colors"
                >
                  <FactionBadge v-if="g.faction" :faction="g.faction" />
                  <span class="font-bold">{{ displayName(g.name, g.display_name) }}</span>
                  <span class="text-base-content/70 text-sm">
                    on {{ displayRealm(g.realm, g.display_realm) }} ({{ g.region.toUpperCase() }})
                  </span>
                </router-link>
              </li>
            </ul>

            <p v-else class="text-base-content/60 text-sm mt-2">No popular guilds yet.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="characters-heading" class="space-y-4">
        <h2 id="characters-heading" class="text-xl font-semibold">Characters</h2>

        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title text-base">Recently searched</h3>

            <div v-if="charactersQuery.isPending.value" class="space-y-2 mt-2">
              <div v-for="i in 3" :key="i" class="skeleton h-6 w-full"></div>
            </div>

            <ErrorState
              v-else-if="charactersQuery.isError.value"
              :error="charactersQuery.error.value"
              @retry="charactersQuery.refetch()"
            />

            <ul
              v-else-if="charactersQuery.data.value?.recently_searched.length"
              class="space-y-1 mt-2"
            >
              <li v-for="c in charactersQuery.data.value.recently_searched" :key="c.id">
                <router-link
                  :to="{
                    name: 'character-detail',
                    params: { region: c.region, realm: c.realm, name: c.name },
                  }"
                  class="flex items-center gap-2 py-1 px-2 rounded hover:bg-base-300 transition-colors"
                >
                  <ClassIcon :class-id="c.class_id" />
                  <span class="font-bold">{{ displayName(c.name, c.display_name) }}</span>
                  <span class="text-base-content/70 text-sm">
                    · {{ displayRealm(c.realm, c.display_realm) }} ({{ c.region.toUpperCase() }}) · L{{ c.level }}
                  </span>
                </router-link>
              </li>
            </ul>

            <p v-else class="text-base-content/60 text-sm mt-2">No recent character searches.</p>
          </div>
        </div>

        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title text-base">Most popular</h3>

            <div v-if="charactersQuery.isPending.value" class="space-y-2 mt-2">
              <div v-for="i in 3" :key="i" class="skeleton h-6 w-full"></div>
            </div>

            <ErrorState
              v-else-if="charactersQuery.isError.value"
              :error="charactersQuery.error.value"
              @retry="charactersQuery.refetch()"
            />

            <ul v-else-if="charactersQuery.data.value?.most_popular.length" class="space-y-1 mt-2">
              <li v-for="c in charactersQuery.data.value.most_popular" :key="c.id">
                <router-link
                  :to="{
                    name: 'character-detail',
                    params: { region: c.region, realm: c.realm, name: c.name },
                  }"
                  class="flex items-center gap-2 py-1 px-2 rounded hover:bg-base-300 transition-colors"
                >
                  <ClassIcon :class-id="c.class_id" />
                  <span class="font-bold">{{ displayName(c.name, c.display_name) }}</span>
                  <span class="text-base-content/70 text-sm">
                    · {{ displayRealm(c.realm, c.display_realm) }} ({{ c.region.toUpperCase() }}) · L{{ c.level }}
                  </span>
                </router-link>
              </li>
            </ul>

            <p v-else class="text-base-content/60 text-sm mt-2">No popular characters yet.</p>
          </div>
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
import FactionBadge from '@/components/wow/FactionBadge.vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LookupForm from '@/components/form/LookupForm.vue'
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
  queryFn: fetchPopularGuilds,
  staleTime: 60_000,
  refetchOnWindowFocus: false,
})

const charactersQuery = useQuery({
  queryKey: ['popular', 'characters'] as const,
  queryFn: fetchPopularCharacters,
  staleTime: 60_000,
  refetchOnWindowFocus: false,
})
</script>
