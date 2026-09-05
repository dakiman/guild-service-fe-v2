import type { RouterScrollBehavior } from 'vue-router'
export const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (savedPosition) return savedPosition
  if (to.hash) return { el: to.hash }
  if (to.path === from.path) return false // query-only view-state writes (useQueryParam)
  return { top: 0 }
}
