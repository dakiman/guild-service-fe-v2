import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import type { User } from '@/types/auth'

const { authState } = vi.hoisted(() => ({
  authState: { user: null as unknown },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: authState.user, fetchMe: vi.fn() }),
}))
vi.mock('@/utils/env', () => ({
  env: { blizzardClientId: 'test-client', blizzardRedirectUri: 'http://localhost/callback' },
}))
vi.mock('@/api/blizzard', () => ({ mintOAuthState: vi.fn() }))
vi.mock('@/api/characters', () => ({ toggleRecruitment: vi.fn() }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import ProfilePage from '@/pages/ProfilePage.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

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

export function mountPage(user: User) {
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
