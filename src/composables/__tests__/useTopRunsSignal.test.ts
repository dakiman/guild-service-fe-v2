import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// F3: useTopRuns must forward the vue-query AbortSignal, so a superseded page
// request is cancelled (its signal fires `aborted`) when the page ref changes.
const fetchTopRuns = vi.fn()
vi.mock('@/api/stats', () => ({
  fetchTopRuns: (...args: unknown[]) => fetchTopRuns(...args),
}))

import { useTopRuns } from '@/composables/useCharacterStats'

function mountWith(page: ReturnType<typeof ref<number>>) {
  const Comp = defineComponent({
    setup() {
      useTopRuns(page as ReturnType<typeof ref<number>> & { value: number })
      return () => h('div')
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })
}

describe('useTopRuns forwards the AbortSignal (F3)', () => {
  beforeEach(() => {
    fetchTopRuns.mockReset()
  })

  it('passes an AbortSignal to fetchTopRuns', async () => {
    fetchTopRuns.mockResolvedValue({ data: [], total: 0, per_page: 20, current_page: 1 })
    const page = ref(1)
    mountWith(page)
    await flushPromises()

    const lastArgs = fetchTopRuns.mock.calls.at(-1)!
    // fetchTopRuns(page, perPage, dungeonId, { signal })
    expect(lastArgs.at(-1)).toEqual(expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('aborts the first request when the page changes before it resolves', async () => {
    // Never resolve, so changing the page cancels the in-flight request.
    fetchTopRuns.mockImplementation(() => new Promise(() => {}))
    const page = ref(1)
    mountWith(page)
    await flushPromises()

    const firstOpts = fetchTopRuns.mock.calls[0].at(-1) as { signal: AbortSignal }
    expect(firstOpts.signal.aborted).toBe(false)

    page.value = 2
    await flushPromises()

    expect(firstOpts.signal.aborted).toBe(true)
  })
})
