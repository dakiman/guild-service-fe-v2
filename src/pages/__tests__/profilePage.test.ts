import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import type { User } from '@/types/auth'

const { authState } = vi.hoisted(() => ({
  authState: { user: null as unknown, ready: Promise.resolve() as Promise<void> },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: authState.user, fetchMe: vi.fn(), ready: authState.ready }),
}))
vi.mock('@/utils/env', () => ({
  env: { blizzardClientId: 'test-client', blizzardRedirectUri: 'http://localhost/callback' },
}))
vi.mock('@/api/blizzard', () => ({ mintOAuthState: vi.fn() }))
vi.mock('@/api/characters', () => ({ toggleRecruitment: vi.fn() }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { announce } = vi.hoisted(() => ({ announce: vi.fn() }))
vi.mock('@/composables/useAnnounce', () => ({ useAnnounce: () => ({ announce }) }))

import ProfilePage from '@/pages/ProfilePage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import type { CharacterSummary } from '@/types/character'

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Daki',
    email: 'daki@example.com',
    bnet_id: null,
    bnet_tag: null,
    bnet_region: null,
    bnet_synced_at: null,
    bnet_sync_status: null,
    characters: [],
    ...overrides,
  }
}

export function mountPage(user: User | null) {
  authState.user = user
  return mount(ProfilePage, {
    global: {
      stubs: { RouterLink: RouterLinkStub, RegionSelect: true },
    },
  })
}

describe('ProfilePage header', () => {
  it('renders the brand PageHeader', () => {
    const w = mountPage(makeUser())
    const header = w.findComponent(PageHeader)
    expect(header.exists()).toBe(true)
    expect(header.props('icon')).toBe('/brand/icon-profile.jpg')
    expect(header.props('title')).toBe('Profile')
  })
})

describe('ProfilePage account card', () => {
  it('shows a connected badge with tag and region', () => {
    const w = mountPage(
      makeUser({ bnet_id: '123', bnet_tag: 'Daki#2107', bnet_region: 'eu' }),
    )
    const badge = w.get('[data-testid="bnet-badge"]')
    expect(badge.text()).toContain('Daki#2107')
    expect(badge.text()).toContain('EU')
  })

  it('shows a muted not-connected badge without bnet', () => {
    const w = mountPage(makeUser())
    expect(w.get('[data-testid="bnet-badge"]').text()).toContain('Not connected')
  })

  it('surfaces bnet_sync_status with the Work, work… quip', () => {
    const w = mountPage(
      makeUser({ bnet_id: '123', bnet_tag: 'Daki#2107', bnet_region: 'eu', bnet_sync_status: 'syncing' }),
    )
    expect(w.text()).toContain('Work, work…')
  })

  it('hides the syncing quip when not syncing', () => {
    const w = mountPage(makeUser({ bnet_id: '123', bnet_tag: 'Daki#2107', bnet_region: 'eu' }))
    expect(w.text()).not.toContain('Work, work…')
  })
})

export function makeCharacter(overrides: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    id: 42,
    name: 'melaniya',
    realm: 'the-maelstrom',
    region: 'eu',
    display_name: null,
    display_realm: null,
    class_id: 8,
    level: 80,
    faction: 'Horde',
    active_specialization: 'Frost',
    media: 'https://render.example/melaniya.jpg',
    mythic_plus_rating: null,
    region_rank: null,
    recruitment: true,
    ...overrides,
  }
}

describe('ProfilePage character rows', () => {
  it('renders the portrait when media is set', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter()] }))
    const img = w.get('[data-testid="char-portrait"]')
    expect(img.attributes('src')).toBe('https://render.example/melaniya.jpg')
    expect(w.findComponent(ClassIcon).exists()).toBe(false)
  })

  it('falls back to ClassIcon when media is null', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter({ media: null })] }))
    expect(w.find('[data-testid="char-portrait"]').exists()).toBe(false)
    expect(w.findComponent(ClassIcon).props('classId')).toBe(8)
  })

  it('links the whole row to character-detail with canonical params', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter()] }))
    const link = w.findComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({
      name: 'character-detail',
      params: { region: 'eu', realm: 'the-maelstrom', name: 'melaniya' },
    })
    expect(link.text()).toContain('Melaniya')
    expect(link.text()).toContain('The Maelstrom')
  })

  it('shows the active spec as a subtitle and colors the name by class', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter()] }))
    expect(w.text()).toContain('Frost')
    const name = w.get('[data-testid="char-name"]')
    expect(name.attributes('style')).toContain('color:')
  })

  it('keeps the Looking for guild button outside the link', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter()] }))
    const link = w.findComponent(RouterLinkStub)
    expect(link.text()).not.toContain('Looking for guild')
    expect(w.text()).toContain('Looking for guild')
  })
})

describe('ProfilePage character sorting and search', () => {
  function roster(): CharacterSummary[] {
    return [
      makeCharacter({ id: 1, name: 'lowbie', level: 23, media: null }),
      makeCharacter({ id: 2, name: 'melaniya', level: 80, media: null }),
      makeCharacter({ id: 3, name: 'midling', realm: 'silvermoon', level: 60, media: null }),
    ]
  }

  function rowNames(w: ReturnType<typeof mountPage>): string[] {
    return w.findAll('[data-testid="char-name"]').map((n) => n.text())
  }

  it('orders rows by level, highest first', () => {
    const w = mountPage(makeUser({ characters: roster() }))
    expect(rowNames(w)).toEqual(['Melaniya', 'Midling', 'Lowbie'])
  })

  it('filters rows by name, case-insensitive', async () => {
    const w = mountPage(makeUser({ characters: roster() }))
    await w.get('[data-testid="char-search"]').setValue('MEL')
    expect(rowNames(w)).toEqual(['Melaniya'])
  })

  it('matches realm names too', async () => {
    const w = mountPage(makeUser({ characters: roster() }))
    await w.get('[data-testid="char-search"]').setValue('silvermoon')
    expect(rowNames(w)).toEqual(['Midling'])
  })

  it('restores the full sorted list when the search is cleared', async () => {
    const w = mountPage(makeUser({ characters: roster() }))
    const input = w.get('[data-testid="char-search"]')
    await input.setValue('mel')
    expect(rowNames(w)).toEqual(['Melaniya'])
    await input.setValue('')
    expect(rowNames(w)).toEqual(['Melaniya', 'Midling', 'Lowbie'])
  })

  it('shows a no-match note instead of the brand empty state', async () => {
    const w = mountPage(makeUser({ characters: roster() }))
    await w.get('[data-testid="char-search"]').setValue('zzzzz')
    expect(rowNames(w)).toEqual([])
    expect(w.text()).toContain('No characters match')
    expect(w.find('[data-testid="empty-art"]').exists()).toBe(false)
  })

  it('hides the search input when there are no characters', () => {
    const w = mountPage(makeUser())
    expect(w.find('[data-testid="char-search"]').exists()).toBe(false)
  })
})

describe('ProfilePage with a partial user payload', () => {
  it('renders the empty state when the payload omits characters entirely', () => {
    // The login/register payload used to ship without the `characters` key.
    const user = makeUser()
    delete (user as Partial<User>).characters
    const w = mountPage(user)
    expect(w.find('[data-testid="empty-art"]').exists()).toBe(true)
    expect(w.find('[data-testid="char-search"]').exists()).toBe(false)
  })
})

describe('ProfilePage empty state', () => {
  it('renders the brand empty state when there are no characters', () => {
    const w = mountPage(makeUser({ characters: [] }))
    const img = w.get('[data-testid="empty-art"]')
    expect(img.attributes('src')).toBe('/brand/state-empty.jpg')
    expect(img.attributes('alt')).toBe('')
    expect(img.attributes('aria-hidden')).toBe('true')
    expect(w.text()).toContain('No characters yet')
  })
})

describe('ProfilePage signed-out state', () => {
  it('shows a spinner while auth is not yet ready', () => {
    authState.ready = new Promise(() => {})
    const w = mountPage(null)
    expect(w.find('.wsa-spinner').exists()).toBe(true)
    expect(w.text()).not.toContain('No characters yet')
  })

  it('shows a sign-in ErrorState once auth is ready and there is no user', async () => {
    authState.ready = Promise.resolve()
    const w = mountPage(null)
    await flushPromises()
    const link = w.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toEqual({ name: 'login', query: { next: '/profile' } })
    expect(link.text()).toBe('Sign in')
  })
})

describe('ProfilePage syncing state', () => {
  it('shows a syncing message instead of the empty state while bnet_sync_status is syncing', () => {
    const w = mountPage(makeUser({ bnet_sync_status: 'syncing', characters: [] }))
    expect(w.text()).toContain('Syncing your characters from Battle.net')
    expect(w.text()).not.toContain('No characters yet')
  })

  it('announces the Battle.net sync once through the app live region, with no local role=status', async () => {
    announce.mockClear()
    const w = mountPage(makeUser({ bnet_sync_status: 'syncing', characters: [] }))
    await flushPromises()
    expect(w.get('[data-testid="bnet-syncing"]').text()).toContain('Syncing your characters from Battle.net')
    expect(w.find('[role="status"]').exists()).toBe(false)
    expect(announce).toHaveBeenCalledTimes(1)
    expect(announce).toHaveBeenCalledWith('Syncing your characters from Battle.net…')
  })
})

describe('ProfilePage recruitment button', () => {
  it('labels a non-recruiting character as Not looking for guild', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter({ recruitment: false })] }))
    expect(w.text()).toContain('Not looking for guild')
  })

  it('labels a recruiting character as Looking for guild', () => {
    const w = mountPage(makeUser({ characters: [makeCharacter({ recruitment: true })] }))
    expect(w.text()).toContain('Looking for guild')
  })
})
