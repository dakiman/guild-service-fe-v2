import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// P1.6: fetchMe() must only clear the session on a 401. A transient 5xx/network
// error at boot used to delete the stored token and log the user out.
const fetchMeMock = vi.fn()
vi.mock('@/api/auth', () => ({
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

import { useAuthStore } from '@/stores/auth'

describe('auth.fetchMe error handling (P1.6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    fetchMeMock.mockReset()
  })

  it('keeps the session on a transient (non-401) error', async () => {
    const store = useAuthStore()
    store.token = 'cached-token'
    fetchMeMock.mockRejectedValue({ response: { status: 503 } })

    await store.fetchMe()

    expect(store.token).toBe('cached-token')
  })

  it('clears the session on a 401', async () => {
    const store = useAuthStore()
    store.token = 'cached-token'
    fetchMeMock.mockRejectedValue({ response: { status: 401 } })

    await store.fetchMe()

    expect(store.token).toBeNull()
  })
})
