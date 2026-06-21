<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import LookupForm from '@/components/form/LookupForm.vue'
import GuildSummaryCard from '@/components/guild/GuildSummaryCard.vue'
import FactionSplitBar from '@/components/guild/FactionSplitBar.vue'
import RegionBreakdownTable from '@/components/guild/RegionBreakdownTable.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import { fetchDiscoverGuilds } from '@/api/guilds'
import type { GuildSummaryWithMetric } from '@/types/guild'
import type { Region } from '@/types/api'

const router = useRouter()

function onSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'guild-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}

const discoverQuery = useQuery({
  queryKey: ['discover', 'guilds'] as const,
  queryFn: fetchDiscoverGuilds,
  staleTime: 60_000,
  refetchOnWindowFocus: false,
})

const refetch = () => {
  discoverQuery.refetch()
}

function formatPoints(item: GuildSummaryWithMetric): string {
  return `${item.metric.toLocaleString()} pts`
}

function formatMembers(item: GuildSummaryWithMetric): string {
  return `${item.metric.toLocaleString()} members`
}

function formatCreatedAgo(item: GuildSummaryWithMetric): string {
  const ms = item.metric
  if (!ms) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  const diffDay = Math.floor(diffSec / 86_400)
  if (diffDay < 1) return 'today'
  if (diffDay < 30) return `${diffDay}d ago`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth}mo ago`
  const diffYear = Math.floor(diffDay / 365)
  return `${diffYear}y ago`
}
</script>

<template>
  <div class="p-4 max-w-6xl mx-auto">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-wsa-heading">Guilds</h1>
      <p class="text-wsa-muted mt-1">
        Find a guild, or browse what's active across regions.
      </p>
    </header>

    <section class="wsa-card mb-6">
      <h2 class="stats-card-title text-base">Find a guild</h2>
      <LookupForm kind="guild" @submit="onSubmit" @pick="onSubmit" />
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <GuildSummaryCard
        title="Recently searched"
        :items="discoverQuery.data.value?.recently_searched"
        :is-pending="discoverQuery.isPending.value"
        :is-error="discoverQuery.isError.value"
        :error="discoverQuery.error.value"
        :on-retry="refetch"
        empty-message="No recent guild searches."
      />

      <GuildSummaryCard
        title="Most popular"
        :items="discoverQuery.data.value?.most_popular"
        :is-pending="discoverQuery.isPending.value"
        :is-error="discoverQuery.isError.value"
        :error="discoverQuery.error.value"
        :on-retry="refetch"
        empty-message="No popular guilds yet."
      />

      <GuildSummaryCard
        title="Top achievement points"
        :items="discoverQuery.data.value?.top_achievement_points"
        :is-pending="discoverQuery.isPending.value"
        :is-error="discoverQuery.isError.value"
        :error="discoverQuery.error.value"
        :on-retry="refetch"
        :format-metric="formatPoints"
        empty-message="No guilds yet."
      />

      <GuildSummaryCard
        title="Largest guilds"
        :items="discoverQuery.data.value?.largest_by_members"
        :is-pending="discoverQuery.isPending.value"
        :is-error="discoverQuery.isError.value"
        :error="discoverQuery.error.value"
        :on-retry="refetch"
        :format-metric="formatMembers"
        empty-message="No guilds yet."
      />

      <GuildSummaryCard
        title="Recently created"
        :items="discoverQuery.data.value?.recently_created"
        :is-pending="discoverQuery.isPending.value"
        :is-error="discoverQuery.isError.value"
        :error="discoverQuery.error.value"
        :on-retry="refetch"
        :format-metric="formatCreatedAgo"
        empty-message="No newly-created guilds yet."
      />

      <div class="wsa-card md:col-span-2 xl:col-span-2">
        <h3 class="stats-card-title text-base">Faction & region</h3>

        <div v-if="discoverQuery.isPending.value" class="space-y-2 mt-2">
          <div class="h-3 w-full rounded bg-wsa-border/20 animate-pulse"></div>
          <div class="h-4 w-2/3 rounded bg-wsa-border/20 animate-pulse"></div>
          <div class="h-24 w-full rounded bg-wsa-border/20 animate-pulse"></div>
        </div>

        <ErrorState
          v-else-if="discoverQuery.isError.value"
          :error="discoverQuery.error.value"
          @retry="refetch()"
        />

        <template v-else-if="discoverQuery.data.value">
          <FactionSplitBar
            :alliance="discoverQuery.data.value.faction_split.Alliance"
            :horde="discoverQuery.data.value.faction_split.Horde"
          />
          <div class="mt-4">
            <RegionBreakdownTable :rows="discoverQuery.data.value.region_breakdown" />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
