<template>
  <div class="max-w-md mx-auto p-4">
    <PollingState
      v-if="status === 'processing'"
      message="Authorizing with Battle.net…"
      subtext="Hang tight — we're starting your character sync."
    />

    <div v-else-if="status === 'error'" role="alert" class="alert alert-error flex-col items-start">
      <div>
        <h3 class="font-semibold">Battle.net sync failed</h3>
        <p class="text-sm opacity-90">{{ message }}</p>
      </div>
      <router-link :to="{ name: 'profile' }" class="btn btn-sm mt-2">
        Back to profile
      </router-link>
    </div>

    <div v-else class="card bg-base-200 shadow-sm">
      <div class="card-body items-center text-center">
        <p class="font-medium">Sync started — redirecting…</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { exchangeOAuthCode } from '@/api/blizzard'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/utils/env'
import PollingState from '@/components/feedback/PollingState.vue'
import type { Region } from '@/types/api'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const status = ref<'processing' | 'success' | 'error'>('processing')
const message = ref('')

const VALID_REGIONS: Region[] = ['eu', 'us', 'kr', 'tw']

onMounted(async () => {
  const code = route.query.code as string | undefined
  const stateParam = route.query.state as string | undefined
  const region = VALID_REGIONS.includes(stateParam as Region) ? (stateParam as Region) : undefined

  if (!code || !region) {
    status.value = 'error'
    message.value = 'Missing code or region in callback URL.'
    return
  }

  try {
    await exchangeOAuthCode(region, code, env.blizzardRedirectUri)
    toast.success('Battle.net sync started — your characters will appear shortly.')
    status.value = 'success'
    // BE returns 202 + Retry-After. Schedule a delayed fetchMe so the profile reflects
    // the synced characters once the background job finishes.
    setTimeout(() => auth.fetchMe(), 8000)
    router.push({ name: 'profile' })
  } catch (err) {
    status.value = 'error'
    message.value = getErrorMessage(err, 'Failed to start Battle.net sync.')
    toast.error(message.value)
  }
})
</script>
