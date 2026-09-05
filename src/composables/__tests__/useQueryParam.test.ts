/* eslint-disable vue/one-component-per-file */
import { describe, it, expect } from 'vitest'
import { defineComponent, h, type WritableComputedRef } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useQueryParam, intParam } from '../useQueryParam'

async function setup(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/x', component: { template: '<div/>' } }] })
  await router.push(path); await router.isReady()
  let page!: WritableComputedRef<number>
  let view!: WritableComputedRef<string>
  mount(defineComponent({ setup() {
    page = useQueryParam<number>('page', { default: 1, parse: intParam })
    view = useQueryParam<string>('view', { default: 'best' })
    return () => h('div')
  } }), { global: { plugins: [router] } })
  return { router, page: () => page, view: () => view }
}

describe('useQueryParam', () => {
  it('reads defaults when absent and parsed values when present', async () => {
    const a = await setup('/x'); expect(a.page().value).toBe(1); expect(a.view().value).toBe('best')
    const b = await setup('/x?page=3&view=all'); expect(b.page().value).toBe(3); expect(b.view().value).toBe('all')
  })
  it('falls back to default on garbage', async () => {
    const s = await setup('/x?page=-4'); expect(s.page().value).toBe(1)
  })
  it('writes via router.replace and drops the key at the default', async () => {
    const s = await setup('/x')
    s.page().value = 2; await flushPromises()
    expect(s.router.currentRoute.value.query.page).toBe('2')
    s.page().value = 1; await flushPromises()
    expect(s.router.currentRoute.value.query.page).toBeUndefined()
  })
  it('works as a local ref without a router', () => {
    let v!: WritableComputedRef<string>
    mount(defineComponent({ setup() { v = useQueryParam<string>('q', { default: 'a' }); return () => h('div') } }))
    v.value = 'b'; expect(v.value).toBe('b')
  })
})
