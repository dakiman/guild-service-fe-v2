import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// F3: query-driven GETs must forward the vue-query AbortSignal so superseded
// autocomplete requests can be cancelled.
const suggestCharacters = vi.fn().mockResolvedValue([])
vi.mock('@/api/characters', () => ({
  suggestCharacters: (...args: unknown[]) => suggestCharacters(...args),
}))
vi.mock('@/api/guilds', () => ({
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))

import NameAutocomplete from '@/components/form/NameAutocomplete.vue'

describe('NameAutocomplete forwards the AbortSignal (F3)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    suggestCharacters.mockClear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes an AbortSignal to suggestCharacters', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(NameAutocomplete, {
      props: { kind: 'character', modelValue: '' },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: { ClassIcon: true, FactionBadge: true },
      },
    })

    await wrapper.setProps({ modelValue: 'arth' })
    // Fire the 200ms debounce → `debounced` updates → the query enables & runs.
    vi.advanceTimersByTime(250)
    await flushPromises()

    expect(suggestCharacters).toHaveBeenCalledWith(
      'arth',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })
})
