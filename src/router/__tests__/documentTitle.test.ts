import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { DEFAULT_TITLE, formatTitle, installDocumentTitle } from '../documentTitle'
const Stub = { template: '<div />' }
describe('document titles', () => {
  it('formatTitle appends the brand', () => {
    expect(formatTitle('Raids')).toBe('Raids · Peon')
    expect(formatTitle(null)).toBe(DEFAULT_TITLE)
  })
  it('sets static titles from meta and leaves dynamic routes alone', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: Stub },
      { path: '/raids', component: Stub, meta: { title: 'Raids' } },
      { path: '/c', component: Stub, meta: { dynamicTitle: true }, children: [{ path: 'tab', component: Stub }] },
    ] })
    installDocumentTitle(router)
    await router.push('/raids'); await router.isReady()
    expect(document.title).toBe('Raids · Peon')
    document.title = 'Melaniya – The Maelstrom · Peon'
    await router.push('/c/tab')
    expect(document.title).toBe('Melaniya – The Maelstrom · Peon')
    await router.push('/')
    expect(document.title).toBe(DEFAULT_TITLE)
  })
})
