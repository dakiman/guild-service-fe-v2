import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, ref, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { UseQueryReturnType } from '@tanstack/vue-query'

// P2.5: paging/filtering a guild roster must keep the previous page mounted
// (placeholderData: keepPreviousData) instead of dropping to the loading state
// and unmounting the filter input mid-typing.
let resolvePage2: () => void
const fetchGuild = vi.fn()
vi.mock('@/api/guilds', () => ({
  fetchGuild: (...args: unknown[]) => fetchGuild(...args),
}))

import { useGuildLookup } from '@/composables/usePollingLookup'

describe('useGuildLookup keepPreviousData (P2.5)', () => {
  beforeEach(() => {
    fetchGuild.mockReset()
    fetchGuild.mockImplementation((_r, _realm, _n, _pp, page: number) => {
      if (page === 1) return Promise.resolve({ data: [{ id: 1 }], current_page: 1 })
      return new Promise((res) => {
        resolvePage2 = () => res({ data: [{ id: 2 }], current_page: 2 })
      })
    })
  })

  it('retains the previous page while the next page is still loading', async () => {
    const page = ref(1)
    let query!: UseQueryReturnType<{ current_page: number }, Error>

    const Comp = defineComponent({
      setup() {
        query = useGuildLookup(ref('eu'), ref('the-maelstrom'), ref('echo'), page) as never
        return () => h('div')
      },
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })

    await flushPromises()
    expect(query.data.value?.current_page).toBe(1)

    // Navigate to page 2 — its fetch stays pending.
    page.value = 2
    await nextTick()
    await flushPromises()

    // With keepPreviousData the page-1 data survives the transition (not undefined).
    expect(query.data.value?.current_page).toBe(1)

    resolvePage2()
    await flushPromises()
    expect(query.data.value?.current_page).toBe(2)
  })
})
