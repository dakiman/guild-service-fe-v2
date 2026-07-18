import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaginationControls from '../PaginationControls.vue'

describe('PaginationControls', () => {
  it('emits update:page on next, clamps at lastPage', async () => {
    const w = mount(PaginationControls, { props: { page: 5, lastPage: 5 } })
    const buttons = w.findAll('button')
    const next = buttons[buttons.length - 1]
    expect(next.attributes('disabled')).toBeDefined()
    await w.setProps({ page: 4 })
    await next.trigger('click')
    expect(w.emitted('update:page')![0]).toEqual([5])
  })

  it('renders a centered page window around the current page', () => {
    const w = mount(PaginationControls, {
      props: { page: 10, lastPage: 20, windowSize: 5 },
    })
    const labels = w.findAll('button').map((b) => b.text())
    expect(labels).toContain('8')
    expect(labels).toContain('12')
    expect(labels).not.toContain('7')
    expect(labels).not.toContain('13')
  })

  it('shows the summary line when provided', () => {
    const w = mount(PaginationControls, {
      props: { page: 1, lastPage: 20, summary: 'Page 1 of 20 · 967 members' },
    })
    expect(w.text()).toContain('967 members')
  })
})
