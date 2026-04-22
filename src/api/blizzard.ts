import { api } from './client'
import type { Region } from '@/types/api'

export async function exchangeOAuthCode(
  region: Region,
  code: string,
  redirectUri: string,
): Promise<void> {
  await api.post(
    `/${region}/blizzard-oauth`,
    { code, redirectUri },
    { validateStatus: (s) => s === 202 },
  )
}
