<script setup lang="ts">
import { computed, reactive } from 'vue'
import {
  raiderIoCharacterUrl,
  raiderIoGuildUrl,
  warcraftLogsCharacterUrl,
  warcraftLogsGuildUrl,
} from '@/utils/externalLinks'

const props = defineProps<{
  kind: 'character' | 'guild'
  region: string
  realm: string
  name: string
  displayName?: string | null
}>()

const links = computed(() => [
  {
    key: 'raiderio',
    label: 'View on Raider.io',
    monogram: 'RIO',
    icon: '/external/raiderio.png',
    href:
      props.kind === 'character'
        ? raiderIoCharacterUrl(props.region, props.realm, props.name)
        : raiderIoGuildUrl(props.region, props.realm, props.name, props.displayName),
  },
  {
    key: 'warcraftlogs',
    label: 'View on Warcraft Logs',
    monogram: 'WCL',
    icon: '/external/warcraftlogs.png',
    href:
      props.kind === 'character'
        ? warcraftLogsCharacterUrl(props.region, props.realm, props.name)
        : warcraftLogsGuildUrl(props.region, props.realm, props.name, props.displayName),
  },
])

// Missing/broken brand asset → monogram badge (RaceIcon fallback pattern).
const iconFailed = reactive<Record<string, boolean>>({})
</script>

<template>
  <a
    v-for="link in links"
    :key="link.key"
    :href="link.href"
    target="_blank"
    rel="noopener"
    :title="link.label"
    :aria-label="link.label"
    class="p-1.5 rounded-md text-wsa-muted/60 hover:text-wsa-gold transition-colors"
  >
    <img
      v-if="!iconFailed[link.key]"
      :src="link.icon"
      alt=""
      aria-hidden="true"
      class="w-4 h-4 rounded-sm opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
      @error="iconFailed[link.key] = true"
    />
    <span
      v-else
      class="inline-flex h-4 items-center justify-center rounded-sm px-0.5 text-[9px] font-bold leading-none"
      >{{ link.monogram }}</span
    >
  </a>
</template>
