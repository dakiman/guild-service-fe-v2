import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// P1.7: guild stats must be reactive to route-param changes. The composable
// captured plain strings at setup, so param-only navigation between guilds kept
// showing the previous guild's stats.
const fetchGuildStats = vi.fn().mockResolvedValue({ member_count: 0 })
vi.mock('@/api/guilds', () => ({
  fetchGuildStats: (...args: unknown[]) => fetchGuildStats(...args),
}))

import { useGuildStats } from '@/composables/useGuildStats'

describe('useGuildStats reactivity (P1.7)', () => {
  beforeEach(() => fetchGuildStats.mockClear())

  it('refetches with new params when the guild identity changes', async () => {
    const region = ref('eu')
    const realm = ref('the-maelstrom')
    const name = ref('echo')

    const Comp = defineComponent({
      setup() {
        useGuildStats(
          () => region.value,
          () => realm.value,
          () => name.value,
        )
        return () => h('div')
      },
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })

    await flushPromises()
    expect(fetchGuildStats).toHaveBeenLastCalledWith('eu', 'the-maelstrom', 'echo')

    name.value = 'method'
    await flushPromises()
    expect(fetchGuildStats).toHaveBeenLastCalledWith('eu', 'the-maelstrom', 'method')
  })
})
