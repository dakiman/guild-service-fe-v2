import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { router } from '@/router'

describe('NotFoundPage', () => {
  it('renders the not-found plaque, quip, and a home link', () => {
    const w = mount(NotFoundPage, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.get('img').attributes('src')).toBe('/brand/state-empty.jpg')
    expect(w.text()).toContain('Page not found')
    expect(w.text()).toContain('Nothing need doing here.')
    expect(w.text()).toContain('Back to the mines')
    expect(w.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'home' })
  })
})

describe('router catch-all', () => {
  it('resolves unknown paths to the not-found route', () => {
    expect(router.resolve('/definitely/not/a/page').name).toBe('not-found')
    expect(router.resolve('/characters').name).toBe('character-search')
  })
})
