import { api } from './client'
import { NotFoundError, SyncPendingError, ThrottledError } from '@/types/api'
import type {
  CharacterLookupResult,
  CharacterResource,
  CharacterResponse,
  CharacterSummary,
} from '@/types/character'
import type { CharacterSuggestion, Region } from '@/types/api'

export async function fetchCharacter(
  region: Region,
  realm: string,
  name: string,
  opts?: { signal?: AbortSignal; refresh?: boolean },
): Promise<CharacterLookupResult> {
  const res = await api.get<CharacterResponse>(`/characters/${region}/${realm}/${name}`, {
    validateStatus: (s) => s === 200 || s === 202 || s === 404 || s === 429,
    signal: opts?.signal,
    params: opts?.refresh ? { refresh: 1 } : undefined,
  })

  if (res.status === 202) {
    const body = res.data as { queue_depth?: number } | undefined
    throw new SyncPendingError(
      parseInt(res.headers['retry-after'] ?? '10', 10) * 1000,
      body?.queue_depth ?? 0,
    )
  }

  if (res.status === 404) {
    throw new NotFoundError()
  }

  if (res.status === 429) {
    throw new ThrottledError(parseInt(res.headers['retry-after'] ?? '60', 10) * 1000)
  }

  const { data, meta } = res.data
  const headerStale = res.headers['x-data-staleness'] === 'stale'
  const metaStale = meta?.freshness?.profile === 'stale'
  const headerSyncing = res.headers['x-sync-status'] === 'syncing'

  return {
    data,
    meta,
    isStale: metaStale || headerStale,
    isSyncing: headerSyncing || meta?.sync_status === 'syncing',
  }
}

export async function fetchPopularCharacters(opts?: { signal?: AbortSignal }): Promise<{
  recently_searched: CharacterSummary[]
  most_popular: CharacterSummary[]
}> {
  const res = await api.get<{
    recently_searched: CharacterSummary[]
    most_popular: CharacterSummary[]
  }>('/characters/popular', { signal: opts?.signal })
  return res.data
}

export async function suggestCharacters(
  q: string,
  opts?: { signal?: AbortSignal },
): Promise<CharacterSuggestion[]> {
  const res = await api.get<{ suggestions: CharacterSuggestion[] }>('/characters/suggest', {
    params: { q },
    signal: opts?.signal,
  })
  return res.data.suggestions
}

export async function toggleRecruitment(id: number): Promise<CharacterResource> {
  const res = await api.patch<CharacterResource>(`/characters/${id}/recruitment`)
  return res.data
}
