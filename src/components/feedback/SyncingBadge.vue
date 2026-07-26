<template>
  <span
    v-if="syncing"
    data-testid="sync-banner"
    class="wsa-badge !border-sky-500/30 !text-sky-400 gap-1.5"
  >
    <span class="wsa-spinner !w-3 !h-3 shrink-0" />
    <span>
      Syncing character data — sections fill in as they arrive.
      <template v-if="(queueDepth ?? 0) > QUEUE_BUSY_THRESHOLD">
        Queue is busy — this may take a few minutes.
      </template>
    </span>
  </span>
  <span
    v-else-if="showSuccess"
    data-testid="sync-success"
    class="wsa-badge sync-success-flash !border-emerald-500/30 !text-emerald-400 gap-1.5"
  >
    <img
      src="/brand/state-success.jpg"
      alt=""
      aria-hidden="true"
      class="h-5 w-5 shrink-0 rounded-full border border-wsa-border/50 object-cover"
    />
    <span>Job's done!</span>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ syncing: boolean; queueDepth?: number }>()

const QUEUE_BUSY_THRESHOLD = 50
const SUCCESS_FLASH_MS = 4000

const showSuccess = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

watch(
  () => props.syncing,
  (now, prev) => {
    clearTimer()
    if (prev && !now) {
      // Sync just finished — flash the success badge, then go quiet.
      showSuccess.value = true
      timer = setTimeout(() => {
        showSuccess.value = false
        timer = null
      }, SUCCESS_FLASH_MS)
    } else {
      showSuccess.value = false
    }
  },
)

onBeforeUnmount(clearTimer)
</script>

<style scoped>
@keyframes sync-success-fade {
  0%,
  87% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
.sync-success-flash {
  animation: sync-success-fade 4s ease forwards;
}
</style>
