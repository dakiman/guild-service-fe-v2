<template>
  <div v-if="user" class="max-w-3xl mx-auto p-4 flex flex-col gap-6">
    <PageHeader icon="/brand/icon-profile.jpg" title="Profile" />

    <section class="wsa-card">
      <h2 class="wsa-text-heading text-lg mb-3">Account</h2>
      <dl class="flex flex-col gap-2 text-sm">
        <div class="flex items-baseline gap-2">
          <dt class="w-24 flex-none text-wsa-muted">Name</dt>
          <dd class="font-medium text-wsa-text">{{ user.name }}</dd>
        </div>
        <div class="flex items-baseline gap-2">
          <dt class="w-24 flex-none text-wsa-muted">Email</dt>
          <dd class="font-medium text-wsa-text">{{ user.email }}</dd>
        </div>
        <div class="flex items-center gap-2">
          <dt class="w-24 flex-none text-wsa-muted">Battle.net</dt>
          <dd class="flex min-w-0 flex-wrap items-center gap-2">
            <span
              v-if="user.bnet_id"
              data-testid="bnet-badge"
              class="wsa-badge !border-emerald-700/50 !text-emerald-300"
            >
              Connected — {{ user.bnet_tag }} ({{ (user.bnet_region ?? '').toUpperCase() }})
            </span>
            <span v-else data-testid="bnet-badge" class="wsa-badge">Not connected</span>
            <span
              v-if="user.bnet_sync_status === 'syncing'"
              class="inline-flex items-center gap-1.5 text-xs italic text-wsa-muted"
            >
              <span class="wsa-spinner !w-3 !h-3 inline-block" />
              Work, work…
            </span>
          </dd>
        </div>
      </dl>
      <div v-if="user.bnet_id && user.bnet_synced_at" class="mt-1 pl-[6.5rem] text-xs text-wsa-disabled">
        Last synced {{ relativeTime(user.bnet_synced_at) }}
      </div>
    </section>

    <section class="wsa-card">
      <h2 class="wsa-text-heading text-lg mb-3">{{ user.bnet_id ? 'Re-sync Battle.net' : 'Connect Battle.net' }}</h2>
      <p class="text-sm text-wsa-muted">
        Choose your region and authorize with Battle.net to import your characters.
      </p>
      <div class="flex flex-wrap items-end gap-3 mt-3">
        <label class="flex flex-col gap-1">
          <span class="stats-label font-medium uppercase tracking-wide">Region</span>
          <RegionSelect v-model="oauthRegion" />
        </label>
        <button
          type="button"
          class="wsa-btn wsa-btn--primary py-2 text-sm"
          :disabled="oauthBusy"
          @click="startOAuth"
        >
          <span v-if="oauthBusy" class="wsa-spinner !w-4 !h-4 inline-block mr-2 align-middle" />
          Sync from Battle.net
        </button>
      </div>
    </section>

    <section class="wsa-card">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="wsa-text-heading text-lg">My Characters</h2>
        <input
          v-if="user.characters.length > 0"
          v-model="search"
          data-testid="char-search"
          type="search"
          placeholder="Search characters…"
          class="wsa-input !w-56 py-1.5 text-sm"
        />
      </div>
      <div
        v-if="user.characters.length === 0"
        class="flex flex-col items-center gap-3 py-8 text-center"
      >
        <img
          data-testid="empty-art"
          src="/brand/state-empty.jpg"
          alt=""
          aria-hidden="true"
          class="h-20 w-20 rounded-full border border-wsa-border/50 object-cover"
        />
        <p class="max-w-md text-sm text-wsa-muted">
          No characters yet. Connect to Battle.net above to sync them.
        </p>
      </div>
      <p v-else-if="visibleCharacters.length === 0" class="py-6 text-center text-sm text-wsa-muted">
        No characters match “{{ search.trim() }}”.
      </p>
      <ul v-else class="flex flex-col divide-y divide-wsa-border/30">
        <li
          v-for="character in visibleCharacters"
          :key="character.id"
          class="flex items-center gap-2 py-1.5"
        >
          <router-link
            :to="{
              name: 'character-detail',
              params: {
                region: character.region,
                realm: character.realm,
                name: character.name,
              },
            }"
            class="flex min-w-0 flex-1 items-center gap-3 rounded-md border-l-2 py-2 pl-3 pr-2 transition-colors hover:bg-wsa-border/10"
            :style="{ borderLeftColor: factionAccent(character.faction) }"
          >
            <img
              v-if="character.media && !portraitFailed[character.id]"
              data-testid="char-portrait"
              :src="character.media"
              alt=""
              aria-hidden="true"
              class="h-12 w-12 flex-none rounded-lg border border-wsa-border/50 object-cover"
              @error="portraitFailed[character.id] = true"
            />
            <ClassIcon v-else :class-id="character.class_id" :size="48" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm">
                <span
                  data-testid="char-name"
                  class="font-bold"
                  :style="{ color: getClassColor(character.class_id) }"
                >
                  {{ displayName(character.name, character.display_name) }}
                </span>
                <span class="text-wsa-muted">
                  — {{ displayRealm(character.realm, character.display_realm) }}
                  ({{ character.region.toUpperCase() }}) · L{{ character.level }}
                </span>
              </div>
              <div
                v-if="character.active_specialization"
                class="truncate text-xs text-wsa-muted/80"
              >
                {{ character.active_specialization }}
              </div>
            </div>
          </router-link>
          <button
            type="button"
            class="wsa-btn flex-none text-xs"
            :disabled="recruitmentBusy[character.id]"
            @click="onToggleRecruitment(character.id)"
          >
            <span
              v-if="recruitmentBusy[character.id]"
              class="wsa-spinner !w-3 !h-3 inline-block mr-1 align-middle"
            />
            <span>Looking for guild</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { toggleRecruitment } from '@/api/characters'
import { mintOAuthState } from '@/api/blizzard'
import { setOAuthPending } from '@/utils/oauthPending'
import RegionSelect from '@/components/form/RegionSelect.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import { env } from '@/utils/env'
import { displayName, displayRealm } from '@/utils/display'
import { FACTION_COLORS, getClassColor } from '@/utils/wowConstants'
import type { Faction } from '@/types/wow'
import type { Region } from '@/types/api'
import { getErrorMessage } from '@/utils/errors'

const auth = useAuthStore()
const user = computed(() => auth.user)

// Default the OAuth region to whatever the user is already linked with, otherwise EU.
const oauthRegion = ref<Region>(((user.value?.bnet_region as Region) ?? 'eu'))

const recruitmentBusy = reactive<Record<number, boolean>>({})
const portraitFailed = reactive<Record<number, boolean>>({})

const search = ref('')

const visibleCharacters = computed(() => {
  const sorted = [...(user.value?.characters ?? [])].sort((a, b) => b.level - a.level)
  const query = search.value.trim().toLowerCase()
  if (!query) return sorted
  return sorted.filter(
    (c) =>
      displayName(c.name, c.display_name).toLowerCase().includes(query) ||
      displayRealm(c.realm, c.display_realm).toLowerCase().includes(query),
  )
})

const oauthBusy = ref(false)

async function startOAuth() {
  if (oauthBusy.value) return
  oauthBusy.value = true
  try {
    const { state } = await mintOAuthState(oauthRegion.value, env.blizzardRedirectUri)
    setOAuthPending({
      region: oauthRegion.value,
      state,
      redirectUri: env.blizzardRedirectUri,
    })
    const url = new URL(`https://${oauthRegion.value}.battle.net/oauth/authorize`)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.blizzardClientId)
    url.searchParams.set('redirect_uri', env.blizzardRedirectUri)
    url.searchParams.set('scope', 'openid wow.profile')
    url.searchParams.set('state', state)
    window.location.href = url.toString()
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to start Battle.net sync.'))
  } finally {
    oauthBusy.value = false
  }
}

async function onToggleRecruitment(id: number) {
  if (recruitmentBusy[id]) return
  recruitmentBusy[id] = true
  try {
    await toggleRecruitment(id)
    await auth.fetchMe()
    toast.success('Recruitment status updated.')
  } catch (err) {
    const message = getErrorMessage(err, 'Failed to update recruitment status.')
    toast.error(message)
  } finally {
    recruitmentBusy[id] = false
  }
}

function factionAccent(faction: Faction): string {
  // 40% alpha so the accent reads as a tint, not a stripe.
  return `${FACTION_COLORS[faction] ?? '#888888'}66`
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'recently'
  const diffSeconds = Math.round((Date.now() - then) / 1000)
  if (diffSeconds < 5) return 'just now'
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]
  let value = diffSeconds
  let unit = 'second'
  for (const [factor, name] of units) {
    if (Math.abs(value) < factor) {
      unit = name
      break
    }
    value = value / factor
    unit = name
  }
  const rounded = Math.round(value)
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`
}
</script>
