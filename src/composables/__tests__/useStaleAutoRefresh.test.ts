import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useStaleAutoRefresh } from '@/composables/useStaleAutoRefresh'

// The stale-auto-refresh loop invalidates the given query key on a poll
// schedule while `isStale` is true: first attempt after `poll_after` seconds
// (default 10), then every 30s, capped at 6 attempts total (~3 min). It
// must stop the moment `isStale` flips false, and never leak timers past
// unmount.
describe('useStaleAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(isStale: Ref<boolean>, opts?: { pollAfterSeconds?: () => number | undefined }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const Comp = defineComponent({
      setup() {
        useStaleAutoRefresh(isStale, () => ['test-key'], opts)
        return () => h('div')
      },
    })

    const wrapper = mount(Comp, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })
    return { invalidateSpy, wrapper }
  }

  it('invalidates at t≈10s by default, then every 30s, capped at 6 attempts', async () => {
    const isStale = ref(true)
    const { invalidateSpy } = setup(isStale)

    await vi.advanceTimersByTimeAsync(9_999)
    expect(invalidateSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: ['test-key'] })

    await vi.advanceTimersByTimeAsync(30_000)
    expect(invalidateSpy).toHaveBeenCalledTimes(2)

    // Advance far past the point where 6 attempts would be exceeded; the
    // loop must cap and stop scheduling further invalidations.
    await vi.advanceTimersByTimeAsync(30_000 * 10)
    expect(invalidateSpy).toHaveBeenCalledTimes(6)
  })

  it('stops polling once stale clears', async () => {
    const isStale = ref(true)
    const { invalidateSpy } = setup(isStale)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)

    isStale.value = false
    await vi.advanceTimersByTimeAsync(60_000)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('honors pollAfterSeconds for the first attempt', async () => {
    const isStale = ref(true)
    const { invalidateSpy } = setup(isStale, { pollAfterSeconds: () => 30 })

    await vi.advanceTimersByTimeAsync(29_999)
    expect(invalidateSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('clears the pending timer on unmount, leaving no dangling invalidate call', async () => {
    const isStale = ref(true)
    const { invalidateSpy, wrapper } = setup(isStale)

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
