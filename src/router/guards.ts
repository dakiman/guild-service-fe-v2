import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function applyAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.ready
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { next: to.fullPath } }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'home' }
    }
  })
}
