import type { CharacterSummary } from './character'

export interface User {
  id: number
  name: string
  email: string
  bnet_id: string | null
  bnet_tag: string | null
  bnet_region: string | null
  bnet_synced_at: string | null
  bnet_sync_status: 'syncing' | null
  characters: CharacterSummary[]
}

export interface AuthPayload {
  access_token: string
  token_type: 'bearer'
  user: User
}
