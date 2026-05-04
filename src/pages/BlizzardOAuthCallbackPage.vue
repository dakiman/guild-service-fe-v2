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
import { takeOAuthPending } from '@/utils/oauthPending'
import { useAuthStore } from '@/stores/auth'
import PollingState from '@/components/feedback/PollingState.vue'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const status = ref<'processing' | 'success' | 'error'>('processing')
const message = ref('')

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : undefined
  const stateParam = typeof route.query.state === 'string' ? route.query.state : undefined
  const pending = takeOAuthPending()

  if (!code || !stateParam || !pending) {
    status.value = 'error'
    message.value =
      'Battle.net session is missing or expired. Start the sync again from your profile.'
    return
  }

  if (pending.state !== stateParam) {
    status.value = 'error'
    message.value =
      'Battle.net session does not match. Start the sync again from your profile.'
    return
  }

  try {
    await exchangeOAuthCode(pending.region, code, pending.redirectUri, pending.state)
    toast.success('Battle.net sync started — your characters will appear shortly.')
    status.value = 'success'
    // BE returns 202 + Retry-After. Schedule a delayed fetchMe so the profile
    // reflects the synced characters once the background job finishes.
    setTimeout(() => auth.fetchMe(), 8000)
    router.push({ name: 'profile' })
  } catch (err) {
    status.value = 'error'
    message.value = getErrorMessage(err, 'Failed to start Battle.net sync.')
    toast.error(message.value)
  }
})
</script>
