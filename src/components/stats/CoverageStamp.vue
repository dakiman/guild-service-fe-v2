<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 'official' = Blizzard-ladder wording; 'crawled' = Peon tracked-subset wording. */
  variant: 'official' | 'crawled'
  /** ISO timestamp of the last warm/compute. Falsy or unparseable → renders nothing. */
  timestamp: string | null | undefined
  /** Crawled variant only: characters tracked by Peon. Omit for the count-less wording. */
  count?: number | null
}>()

const age = computed<string | null>(() => {
  if (!props.timestamp) return null
  const ms = Date.now() - new Date(props.timestamp).getTime()
  if (Number.isNaN(ms)) return null
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
})
</script>

<template>
  <p v-if="age" class="text-[10px] leading-relaxed text-wsa-disabled">
    <template v-if="variant === 'official'">
      Updated {{ age }} · top-500 per shard, official Blizzard leaderboards · EU+US
    </template>
    <template v-else-if="count != null">
      Among {{ count.toLocaleString() }} characters tracked by Peon · updated {{ age }}
    </template>
    <template v-else>
      Crawled by Peon — coverage is our tracked subset, not all of WoW · updated {{ age }}
    </template>
  </p>
</template>
