import { useQuery } from '@tanstack/vue-query'
import { fetchSeasonArchive } from '@/api/stats'
import type { SeasonArchivePayload } from '@/types/stats'
import type { Ref } from 'vue'

// Archive payloads are immutable once written — cache forever.
export function useSeasonArchive(slug: Ref<string>) {
  return useQuery<SeasonArchivePayload>({
    queryKey: ['stats', 'archive', slug],
    queryFn: ({ signal }) => fetchSeasonArchive(slug.value, { signal }),
    staleTime: Infinity,
  })
}
