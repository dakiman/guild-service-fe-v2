import { useQuery } from '@tanstack/vue-query'
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
    queryFn: () => fetchCharacter(region.value, realm.value, name.value),
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: (failureCount, error) => {
      if (error instanceof SyncPendingError) return failureCount < MAX_POLLING_ATTEMPTS
      // All other typed errors (NotFound, Throttled, …) must bubble to the UI immediately.
      return false
    },
    retryDelay: (_count, error) =>
      error instanceof SyncPendingError ? error.retryAfter : DEFAULT_RETRY_DELAY,
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
    queryFn: () =>
      fetchGuild(region.value, realm.value, name.value, perPage, page.value, filter?.value ?? ''),
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: (failureCount, error) => {
      if (error instanceof SyncPendingError) return failureCount < MAX_POLLING_ATTEMPTS
      return false
    },
    retryDelay: (_count, error) =>
      error instanceof SyncPendingError ? error.retryAfter : DEFAULT_RETRY_DELAY,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
