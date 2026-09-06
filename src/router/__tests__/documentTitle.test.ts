import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { DEFAULT_TITLE, NOT_FOUND_TITLE, formatTitle, installDocumentTitle, lookupTitle } from '../documentTitle'
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
  it('lookupTitle builds a title from slugs and prefers display casing when given', () => {
    expect(lookupTitle('melaniya', 'the-maelstrom')).toBe('Melaniya – The Maelstrom')
    expect(lookupTitle('melaniya', 'the-maelstrom', { name: 'Melaniya', realm: 'The Maelstrom' })).toBe('Melaniya – The Maelstrom')
    expect(lookupTitle('balkanika', 'the-maelstrom', undefined, 'guild')).toBe('Balkanika – The Maelstrom')
    expect(lookupTitle('the-old-guard', 'the-maelstrom', { name: 'The Old Guard' }, 'guild')).toBe('The Old Guard – The Maelstrom')
    expect(formatTitle(NOT_FOUND_TITLE)).toBe('Not found · Peon')
  })
})
