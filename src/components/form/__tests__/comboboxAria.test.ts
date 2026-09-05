import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/composables/usePveGameData', () => ({
  useRealmIndex: () => ({
    data: {
      value: {
        realms: [
          { slug: 'draenor', name: 'Draenor', region: 'eu' },
          { slug: 'kazzak', name: 'Kazzak', region: 'eu' },
        ],
      },
    },
    isLoading: { value: false },
    isPending: { value: false },
    isError: { value: false },
  }),
}))

import RealmCombobox from '@/components/form/RealmCombobox.vue'

function mountIt(props: Record<string, unknown> = {}) {
  return mount(RealmCombobox, {
    props: { modelValue: null, ...props },
    attachTo: document.body,
  })
}

describe('RealmCombobox ARIA wiring', () => {
  it('wires aria-controls and aria-activedescendant to the highlighted option', async () => {
    const w = mountIt()
    const input = w.get('input[role="combobox"]')
    await input.trigger('focus')
    await input.setValue('a')
    await nextTick()
    const list = w.get('ul[role="listbox"]')
    expect(input.attributes('aria-controls')).toBe(list.attributes('id'))
    const options = w.findAll('[role="option"]')
    expect(options[0].attributes('id')).toBe(`${list.attributes('id')}-opt-0`)
    // First suggestion is pre-highlighted, so activedescendant points at it
    // before any arrow key (APG pattern; also what lets Enter pick it).
    expect(input.attributes('aria-activedescendant')).toBe(options[0].attributes('id'))
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(options[1].attributes('id'))
    expect(w.find('div[role="listbox"]').exists()).toBe(false)
    w.unmount()
  })
})
