import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'

describe('AppFooter', () => {
  it('shows the Peon brand line', () => {
    const w = mount(AppFooter)
    expect(w.text()).toContain('© Peon · peon.pro')
  })
})
