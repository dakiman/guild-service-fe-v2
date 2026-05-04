import { api } from './client'
import type { Region } from '@/types/api'

export interface OAuthStateResponse {
  state: string
  expires_in: number
}

export async function mintOAuthState(
  region: Region,
  redirectUri: string,
): Promise<OAuthStateResponse> {
  const { data } = await api.post<OAuthStateResponse>(
    `/${region}/blizzard-oauth/state`,
    { redirectUri },
  )
  return data
}

export async function exchangeOAuthCode(
  region: Region,
  code: string,
  redirectUri: string,
  state: string,
): Promise<void> {
  await api.post(
    `/${region}/blizzard-oauth`,
    { code, redirectUri, state },
    { validateStatus: (s) => s === 202 },
  )
}
