<template>
  <div role="alert" class="alert" :class="isThrottled ? 'alert-warning' : 'alert-error'">
    <div class="flex-1">
      <h3 class="font-semibold">{{ resolvedTitle }}</h3>
      <p v-if="resolvedMessage" class="text-sm opacity-90">{{ resolvedMessage }}</p>
    </div>
    <div class="flex-none">
      <slot name="actions">
        <button
          type="button"
          class="btn btn-sm"
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
import { NotFoundError, ThrottledError } from '@/types/api'

const props = defineProps<{
  title?: string
  message?: string
  error?: unknown
}>()

const emit = defineEmits<{ retry: [] }>()

const isNotFound = computed(() => props.error instanceof NotFoundError)
const isThrottled = computed(() => props.error instanceof ThrottledError)

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
  return 'Something went wrong'
})

const resolvedMessage = computed(() => {
  if (props.message) return props.message
  if (isNotFound.value) return "We couldn't find that character/guild on Blizzard."
  if (isThrottled.value) {
    return remainingSeconds.value > 0
      ? `This endpoint is rate-limited. Try again in ${remainingSeconds.value}s.`
      : 'This endpoint is rate-limited. You can try again now.'
  }
  return undefined
})

const retryLabel = computed(() => {
  if (isThrottled.value && remainingSeconds.value > 0) return `Retry in ${remainingSeconds.value}s`
  return 'Try again'
})
</script>
