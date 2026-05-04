import type { Region } from '@/types/api'

const KEY = 'blizzard.oauth.pending'

export interface OAuthPending {
  region: Region
  state: string
  redirectUri: string
}

const VALID_REGIONS: readonly Region[] = ['eu', 'us', 'kr', 'tw'] as const

function isOAuthPending(value: unknown): value is OAuthPending {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.region === 'string' &&
    (VALID_REGIONS as readonly string[]).includes(v.region) &&
    typeof v.state === 'string' &&
    v.state.length > 0 &&
    typeof v.redirectUri === 'string' &&
    v.redirectUri.length > 0
  )
}

export function setOAuthPending(value: OAuthPending): void {
  sessionStorage.setItem(KEY, JSON.stringify(value))
}

export function takeOAuthPending(): OAuthPending | null {
  const raw = sessionStorage.getItem(KEY)
  sessionStorage.removeItem(KEY)
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  return isOAuthPending(parsed) ? parsed : null
}

export function clearOAuthPending(): void {
  sessionStorage.removeItem(KEY)
}
