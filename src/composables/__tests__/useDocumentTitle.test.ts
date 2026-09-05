import { describe, it, expect } from 'vitest'
import { defineComponent, h, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useDocumentTitle } from '../useDocumentTitle'
describe('useDocumentTitle', () => {
  it('writes the formatted title when the source resolves and tracks changes', async () => {
    const name = ref<string | null>(null)
    document.title = 'x'
    mount(defineComponent({ setup() { useDocumentTitle(() => name.value); return () => h('div') } }))
    expect(document.title).toBe('x')
    name.value = 'Melaniya – The Maelstrom'
    await nextTick()
    expect(document.title).toBe('Melaniya – The Maelstrom · Peon')
  })
})
