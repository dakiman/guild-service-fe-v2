import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BrandLockup from '../BrandLockup.vue'

describe('BrandLockup', () => {
  it('renders the SVG mark and typeset wordmark', () => {
    const w = mount(BrandLockup)
    const img = w.get('img')
    // The template's literal `src="/favicon.svg"` is rewritten by @vitejs/plugin-vue's
    // asset handling into an inlined SVG data URI (AppNav.vue resolves the same way),
    // so accept either the raw public path or the inlined mark.
    expect(img.attributes('src')).toMatch(/^(\/favicon\.svg$|data:image\/svg\+xml,)/)
    expect(img.attributes('alt')).toBe('')
    expect(img.attributes('aria-hidden')).toBe('true')
    expect(w.text()).toContain('PEON')
  })
})
