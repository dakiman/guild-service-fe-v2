<template>
  <div
    role="alert"
    class="wsa-card flex justify-between gap-3"
    :class="[isThrottled ? '!border-amber-700/50' : '!border-red-800/50', compact ? '!p-3 items-center' : '!p-4 items-start']"
  >
    <img
      v-if="!hideArt && !compact"
      :src="artSrc"
      alt=""
      aria-hidden="true"
      class="h-16 w-16 flex-none rounded-full border border-wsa-border/50 object-cover"
    />
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-semibold" :class="isThrottled ? 'text-wsa-gold' : 'text-red-400'">
        {{ resolvedTitle }}
      </h3>
      <p
        v-if="resolvedMessage"
        :class="[isThrottled ? 'text-wsa-muted' : 'text-red-300/80', compact ? 'text-xs mt-0.5' : 'text-xs mt-1']"
      >
        {{ resolvedMessage }}
      </p>
      <p v-if="quip && !hideArt && !compact" class="text-[11px] italic text-wsa-disabled mt-1">{{ quip }}</p>
    </div>
    <div v-if="!hideRetry || $slots.actions" class="flex-none">
      <slot name="actions">
        <RouterLink v-if="isNotFound" :to="{ name: 'home' }" class="wsa-btn">{{ notFoundLabel }}</RouterLink>
        <button
          v-else
          type="button"
          class="wsa-btn"
          :disabled="isThrottled && remainingSeconds > 0"
          @click="emit('retry')"
        >
          {{ retryLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { NotFoundError, SyncPendingError, ThrottledError } from '@/types/api'

const props = defineProps<{
  title?: string
  message?: string
  error?: unknown
  hideRetry?: boolean
  hideArt?: boolean
  compact?: boolean
  kind?: 'character' | 'guild'
}>()

const emit = defineEmits<{ retry: [] }>()

const isNotFound = computed(() => props.error instanceof NotFoundError)
const isThrottled = computed(() => props.error instanceof ThrottledError)
const isSyncPending = computed(() => props.error instanceof SyncPendingError)

const artSrc = computed(() => {
  if (isNotFound.value) return '/brand/state-empty.jpg'
  if (isThrottled.value) return '/brand/state-syncing.jpg'
  return '/brand/state-error.jpg'
})
const quip = computed(() => {
  if (isNotFound.value) return 'Nothing need doing here.'
  if (isThrottled.value) return null // informative countdown copy is enough
  return "Job's… not done."
})

const remainingSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.error,
  (err) => {
    stopTimer()
    if (err instanceof ThrottledError) {
      remainingSeconds.value = Math.ceil(err.retryAfter / 1000)
      timer = setInterval(() => {
        remainingSeconds.value = Math.max(0, remainingSeconds.value - 1)
        if (remainingSeconds.value === 0) stopTimer()
      }, 1000)
    } else {
      remainingSeconds.value = 0
    }
  },
  { immediate: true },
)

onBeforeUnmount(stopTimer)

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (isNotFound.value) return 'Not found'
  if (isThrottled.value) return 'Too many requests'
  if (isSyncPending.value) return 'Still syncing'
  return 'Something went wrong'
})

const resolvedMessage = computed(() => {
  if (props.message) return props.message
  if (isNotFound.value) return "We couldn't find that character/guild on Blizzard."
  if (isThrottled.value) {
    return remainingSeconds.value > 0
      ? `Too many lookups right now — try again in ${remainingSeconds.value}s.`
      : 'Too many lookups right now — you can try again now.'
  }
  if (isSyncPending.value) {
    return 'This is taking much longer than it should — the sync is still queued on our side. Try again, or come back in a few minutes.'
  }
  return undefined
})

const notFoundLabel = computed(() =>
  props.kind === 'character'
    ? 'Search another character'
    : props.kind === 'guild'
      ? 'Search another guild'
      : 'Back to search',
)

const retryLabel = computed(() => {
  if (isThrottled.value && remainingSeconds.value > 0) return `Retry in ${remainingSeconds.value}s`
  return 'Try again'
})
</script>
