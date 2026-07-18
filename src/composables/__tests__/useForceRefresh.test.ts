import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// Task 7: forceRefresh() must not change the query key (BE cooldown state
// rides in meta.refresh, not the cache key) — it flips a local forceNext
// flag, refetches, and the queryFn reads-and-clears the flag so exactly one
// fetch carries { refresh: true } and every fetch after (automatic or manual)
// goes back to { refresh: false }.
const fetchCharacter = vi.fn()
vi.mock('@/api/characters', () => ({
  fetchCharacter: (...args: unknown[]) => fetchCharacter(...args),
}))

const fetchGuild = vi.fn()
vi.mock('@/api/guilds', () => ({
  fetchGuild: (...args: unknown[]) => fetchGuild(...args),
}))

import { useCharacterLookup, useGuildLookup } from '@/composables/usePollingLookup'

describe('useCharacterLookup forceRefresh', () => {
  beforeEach(() => {
    fetchCharacter.mockReset()
    fetchCharacter.mockResolvedValue({
      data: { id: 1 },
      meta: { forced_refresh: false },
      isStale: false,
      isSyncing: false,
    })
  })

  it('sends refresh:true on exactly the forceRefresh() fetch, refresh:false otherwise', async () => {
    let lookup!: ReturnType<typeof useCharacterLookup>
    const Comp = defineComponent({
      setup() {
        lookup = useCharacterLookup(ref('eu'), ref('the-maelstrom'), ref('cirna'))
        return () => h('div')
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })

    await flushPromises()
    expect(fetchCharacter).toHaveBeenCalledTimes(1)
    expect(fetchCharacter.mock.calls[0][3]).toMatchObject({ refresh: false })

    await lookup.forceRefresh()
    expect(fetchCharacter).toHaveBeenCalledTimes(2)
    expect(fetchCharacter.mock.calls[1][3]).toMatchObject({ refresh: true })

    // The query key must not have changed underneath us — same identity,
    // still one cache entry, plain refetch afterwards goes back to false.
    await lookup.refetch()
    expect(fetchCharacter).toHaveBeenCalledTimes(3)
    expect(fetchCharacter.mock.calls[2][3]).toMatchObject({ refresh: false })
  })
})

describe('useGuildLookup forceRefresh', () => {
  beforeEach(() => {
    fetchGuild.mockReset()
    fetchGuild.mockResolvedValue({
      guild: { id: 1 },
      members: { data: [] },
      meta: { forced_refresh: false, refresh: { available: true, available_at: null, cooldown_seconds: 300 } },
      isStale: false,
      isSyncing: false,
    })
  })

  it('sends refresh:true on exactly the forceRefresh() fetch, refresh:false otherwise', async () => {
    let lookup!: ReturnType<typeof useGuildLookup>
    const page = ref(1)
    const Comp = defineComponent({
      setup() {
        lookup = useGuildLookup(ref('eu'), ref('the-maelstrom'), ref('echo'), page)
        return () => h('div')
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })

    await flushPromises()
    expect(fetchGuild).toHaveBeenCalledTimes(1)
    expect(fetchGuild.mock.calls[0][6]).toMatchObject({ refresh: false })

    await lookup.forceRefresh()
    expect(fetchGuild).toHaveBeenCalledTimes(2)
    expect(fetchGuild.mock.calls[1][6]).toMatchObject({ refresh: true })

    await lookup.refetch()
    expect(fetchGuild).toHaveBeenCalledTimes(3)
    expect(fetchGuild.mock.calls[2][6]).toMatchObject({ refresh: false })
  })
})
