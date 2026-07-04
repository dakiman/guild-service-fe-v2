import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { fetchGuildStats } from '@/api/guilds'
import type { GuildStatsResponse } from '@/types/guild'

const FIVE_MINUTES_MS = 5 * 60 * 1000

// Accept refs/getters and feed reactive identity into the queryKey so
// param-only navigation between guilds refetches instead of showing the
// previous guild's stats. (P1.7)
export function useGuildStats(
  region: MaybeRefOrGetter<string>,
  realm: MaybeRefOrGetter<string>,
  name: MaybeRefOrGetter<string>,
) {
  const regionRef = computed(() => toValue(region))
  const realmRef = computed(() => toValue(realm))
  const nameRef = computed(() => toValue(name))

  return useQuery<GuildStatsResponse>({
    queryKey: ['guild', 'stats', regionRef, realmRef, nameRef],
    queryFn: ({ signal }) => fetchGuildStats(regionRef.value, realmRef.value, nameRef.value, { signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}
