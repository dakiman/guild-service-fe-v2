import type { Router } from 'vue-router'
export const DEFAULT_TITLE = 'Peon — WoW Character & Guild Lookup'
export function formatTitle(title?: string | null): string {
  return title ? `${title} · Peon` : DEFAULT_TITLE
}
export function installDocumentTitle(router: Router): void {
  router.afterEach((to) => {
    if (to.meta.dynamicTitle) return // data-driven pages own their title (useDocumentTitle)
    document.title = formatTitle(typeof to.meta.title === 'string' ? to.meta.title : null)
  })
}
