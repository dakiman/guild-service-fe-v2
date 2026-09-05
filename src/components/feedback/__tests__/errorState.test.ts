import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import ErrorState from '../ErrorState.vue'
import { NotFoundError, ThrottledError } from '@/types/api'

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

describe('ErrorState mascot art', () => {
  it('shows the sleeping plaque and quip for not-found errors', () => {
    const w = mount(ErrorState, {
      props: { error: new NotFoundError() },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.get('img').attributes('src')).toBe('/brand/state-empty.jpg')
    expect(w.text()).toContain('Nothing need doing here.')
  })

  it('shows the error plaque and quip for generic errors', () => {
    const w = mount(ErrorState, { props: { error: new Error('boom') } })
    expect(w.get('img').attributes('src')).toBe('/brand/state-error.jpg')
    expect(w.text()).toContain("Job's… not done.")
  })

  it('hides art when hideArt is set', () => {
    const w = mount(ErrorState, { props: { error: new Error('boom'), hideArt: true } })
    expect(w.find('img').exists()).toBe(false)
  })
})

describe('ErrorState not-found + compact', () => {
  it('hides retry and offers a search link for NotFoundError', () => {
    const w = mount(ErrorState, {
      props: { error: new NotFoundError(), kind: 'character' },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.find('button').exists()).toBe(false)
    const link = w.findComponent(RouterLinkStub)
    expect(link.text()).toBe('Search another character')
    expect(link.props('to')).toEqual({ name: 'home' })
  })

  it('renders a single-row banner without art or quip in compact mode', () => {
    const w = mount(ErrorState, { props: { error: new Error('boom'), compact: true } })
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).not.toContain("Job's… not done.")
    expect(w.classes()).toContain('!p-3')
    expect(w.find('button').exists()).toBe(true)
  })

  it('uses plain-language rate-limit copy', () => {
    const w = mount(ErrorState, { props: { error: new ThrottledError(5000) } })
    expect(w.text()).toContain('Too many lookups right now')
    expect(w.text()).not.toContain('endpoint')
  })
})
