import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : `/${to.name}`"><slot /></a>',
}

function mountFooter() {
  return mount(AppFooter, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('AppFooter', () => {
  it('shows the Peon brand line', () => {
    expect(mountFooter().text()).toContain('© Peon · peon.pro')
  })

  it('links to the About page', () => {
    const link = mountFooter().find('a[href="/about"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('About & data sources')
  })
})
