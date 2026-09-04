import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/characters', () => ({
  suggestCharacters: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/api/guilds', () => ({
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/composables/usePveGameData', () => ({
  useRealmIndex: () => ({
    data: { value: { realms: [] } },
    isLoading: { value: false },
    isPending: { value: false },
    isError: { value: false },
  }),
}))

import LookupForm from '@/components/form/LookupForm.vue'

function mountIt(props: Record<string, unknown> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(LookupForm, {
    props: { kind: 'character', ...props },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { ClassIcon: true, FactionBadge: true, RatingChip: true },
    },
    attachTo: document.body,
  })
}

describe('LookupForm prefill', () => {
  it('seeds the name input from initialName', () => {
    const w = mountIt({ initialName: 'arthas' })
    const nameInput = w.get('input[aria-label="Character name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('arthas')
    w.unmount()
  })

  it('leaves the name empty without initialName', () => {
    const w = mountIt()
    const nameInput = w.get('input[aria-label="Character name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('')
    w.unmount()
  })

  it('exposes focusRealm() that focuses the realm input', () => {
    const w = mountIt({ initialName: 'arthas' })
    ;(w.vm as unknown as { focusRealm: () => void }).focusRealm()
    expect(document.activeElement).toBe(w.get('input[aria-label="Realm"]').element)
    w.unmount()
  })
})
