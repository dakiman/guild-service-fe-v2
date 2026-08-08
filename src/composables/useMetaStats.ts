import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import type { Ref } from 'vue'
import { fetchMetaComps, fetchMetaDungeons, fetchMetaPeriods, fetchMetaSpecs } from '@/api/meta'
import type {
  MetaCompsResponse,
  MetaDungeonsResponse,
  MetaPeriod,
  MetaPeriodParam,
  MetaRegion,
  MetaSpecsResponse,
} from '@/types/meta'

const FIVE_MINUTES_MS = 5 * 60 * 1000

function concrete(period: MetaPeriodParam): number | undefined {
  return period === 'current' ? undefined : period
}

/**
 * The meta endpoints answer 404 (`not_warmed`) when a scope has no snapshot yet.
 * Anything else — 5xx, network down — is a real failure and must not be dressed
 * up as "check back after the next crawl".
 */
export function isNotWarmedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export function useMetaPeriods() {
  return useQuery<MetaPeriod[]>({
    queryKey: ['meta', 'periods'],
    queryFn: ({ signal }) => fetchMetaPeriods({ signal }),
    staleTime: 60 * 60 * 1000,
  })
}

export function useMetaSpecs(period: Ref<MetaPeriodParam>, region: Ref<MetaRegion>) {
  return useQuery<MetaSpecsResponse>({
    queryKey: ['meta', 'specs', period, region],
    queryFn: ({ signal }) => fetchMetaSpecs(concrete(period.value), region.value, { signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}

export function useMetaDungeons(period: Ref<MetaPeriodParam>, region: Ref<MetaRegion>) {
  return useQuery<MetaDungeonsResponse>({
    queryKey: ['meta', 'dungeons', period, region],
    queryFn: ({ signal }) => fetchMetaDungeons(concrete(period.value), region.value, { signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}

export function useMetaComps(period: Ref<MetaPeriodParam>, region: Ref<MetaRegion>) {
  return useQuery<MetaCompsResponse>({
    queryKey: ['meta', 'comps', period, region],
    queryFn: ({ signal }) => fetchMetaComps(concrete(period.value), region.value, { signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}
