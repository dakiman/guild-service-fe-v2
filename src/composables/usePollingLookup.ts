import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { ref, watch, type Ref } from 'vue'
import type { Region } from '@/types/api'
import { SyncPendingError } from '@/types/api'
import { fetchCharacter } from '@/api/characters'
import { fetchGuild } from '@/api/guilds'
import { createPendingTracker, pollingSchedule } from './pollingSchedule'

const DEFAULT_RETRY_DELAY = 5000

// Shared 202-pending plumbing: tracks the first 202 for the current identity
// (drives the pollingSchedule time budget + the PollingState message tiers)
// and resets when the lookup target changes. Takes a getter (not a ref array)
// so Ref<Region> vs Ref<string> variance never bites.
function usePendingBudget(identityKey: () => string) {
  const tracker = createPendingTracker()
  const syncPendingSince = ref<number | null>(null)

  watch(identityKey, () => {
    tracker.reset()
    syncPendingSince.value = null
  })

  return {
    syncPendingSince,
    onSuccess() {
      tracker.reset()
      syncPendingSince.value = null
    },
    retry(_failureCount: number, error: Error): boolean {
      if (!(error instanceof SyncPendingError)) return false
      syncPendingSince.value = tracker.markPending()
      return pollingSchedule(tracker.elapsedMs(), error.retryAfter).retry
    },
    retryDelay(_failureCount: number, error: Error): number {
      return error instanceof SyncPendingError
        ? pollingSchedule(tracker.elapsedMs(), error.retryAfter).delayMs
        : DEFAULT_RETRY_DELAY
    },
    restart() {
      tracker.reset()
      syncPendingSince.value = null
    },
  }
}

export function useCharacterLookup(
  region: Ref<Region>,
  realm: Ref<string>,
  name: Ref<string>,
) {
  const budget = usePendingBudget(() => `${region.value}:${realm.value}:${name.value}`)

  const query = useQuery({
    queryKey: ['character', region, realm, name] as const,
    queryFn: async ({ signal }) => {
      const result = await fetchCharacter(region.value, realm.value, name.value, { signal })
      budget.onSuccess() // 200 resolved: the pending window is over
      return result
    },
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: budget.retry,
    retryDelay: budget.retryDelay,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data?.isSyncing) return false
      const depth = data.meta?.queue_depth ?? 0
      if (depth > 100) return 60_000
      return 30_000
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    ...query,
    syncPendingSince: budget.syncPendingSince,
    // For the post-give-up "Try again" button: restart the polling budget,
    // otherwise pollingSchedule still sees elapsed > GIVE_UP_MS and the
    // refetch fails instantly.
    restartPolling: () => {
      budget.restart()
      return query.refetch()
    },
  }
}

export function useGuildLookup(
  region: Ref<Region>,
  realm: Ref<string>,
  name: Ref<string>,
  page: Ref<number>,
  perPage = 50,
  filter?: Ref<string>,
) {
  const budget = usePendingBudget(() => `${region.value}:${realm.value}:${name.value}`)

  const query = useQuery({
    queryKey: ['guild', region, realm, name, page, perPage, filter ?? ''] as const,
    queryFn: async ({ signal }) => {
      const result = await fetchGuild(
        region.value, realm.value, name.value, perPage, page.value, filter?.value ?? '',
        { signal },
      )
      budget.onSuccess()
      return result
    },
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: budget.retry,
    retryDelay: budget.retryDelay,
    // Keep the current page mounted while the next page/filter loads instead of
    // flashing the loading state and unmounting the filter input mid-typing. (P2.5)
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    ...query,
    syncPendingSince: budget.syncPendingSince,
    restartPolling: () => {
      budget.restart()
      return query.refetch()
    },
  }
}
