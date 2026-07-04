import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// F2: RaidHeatmapCard rewrote `expansion` from 'current' to the resolved name in
// a watcher, changing the query key → a second fetch of identical data on mount.
const fetchRaidKillStats = vi.fn()
vi.mock('@/api/stats', () => ({
  fetchRaidKillStats: (...args: unknown[]) => fetchRaidKillStats(...args),
}))
vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn().mockResolvedValue({ instances: [] }),
}))

import RaidHeatmapCard from '@/components/stats/RaidHeatmapCard.vue'

function stats() {
  return {
    current_expansion: 'The War Within',
    expansions: ['The War Within', 'Dragonflight'],
    raids: [],
  }
}

function mountCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(RaidHeatmapCard, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { ClassIcon: true },
    },
  })
}

describe('RaidHeatmapCard single fetch (F2)', () => {
  beforeEach(() => {
    fetchRaidKillStats.mockReset()
    fetchRaidKillStats.mockResolvedValue(stats())
  })

  it('fetches exactly once on mount despite the resolved current-expansion name', async () => {
    mountCard()
    await flushPromises()

    expect(fetchRaidKillStats).toHaveBeenCalledTimes(1)
    expect(fetchRaidKillStats).toHaveBeenCalledWith(
      'heroic',
      'current',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('refetches on a concrete expansion pick, and re-picking current is a cache hit', async () => {
    const wrapper = mountCard()
    await flushPromises()
    expect(fetchRaidKillStats).toHaveBeenCalledTimes(1)

    // Pick Dragonflight → new key → a fetch with the concrete name.
    await wrapper.find('select').setValue('Dragonflight')
    await flushPromises()
    expect(fetchRaidKillStats).toHaveBeenCalledWith(
      'heroic',
      'Dragonflight',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(fetchRaidKillStats).toHaveBeenCalledTimes(2)

    // Pick the resolved current back → maps to 'current' → cache hit, no new fetch.
    await wrapper.find('select').setValue('The War Within')
    await flushPromises()
    expect(fetchRaidKillStats).toHaveBeenCalledTimes(2)
  })
})
