import { api } from './client'
import type { TalentTreeResponse } from '@/types/talents'

const REVALIDATE_HEADERS = { 'Cache-Control': 'no-cache' }

export async function getTalentTree(
  treeId: number,
  specId: number,
  opts?: { signal?: AbortSignal },
): Promise<TalentTreeResponse> {
  const res = await api.get<TalentTreeResponse>(
    `/game-data/talent-trees/${treeId}/${specId}`,
    { headers: REVALIDATE_HEADERS, signal: opts?.signal },
  )
  return res.data
}
