<template>
  <div v-if="user" class="max-w-3xl mx-auto p-4 flex flex-col gap-6">
    <section class="card bg-base-200 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title">Account</h2>
        <div class="flex flex-col gap-1 text-sm">
          <div>
            <span class="text-base-content/60">Name:</span>
            <span class="ml-2 font-medium">{{ user.name }}</span>
          </div>
          <div>
            <span class="text-base-content/60">Email:</span>
            <span class="ml-2 font-medium">{{ user.email }}</span>
          </div>
          <div class="mt-2">
            <span class="text-base-content/60">Battle.net:</span>
            <span v-if="user.bnet_id" class="ml-2 font-medium">
              Connected as {{ user.bnet_tag }} ({{ (user.bnet_region ?? '').toUpperCase() }})
            </span>
            <span v-else class="ml-2 font-medium">Not connected to Battle.net</span>
          </div>
          <div v-if="user.bnet_id && user.bnet_synced_at" class="text-xs text-base-content/60">
            Last synced {{ relativeTime(user.bnet_synced_at) }}
          </div>
        </div>
      </div>
    </section>

    <section class="card bg-base-200 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title">{{ user.bnet_id ? 'Re-sync Battle.net' : 'Connect Battle.net' }}</h2>
        <p class="text-sm text-base-content/70">
          Choose your region and authorize with Battle.net to import your characters.
        </p>
        <div class="flex flex-wrap items-end gap-3">
          <label class="form-control">
            <div class="label">
              <span class="label-text">Region</span>
            </div>
            <RegionSelect v-model="oauthRegion" />
          </label>
          <button type="button" class="btn btn-primary" @click="startOAuth">
            Sync from Battle.net
          </button>
        </div>
      </div>
    </section>

    <section class="card bg-base-200 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title">My Characters</h2>
        <p v-if="user.characters.length === 0" class="text-sm text-base-content/60">
          No characters yet. Connect to Battle.net above to sync them.
        </p>
        <ul v-else class="flex flex-col divide-y divide-base-300">
          <li
            v-for="character in user.characters"
            :key="character.id"
            class="flex flex-wrap items-center gap-3 py-3"
          >
            <ClassIcon :class-id="character.class_id" />
            <div class="flex-1 min-w-0">
              <div class="text-sm">
                <span class="font-bold">{{ character.name }}</span>
                <span> on {{ character.realm }} ({{ character.region.toUpperCase() }}) — L{{ character.level }}</span>
              </div>
            </div>
            <router-link
              :to="{
                name: 'character-detail',
                params: {
                  region: character.region,
                  realm: character.realm,
                  name: character.name,
                },
              }"
              class="btn btn-xs btn-ghost"
            >
              View
            </router-link>
            <button
              type="button"
              class="btn btn-xs"
              :class="recruitmentBusy[character.id] ? 'btn-disabled' : 'btn-outline'"
              :disabled="recruitmentBusy[character.id]"
              @click="onToggleRecruitment(character.id)"
            >
              <span
                v-if="recruitmentBusy[character.id]"
                class="loading loading-spinner loading-xs"
              />
              <span>Looking for guild</span>
            </button>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { toggleRecruitment } from '@/api/characters'
import RegionSelect from '@/components/form/RegionSelect.vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import { env } from '@/utils/env'
import type { Region } from '@/types/api'
import { getErrorMessage } from '@/utils/errors'

const auth = useAuthStore()
const user = computed(() => auth.user)

// Default the OAuth region to whatever the user is already linked with, otherwise EU.
const oauthRegion = ref<Region>(((user.value?.bnet_region as Region) ?? 'eu'))

const recruitmentBusy = reactive<Record<number, boolean>>({})

function startOAuth() {
  // Pass the chosen region via the OAuth `state` param so the callback knows which
  // /{region}/blizzard-oauth endpoint to POST to without needing a separate query param.
  const url = new URL(`https://${oauthRegion.value}.battle.net/oauth/authorize`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', env.blizzardClientId)
  url.searchParams.set('redirect_uri', env.blizzardRedirectUri)
  url.searchParams.set('scope', 'openid wow.profile')
  url.searchParams.set('state', oauthRegion.value)
  window.location.href = url.toString()
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
