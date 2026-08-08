import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useMetaSpecs } from '@/composables/useMetaStats'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

vi.mock('@/api/meta', () => ({
  fetchMetaPeriods: vi.fn(),
  fetchMetaSpecs: vi.fn().mockResolvedValue({ period_id: 1002, region: 'all', brackets: {} }),
  fetchMetaDungeons: vi.fn(),
  fetchMetaComps: vi.fn(),
}))

import { fetchMetaSpecs } from '@/api/meta'

function mountWith(period: MetaPeriodParam, region: MetaRegion) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result: ReturnType<typeof useMetaSpecs> | undefined
  const Host = defineComponent({
    setup() {
      result = useMetaSpecs(ref(period), ref(region))
      return () => h('div')
    },
  })
  mount(Host, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })
  return () => result!
}

describe('useMetaSpecs', () => {
  it('maps "current" period to an omitted param', async () => {
    const get = mountWith('current', 'all')
    await flushPromises()
    expect(vi.mocked(fetchMetaSpecs)).toHaveBeenCalledWith(undefined, 'all', expect.anything())
    expect(get().data.value?.period_id).toBe(1002)
  })

  it('passes a concrete period through', async () => {
    mountWith(1001, 'eu')
    await flushPromises()
    expect(vi.mocked(fetchMetaSpecs)).toHaveBeenCalledWith(1001, 'eu', expect.anything())
  })
})
