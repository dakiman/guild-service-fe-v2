import { onMounted, onBeforeUnmount } from 'vue'

/** True when keystrokes on `target` are text input (so "/" must not be hijacked). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * GitHub-style "/" shortcut: calls `onSlash` when "/" is pressed outside an editable
 * element with no modifier held. Registered on the document for the component's lifetime.
 */
export function useSlashShortcut(onSlash: () => void): void {
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
    if (isEditableTarget(e.target)) return
    e.preventDefault()
    onSlash()
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
