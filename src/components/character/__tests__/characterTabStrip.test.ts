import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { Sparkles } from 'lucide-vue-next'
import CharacterTabStrip from '../CharacterTabStrip.vue'
const Stub = { template: '<div />' }
async function mountStrip() {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/c/summary', name: 'character-summary', component: Stub },
    { path: '/c/talents', name: 'character-talents', component: Stub },
  ] })
  await router.push('/c/summary'); await router.isReady()
  return mount(CharacterTabStrip, { props: { tabs: [
    { label: 'Summary', to: { name: 'character-summary' }, icon: Sparkles },
    { label: 'Talents', to: { name: 'character-talents' }, icon: Sparkles },
  ] }, global: { plugins: [router] } })
}
describe('CharacterTabStrip', () => {
  it('is a labelled nav with aria-current on the active link and no tab roles', async () => {
    const w = await mountStrip()
    const nav = w.get('nav')
    expect(nav.attributes('aria-label')).toBe('Character sections')
    expect(nav.attributes('role')).toBeUndefined()
    expect(w.findAll('[role="tab"]')).toHaveLength(0)
    const links = w.findAll('a')
    expect(links[0].attributes('aria-current')).toBe('page')
    expect(links[1].attributes('aria-current')).toBeUndefined()
    expect(nav.classes()).toContain('overflow-x-auto')
    expect(nav.classes()).toContain('flex-nowrap')
  })
})
