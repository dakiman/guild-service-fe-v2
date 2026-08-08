import { api } from './client'
import type {
  MetaCompsResponse,
  MetaDungeonsResponse,
  MetaPeriod,
  MetaSpecsResponse,
} from '@/types/meta'

export async function fetchMetaPeriods(opts?: { signal?: AbortSignal }): Promise<MetaPeriod[]> {
  const { data } = await api.get('/meta/periods', { signal: opts?.signal })
  return data.periods
}

export async function fetchMetaSpecs(
  period?: number,
  region?: string,
  opts?: { signal?: AbortSignal },
): Promise<MetaSpecsResponse> {
  const { data } = await api.get('/meta/specs', {
    params: { period, region },
    signal: opts?.signal,
  })
  return data
}

export async function fetchMetaDungeons(
  period?: number,
  region?: string,
  opts?: { signal?: AbortSignal },
): Promise<MetaDungeonsResponse> {
  const { data } = await api.get('/meta/dungeons', {
    params: { period, region },
    signal: opts?.signal,
  })
  return data
}

export async function fetchMetaComps(
  period?: number,
  region?: string,
  opts?: { signal?: AbortSignal },
): Promise<MetaCompsResponse> {
  const { data } = await api.get('/meta/comps', {
    params: { period, region },
    signal: opts?.signal,
  })
  return data
}
