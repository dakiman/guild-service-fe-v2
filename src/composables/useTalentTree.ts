import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { getTalentTree } from '@/api/talents'
import type { TalentTreeResponse } from '@/types/talents'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Fetches the full talent-tree topology for a (treeId, specId) pair.
 * Disabled when either id is missing (low-level character with no
 * talents picked) — no 404s are generated. staleTime: Infinity / gcTime: 24h
 * — talent topology only changes on patches, same posture as usePveGameData.
 */
export function useTalentTree(
  treeId: MaybeRefOrGetter<number | null | undefined>,
  specId: MaybeRefOrGetter<number | null | undefined>,
) {
  const enabled = computed(
    () => Boolean(toValue(treeId)) && Boolean(toValue(specId)),
  )

  return useQuery<TalentTreeResponse>({
    queryKey: ['talent-tree', treeId, specId],
    queryFn: ({ signal }) => getTalentTree(toValue(treeId)!, toValue(specId)!, { signal }),
    enabled,
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } } | null)?.response?.status
      if (status === 404) return false
      return failureCount < 2
    },
  })
}
