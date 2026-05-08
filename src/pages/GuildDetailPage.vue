<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import GuildHeader from '@/components/guild/GuildHeader.vue'
import GuildStatsSection from '@/components/guild/GuildStatsSection.vue'
import RosterTable from '@/components/guild/RosterTable.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import PollingState from '@/components/feedback/PollingState.vue'
import StaleBadge from '@/components/feedback/StaleBadge.vue'
import { useGuildLookup } from '@/composables/usePollingLookup'
import { useStaleAutoRefresh } from '@/composables/useStaleAutoRefresh'
import type { Region } from '@/types/api'

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
const isStale = computed(() => lookup.data.value?.isStale ?? false)

useStaleAutoRefresh(isStale, () => [
  'guild', region.value, realm.value, name.value, page.value, perPage, debouncedFilter.value,
])

const showError = computed(
  () => !!lookup.error.value && !lookup.isFetching.value,
)
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <ErrorState
      v-if="showError"
      :error="lookup.error.value"
      @retry="lookup.refetch()"
    />

    <template v-else-if="guild && members">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <GuildHeader :guild="guild" class="flex-1" />
      </div>
      <div v-if="isStale" class="flex">
        <StaleBadge :last-synced-at="guild.roster_synced_at ?? undefined" />
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

    <PollingState v-else :attempt="lookup.failureCount.value" />
  </div>
</template>
