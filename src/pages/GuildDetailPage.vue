<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { toast } from 'vue-sonner'
import GuildHeader from '@/components/guild/GuildHeader.vue'
import GuildStatsSection from '@/components/guild/GuildStatsSection.vue'
import RosterTable from '@/components/guild/RosterTable.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import PollingState from '@/components/feedback/PollingState.vue'
import StaleBadge from '@/components/feedback/StaleBadge.vue'
import RefreshButton from '@/components/feedback/RefreshButton.vue'
import { useGuildLookup } from '@/composables/usePollingLookup'
import { useStaleAutoRefresh } from '@/composables/useStaleAutoRefresh'
import type { Region } from '@/types/api'
import { SyncPendingError } from '@/types/api'

const props = defineProps<{ region: Region; realm: string; name: string }>()

const region = toRef(props, 'region')
const realm = toRef(props, 'realm')
const name = toRef(props, 'name')

const page = ref(1)
const perPage = 50
const filterText = ref('')
const debouncedFilter = refDebounced(filterText, 250)

// Reset to page 1 when the filter changes so a search starting on page 7
// doesn't return an empty page if results don't span that far.
watch(debouncedFilter, () => {
  page.value = 1
})

const lookup = useGuildLookup(region, realm, name, page, perPage, debouncedFilter)

const guild = computed(() => lookup.data.value?.guild ?? null)
const members = computed(() => lookup.data.value?.members ?? null)
const meta = computed(() => lookup.data.value?.meta ?? null)
const isStale = computed(() => lookup.data.value?.isStale ?? false)
const isSyncing = computed(() => lookup.data.value?.isSyncing ?? false)

async function onForceRefresh() {
  const result = await lookup.forceRefresh()
  if (result.data?.meta?.forced_refresh === false) {
    toast.error('Refreshed recently — try again in a few minutes')
  }
}

// While the guild is still syncing (roster never synced), refetchInterval
// already keeps polling every 30s — don't also let useStaleAutoRefresh fire
// a redundant refetch on top of that.
useStaleAutoRefresh(computed(() => isStale.value && !isSyncing.value), () => [
  'guild', region.value, realm.value, name.value, page.value, perPage, debouncedFilter.value,
])

const showError = computed(
  () => !!lookup.error.value && !lookup.isFetching.value,
)

const guildQueueDepth = computed(() => {
  const err = lookup.error.value
  return err instanceof SyncPendingError ? err.queueDepth : undefined
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ErrorState
      v-if="showError"
      :error="lookup.error.value"
      @retry="lookup.restartPolling()"
    />

    <template v-else-if="guild && members">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <GuildHeader :guild="guild" class="flex-1" />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <StaleBadge v-if="isStale" :last-synced-at="guild.roster_synced_at ?? undefined" />
        <RefreshButton
          v-if="meta"
          :refresh="meta.refresh"
          :syncing="isSyncing"
          @refresh="onForceRefresh"
        />
      </div>

      <GuildStatsSection :region="region" :realm="realm" :name="name" />

      <div class="max-w-sm">
        <label class="block text-xs text-wsa-muted mb-1">Filter members</label>
        <input
          v-model="filterText"
          type="text"
          class="wsa-input"
          placeholder="Filter by name…"
        />
      </div>

      <RosterTable
        :members="members"
        :page="page"
        :region="region"
        @page-change="page = $event"
      />
    </template>

    <PollingState
      v-else
      :pending-since="lookup.syncPendingSince.value"
      :queue-depth="guildQueueDepth"
      @check-now="lookup.refetch()"
    >
      <template #visual>
        <div class="w-full flex flex-col gap-2">
          <div v-for="i in 6" :key="i" class="flex items-center gap-3">
            <div class="wsa-skeleton h-4 w-1/4" />
            <div class="wsa-skeleton h-4 w-6 shrink-0" />
            <div class="wsa-skeleton h-4 w-6 shrink-0" />
            <div class="wsa-skeleton h-4 w-10 ml-auto" />
          </div>
        </div>
      </template>
    </PollingState>
  </div>
</template>
