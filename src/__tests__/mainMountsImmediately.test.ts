import { afterEach, describe, expect, it, vi } from 'vitest'

// fetchMe never settles — the app must still mount (F1: mount is not gated on
// the auth round-trip). AuthApi.fetchMe is only reached when a token exists, so
// seed one so the store actually calls the never-settling mock.
vi.mock('@/api/auth', () => ({
  fetchMe: vi.fn(() => new Promise(() => {})),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

describe('main.ts mounts immediately', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.resetModules()
  })

  it('renders the app shell without waiting for fetchMe to resolve', async () => {
    localStorage.setItem('auth.token', JSON.stringify('seeded-token'))
    document.body.innerHTML = '<div id="app"></div>'

    await import('@/main')
    // Let Vue flush the synchronous mount.
    await Promise.resolve()

    const root = document.querySelector('#app')
    expect(root).not.toBeNull()
    expect(root!.innerHTML.length).toBeGreaterThan(0)
  })
})
