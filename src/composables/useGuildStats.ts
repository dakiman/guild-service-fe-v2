import { useQuery } from '@tanstack/vue-query'
import { fetchGuildStats } from '@/api/guilds'
import type { GuildStatsResponse } from '@/types/guild'

const FIVE_MINUTES_MS = 5 * 60 * 1000

export function useGuildStats(region: string, realm: string, name: string) {
  return useQuery<GuildStatsResponse>({
    queryKey: ['guild', 'stats', region, realm, name],
    queryFn: () => fetchGuildStats(region, realm, name),
    staleTime: FIVE_MINUTES_MS,
  })
}
