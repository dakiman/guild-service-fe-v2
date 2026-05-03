import { api } from './client'
import { NotFoundError, SyncPendingError } from '@/types/api'
import type {
  GuildDiscoverData,
  GuildLookupResult,
  GuildMember,
  GuildResource,
  GuildSummary,
} from '@/types/guild'
import type { GuildSuggestion, Paginated, Region } from '@/types/api'

export async function fetchGuild(
  region: Region,
  realm: string,
  name: string,
  perPage = 50,
  page = 1,
): Promise<GuildLookupResult> {
  const res = await api.get<{ guild: GuildResource; members: Paginated<GuildMember> }>(
    `/guilds/${region}/${realm}/${name}`,
    {
      params: { per_page: perPage, page },
      validateStatus: (s) => s === 200 || s === 202 || s === 404,
    },
  )

  if (res.status === 202) {
    throw new SyncPendingError(parseInt(res.headers['retry-after'] ?? '5', 10) * 1000)
  }

  if (res.status === 404) {
    throw new NotFoundError()
  }

  return {
    guild: res.data.guild,
    members: res.data.members,
    isStale: res.headers['x-data-staleness'] === 'stale',
  }
}

export async function fetchPopularGuilds(): Promise<{
  recently_searched: GuildSummary[]
  most_popular: GuildSummary[]
}> {
  const res = await api.get<{
    recently_searched: GuildSummary[]
    most_popular: GuildSummary[]
  }>('/guilds/popular')
  return res.data
}

export async function fetchDiscoverGuilds(): Promise<GuildDiscoverData> {
  const res = await api.get<GuildDiscoverData>('/guilds/discover')
  return res.data
}

export async function suggestGuilds(q: string): Promise<GuildSuggestion[]> {
  const res = await api.get<{ suggestions: GuildSuggestion[] }>('/guilds/suggest', {
    params: { q },
  })
  return res.data.suggestions
}
