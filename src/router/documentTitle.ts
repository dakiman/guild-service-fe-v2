import type { Router } from 'vue-router'
import { displayGuildName, displayName, displayRealm } from '@/utils/display'
export const DEFAULT_TITLE = 'Peon — WoW Character & Guild Lookup'
export const NOT_FOUND_TITLE = 'Not found'
export function formatTitle(title?: string | null): string {
  return title ? `${title} · Peon` : DEFAULT_TITLE
}
export function installDocumentTitle(router: Router): void {
  router.afterEach((to) => {
    if (to.meta.dynamicTitle) return // data-driven pages own their title (useDocumentTitle)
    document.title = formatTitle(typeof to.meta.title === 'string' ? to.meta.title : null)
  })
}

/**
 * "Melaniya – The Maelstrom": raw Blizzard casing when the page has it,
 * title-cased slugs otherwise — so a dynamic route can title itself from its
 * params at mount instead of inheriting the previous page's title.
 */
export function lookupTitle(
  name: string,
  realm: string,
  display?: { name?: string | null; realm?: string | null },
  kind: 'character' | 'guild' = 'character',
): string {
  const entity = kind === 'guild' ? displayGuildName(name, display?.name) : displayName(name, display?.name)
  return `${entity} – ${displayRealm(realm, display?.realm)}`
}
