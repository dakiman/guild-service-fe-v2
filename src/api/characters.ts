import { api } from './client'
import { NotFoundError, SyncPendingError } from '@/types/api'
import type { CharacterLookupResult, CharacterResource, CharacterSummary } from '@/types/character'
import type { Region } from '@/types/api'

export async function fetchCharacter(
  region: Region,
  realm: string,
  name: string,
): Promise<CharacterLookupResult> {
  const res = await api.get<CharacterResource>(`/characters/${region}/${realm}/${name}`, {
    validateStatus: (s) => s === 200 || s === 202 || s === 404,
  })

  if (res.status === 202) {
    throw new SyncPendingError(parseInt(res.headers['retry-after'] ?? '5', 10) * 1000)
  }

  if (res.status === 404) {
    throw new NotFoundError()
  }

  return {
    data: res.data,
    isStale: res.headers['x-data-staleness'] === 'stale',
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
