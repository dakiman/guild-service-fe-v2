import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// Guild lookup parity with useCharacterLookup: while the guild carries
// isSyncing (roster never synced, X-Sync-Status header), the query should
// keep auto-refetching every 30s; once isSyncing flips false, polling stops.
const fetchGuild = vi.fn()
vi.mock('@/api/guilds', () => ({
  fetchGuild: (...args: unknown[]) => fetchGuild(...args),
}))

import { useGuildLookup } from '@/composables/usePollingLookup'

describe('useGuildLookup refetchInterval while syncing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fetchGuild.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls every 30s while isSyncing is true, and stops once synced', async () => {
    fetchGuild.mockResolvedValue({
      guild: { id: 1 },
      members: { data: [] },
      isStale: false,
      isSyncing: true,
    })

    const page = ref(1)
    const Comp = defineComponent({
      setup() {
        useGuildLookup(ref('eu'), ref('the-maelstrom'), ref('echo'), page)
        return () => h('div')
      },
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })

    await flushPromises()
    expect(fetchGuild).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(30_000)
    expect(fetchGuild).toHaveBeenCalledTimes(2)

    // Sync completes: the next resolved fetch flips isSyncing to false.
    fetchGuild.mockResolvedValue({
      guild: { id: 1 },
      members: { data: [] },
      isStale: false,
      isSyncing: false,
    })
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fetchGuild).toHaveBeenCalledTimes(3)

    // No further polling once isSyncing is false.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchGuild).toHaveBeenCalledTimes(3)
  })
})
