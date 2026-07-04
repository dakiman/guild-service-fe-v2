import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import type { Region } from '@/types/api'
import { SyncPendingError } from '@/types/api'
import { fetchCharacter } from '@/api/characters'
import { fetchGuild } from '@/api/guilds'

const MAX_POLLING_ATTEMPTS = 12 // ~60s at 5s intervals
const DEFAULT_RETRY_DELAY = 5000

export function useCharacterLookup(
  region: Ref<Region>,
  realm: Ref<string>,
  name: Ref<string>,
) {
  return useQuery({
    queryKey: ['character', region, realm, name] as const,
    queryFn: ({ signal }) => fetchCharacter(region.value, realm.value, name.value, { signal }),
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: (failureCount, error) => {
      if (error instanceof SyncPendingError) return failureCount < MAX_POLLING_ATTEMPTS
      return false
    },
    retryDelay: (_count, error) =>
      error instanceof SyncPendingError ? error.retryAfter : DEFAULT_RETRY_DELAY,
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
}

export function useGuildLookup(
  region: Ref<Region>,
  realm: Ref<string>,
  name: Ref<string>,
  page: Ref<number>,
  perPage = 50,
  filter?: Ref<string>,
) {
  return useQuery({
    queryKey: ['guild', region, realm, name, page, perPage, filter ?? ''] as const,
    queryFn: ({ signal }) =>
      fetchGuild(region.value, realm.value, name.value, perPage, page.value, filter?.value ?? '', {
        signal,
      }),
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: (failureCount, error) => {
      if (error instanceof SyncPendingError) return failureCount < MAX_POLLING_ATTEMPTS
      return false
    },
    retryDelay: (_count, error) =>
      error instanceof SyncPendingError ? error.retryAfter : DEFAULT_RETRY_DELAY,
    // Keep the current page mounted while the next page/filter loads instead of
    // flashing the loading state and unmounting the filter input mid-typing. (P2.5)
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
