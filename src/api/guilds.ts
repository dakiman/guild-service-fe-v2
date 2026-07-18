import { api } from './client'
import { NotFoundError, SyncPendingError, ThrottledError } from '@/types/api'
import type {
  GuildDiscoverData,
  GuildLookupResult,
  GuildMember,
  GuildResource,
  GuildStatsResponse,
  GuildSummary,
} from '@/types/guild'
import type { GuildSuggestion, Paginated, Region } from '@/types/api'

export async function fetchGuild(
  region: Region,
  realm: string,
  name: string,
  perPage = 50,
  page = 1,
  filter = '',
  opts?: { signal?: AbortSignal; refresh?: boolean },
): Promise<GuildLookupResult> {
  const params: Record<string, string | number> = { per_page: perPage, page }
  if (filter) params.filter = filter
  if (opts?.refresh) params.refresh = 1

  const res = await api.get<{
    guild: GuildResource
    members: Paginated<GuildMember>
    meta: GuildLookupResult['meta']
  }>(
    `/guilds/${region}/${realm}/${name}`,
    {
      params,
      validateStatus: (s) => s === 200 || s === 202 || s === 404 || s === 429,
      signal: opts?.signal,
    },
  )

  if (res.status === 202) {
    const body = res.data as unknown as { queue_depth?: number } | undefined
    throw new SyncPendingError(
      parseInt(res.headers['retry-after'] ?? '5', 10) * 1000,
      body?.queue_depth ?? 0,
    )
  }

  if (res.status === 404) {
    throw new NotFoundError()
  }

  if (res.status === 429) {
    throw new ThrottledError(parseInt(res.headers['retry-after'] ?? '60', 10) * 1000)
  }

  return {
    guild: res.data.guild,
    members: res.data.members,
    meta: res.data.meta,
    isStale: res.headers['x-data-staleness'] === 'stale',
    isSyncing: res.headers['x-sync-status'] === 'syncing',
  }
}

export async function fetchPopularGuilds(opts?: { signal?: AbortSignal }): Promise<{
  recently_searched: GuildSummary[]
  most_popular: GuildSummary[]
}> {
  const res = await api.get<{
    recently_searched: GuildSummary[]
    most_popular: GuildSummary[]
  }>('/guilds/popular', { signal: opts?.signal })
  return res.data
}

export async function fetchDiscoverGuilds(opts?: { signal?: AbortSignal }): Promise<GuildDiscoverData> {
  const res = await api.get<GuildDiscoverData>('/guilds/discover', { signal: opts?.signal })
  return res.data
}

export async function suggestGuilds(
  q: string,
  opts?: { signal?: AbortSignal },
): Promise<GuildSuggestion[]> {
  const res = await api.get<{ suggestions: GuildSuggestion[] }>('/guilds/suggest', {
    params: { q },
    signal: opts?.signal,
  })
  return res.data.suggestions
}

export async function fetchGuildStats(
  region: string,
  realm: string,
  name: string,
  opts?: { signal?: AbortSignal },
): Promise<GuildStatsResponse> {
  const { data } = await api.get(`/guilds/${region}/${realm}/${name}/stats`, {
    signal: opts?.signal,
  })
  return data
}
