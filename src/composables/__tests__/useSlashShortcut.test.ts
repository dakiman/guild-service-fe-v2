import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useSlashShortcut, isEditableTarget } from '../useSlashShortcut'

function mountWith(handler: () => void) {
  const Comp = defineComponent({
    setup() {
      useSlashShortcut(handler)
      return () => h('div')
    },
  })
  return mount(Comp, { attachTo: document.body })
}

function press(key: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(ev)
  return ev
}

describe('useSlashShortcut', () => {
  it('calls the handler and prevents default on a bare "/"', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    const ev = press('/')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(ev.defaultPrevented).toBe(true)
    w.unmount()
  })

  it('ignores other keys and modified "/"', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    press('a')
    press('/', document.body, { ctrlKey: true })
    press('/', document.body, { metaKey: true })
    press('/', document.body, { altKey: true })
    expect(handler).not.toHaveBeenCalled()
    w.unmount()
  })

  it('ignores "/" typed into an input, textarea, select or contenteditable', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    for (const tag of ['input', 'textarea', 'select']) {
      const el = document.createElement(tag)
      document.body.appendChild(el)
      const ev = press('/', el)
      expect(ev.defaultPrevented).toBe(false)
      el.remove()
    }
    const ce = document.createElement('div')
    ce.setAttribute('contenteditable', 'true')
    document.body.appendChild(ce)
    press('/', ce)
    ce.remove()
    expect(handler).not.toHaveBeenCalled()
    w.unmount()
  })

  it('stops listening after unmount', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    w.unmount()
    press('/')
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('isEditableTarget', () => {
  it('is false for null and plain elements', () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget(document.createElement('div'))).toBe(false)
  })
})
