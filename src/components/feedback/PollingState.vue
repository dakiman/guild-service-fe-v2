<template>
  <div class="wsa-card flex flex-col items-center text-center gap-3 py-8">
    <slot name="visual">
      <div class="wsa-spinner" />
    </slot>
    <p class="text-sm font-medium text-wsa-text">{{ message ?? tierMessage }}</p>
    <p class="text-xs text-wsa-disabled">{{ subtext ?? tierSubtext }}</p>
    <p v-if="showQueueBusy" class="text-xs text-wsa-disabled">
      The sync queue is busy right now (~{{ queueDepth!.toLocaleString() }} jobs ahead)
    </p>
    <button v-if="tier === 'patient'" type="button" class="wsa-btn" @click="emit('checkNow')">
      Check now
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ACTIVE_PHASE_MS } from '@/composables/pollingSchedule'

const props = defineProps<{
  // Epoch ms of the first 202 for this lookup (usePollingLookup's
  // syncPendingSince). Drives the message tiers; absent → 'first' tier.
  pendingSince?: number | null
  queueDepth?: number
  // Explicit copy overrides the tier copy (used by the isSyncing banner and
  // the OAuth callback page).
  message?: string
  subtext?: string
}>()

const emit = defineEmits<{ checkNow: [] }>()

const WAITING_MS = 30_000
const QUEUE_BUSY_THRESHOLD = 50

// 1s clock so the tier advances while the user watches.
const nowMs = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const elapsedMs = computed(() =>
  props.pendingSince ? Math.max(0, nowMs.value - props.pendingSince) : 0,
)

const tier = computed<'first' | 'waiting' | 'patient'>(() => {
  if (elapsedMs.value >= ACTIVE_PHASE_MS) return 'patient'
  if (elapsedMs.value >= WAITING_MS) return 'waiting'
  return 'first'
})

const tierMessage = computed(() => {
  switch (tier.value) {
    case 'patient':
      return 'Taking longer than usual.'
    case 'waiting':
      return 'Still syncing…'
    default:
      return 'Fetching from Blizzard for the first time…'
  }
})

const tierSubtext = computed(() => {
  switch (tier.value) {
    case 'patient':
      return "We'll keep checking about once a minute — feel free to come back later."
    case 'waiting':
      return "This lookup is queued behind other sync work — we'll keep checking."
    default:
      return 'This usually takes a few seconds.'
  }
})

const showQueueBusy = computed(
  () => tier.value !== 'first' && (props.queueDepth ?? 0) > QUEUE_BUSY_THRESHOLD,
)
</script>
