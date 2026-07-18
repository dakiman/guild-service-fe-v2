import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorState from '../ErrorState.vue'

describe('ErrorState', () => {
  it('hides the retry button when hideRetry is set', () => {
    const w = mount(ErrorState, {
      props: { title: 'Failed to load stats', hideRetry: true },
    })
    expect(w.find('button').exists()).toBe(false)
    expect(w.text()).toContain('Failed to load stats')
  })

  it('shows the retry button by default', () => {
    const w = mount(ErrorState, { props: { title: 'Nope' } })
    expect(w.find('button').exists()).toBe(true)
  })
})
