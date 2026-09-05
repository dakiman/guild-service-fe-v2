import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import App from '@/App.vue'
vi.mock('vue-sonner', () => ({ Toaster: { template: '<div />' } }))
describe('App shell', () => {
  it('has a skip link targeting the main landmark', () => {
    const w = shallowMount(App, { global: { stubs: { AppNav: true, AppFooter: true, RouterView: true } } })
    const skip = w.get('a[href="#main"]')
    expect(skip.text()).toBe('Skip to content')
    expect(skip.classes()).toContain('sr-only')
    expect(w.get('main').attributes('id')).toBe('main')
    expect(w.get('main').attributes('tabindex')).toBe('-1')
  })
})
