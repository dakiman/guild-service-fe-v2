<template>
  <button
    type="button"
    class="wsa-btn"
    data-testid="refresh-button"
    :disabled="disabled"
    :title="onCooldown ? cooldownTitle : undefined"
    @click="$emit('refresh')"
  >
    <RefreshCw class="w-3.5 h-3.5" />
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import type { RefreshInfo } from '@/types/api'

const props = defineProps<{
  refresh?: RefreshInfo
  syncing: boolean
}>()

defineEmits<{ refresh: [] }>()

// Server is the source of truth for the cooldown — derive the remaining
// time from refresh.available_at rather than tracking a local countdown.
const remainingMs = computed(() => {
  const availableAt = props.refresh?.available_at
  if (!availableAt) return 0
  return Math.max(0, new Date(availableAt).getTime() - Date.now())
})

const onCooldown = computed(() => props.refresh?.available === false)
const disabled = computed(() => props.syncing || onCooldown.value)

const remainingMinutes = computed(() => Math.max(1, Math.ceil(remainingMs.value / 60_000)))

const label = computed(() =>
  onCooldown.value ? `Refresh in ${remainingMinutes.value}m` : 'Refresh',
)

const cooldownTitle = computed(
  () => `Refreshed recently — try again in ${remainingMinutes.value}m`,
)
</script>
