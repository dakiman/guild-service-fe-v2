<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] text-base">{{ title }}</h3>

    <div v-if="isPending" class="space-y-2 mt-2">
      <div v-for="i in 3" :key="i" class="h-6 w-full rounded bg-wsa-border/20 animate-pulse"></div>
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="onRetry()" />

    <ul v-else-if="items?.length" class="mt-2 divide-y divide-wsa-border/20">
      <li v-for="g in items" :key="g.id">
        <router-link
          :to="{
            name: 'guild-detail',
            params: { region: g.region, realm: g.realm, name: g.name },
          }"
          class="flex items-center gap-3 py-2 px-2 rounded hover:bg-black/20 transition-colors"
        >
          <FactionBadge v-if="g.faction" :faction="g.faction" class="shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-bold truncate text-wsa-text">{{ displayName(g.name, g.display_name) }}</div>
            <div class="text-wsa-muted text-xs truncate">
              {{ displayRealm(g.realm, g.display_realm) }} · {{ g.region.toUpperCase() }}
            </div>
          </div>
          <span
            v-if="formatMetric && hasMetric(g)"
            class="shrink-0 wsa-badge whitespace-nowrap"
          >{{ formatMetric(g as GuildSummaryWithMetric) }}</span>
        </router-link>
      </li>
    </ul>

    <p v-else class="text-wsa-disabled text-sm mt-2">{{ emptyMessage ?? 'No guilds.' }}</p>
  </div>
</template>

<script setup lang="ts">
import FactionBadge from '@/components/wow/FactionBadge.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import { displayName, displayRealm } from '@/utils/display'
import type { GuildSummary, GuildSummaryWithMetric } from '@/types/guild'

defineProps<{
  title: string
  items: GuildSummary[] | GuildSummaryWithMetric[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  emptyMessage?: string
  onRetry: () => void
  formatMetric?: (item: GuildSummaryWithMetric) => string
}>()

function hasMetric(g: GuildSummary | GuildSummaryWithMetric): g is GuildSummaryWithMetric {
  return typeof (g as GuildSummaryWithMetric).metric === 'number'
}
</script>
