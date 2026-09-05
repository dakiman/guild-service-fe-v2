import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TableScrollHint from '../TableScrollHint.vue'
describe('TableScrollHint', () => {
  it('renders the mobile-only hint', () => {
    const w = mount(TableScrollHint)
    expect(w.get('[data-testid="scroll-hint"]').text()).toBe('Scroll sideways for more →')
    expect(w.classes()).toContain('sm:hidden')
  })
})
