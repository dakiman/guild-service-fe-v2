export type Region = 'eu' | 'us' | 'kr' | 'tw'

export interface ApiData<T> {
  data: T
}

// Matches Laravel LengthAwarePaginator::toArray() shape (the BE embeds the paginator
// directly in the JSON response rather than wrapping it in a ResourceCollection).
export interface PaginatorLink {
  url: string | null
  label: string
  active: boolean
}

export interface Paginated<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: PaginatorLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export class SyncPendingError extends Error {
  readonly retryAfter: number
  readonly queueDepth: number
  constructor(retryAfter: number, queueDepth = 0) {
    super('SYNC_PENDING')
    this.name = 'SyncPendingError'
    this.retryAfter = retryAfter
    this.queueDepth = queueDepth
  }
}

export class NotFoundError extends Error {
  constructor() {
    super('NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ThrottledError extends Error {
  readonly retryAfter: number
  constructor(retryAfter: number) {
    super('THROTTLED')
    this.name = 'ThrottledError'
    this.retryAfter = retryAfter
  }
}

export interface CharacterSuggestion {
  region: Region
  realm: string
  display_realm: string | null
  name: string
  display_name: string | null
  class_id: number
  level: number
  faction: string | null
}

export interface GuildSuggestion {
  region: Region
  realm: string
  display_realm: string | null
  name: string
  display_name: string | null
  faction: string
}
