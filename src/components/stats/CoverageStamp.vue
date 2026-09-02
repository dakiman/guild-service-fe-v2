<script setup lang="ts">
import { computed } from 'vue'
import { relativeTime } from '@/utils/relativeTime'

const props = defineProps<{
  /** 'official' = Blizzard-ladder wording; 'crawled' = Peon tracked-subset wording. */
  variant: 'official' | 'crawled'
  /** ISO timestamp of the last warm/compute. Falsy or unparseable → renders nothing. */
  timestamp: string | null | undefined
  /** Crawled variant only: characters tracked by Peon. Omit for the count-less wording. */
  count?: number | null
}>()

const age = computed<string | null>(() => relativeTime(props.timestamp))
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
