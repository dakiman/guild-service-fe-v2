import { api } from './client'
import { NotFoundError, SyncPendingError, ThrottledError } from '@/types/api'
import type {
  CharacterLookupResult,
  CharacterResource,
  CharacterResponse,
  CharacterSummary,
} from '@/types/character'
import type { Region } from '@/types/api'

export async function fetchCharacter(
  region: Region,
  realm: string,
  name: string,
): Promise<CharacterLookupResult> {
  const res = await api.get<CharacterResponse>(`/characters/${region}/${realm}/${name}`, {
    validateStatus: (s) => s === 200 || s === 202 || s === 404 || s === 429,
  })

  if (res.status === 202) {
    throw new SyncPendingError(parseInt(res.headers['retry-after'] ?? '5', 10) * 1000)
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

  return {
    data,
    meta,
    isStale: metaStale || headerStale,
  }
}

export async function fetchPopularCharacters(): Promise<{
  recently_searched: CharacterSummary[]
  most_popular: CharacterSummary[]
}> {
  const res = await api.get<{
    recently_searched: CharacterSummary[]
    most_popular: CharacterSummary[]
  }>('/characters/popular')
  return res.data
}

export async function toggleRecruitment(id: number): Promise<CharacterResource> {
  const res = await api.patch<CharacterResource>(`/characters/${id}/recruitment`)
  return res.data
}
