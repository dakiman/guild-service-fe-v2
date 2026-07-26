import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '../PageHeader.vue'

describe('PageHeader', () => {
  it('renders the brand tile and title', () => {
    const w = mount(PageHeader, {
      props: { icon: '/brand/icon-raids.jpg', title: 'Raids' },
    })
    const img = w.get('img')
    expect(img.attributes('src')).toBe('/brand/icon-raids.jpg')
    expect(img.attributes('alt')).toBe('')
    expect(img.attributes('aria-hidden')).toBe('true')
    expect(w.get('h1').text()).toBe('Raids')
  })

  it('renders right-slot content', () => {
    const w = mount(PageHeader, {
      props: { icon: '/brand/icon-mythicplus.jpg', title: 'Mythic+' },
      slots: { right: '<span data-testid="ctrl">Season MN-1</span>' },
    })
    expect(w.find('[data-testid="ctrl"]').exists()).toBe(true)
  })
})
