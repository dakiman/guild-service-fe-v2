<template>
  <nav
    class="relative z-30 border-b-2 border-wsa-border flex items-center justify-between gap-3 px-4 py-2"
    style="background: linear-gradient(135deg, rgb(var(--wsa-card-2)), rgb(var(--wsa-card))); box-shadow: inset 0 0 20px rgba(0,0,0,0.3)"
  >
    <div class="flex min-w-0 items-center gap-1">
      <router-link
        :to="{ name: 'home' }"
        class="flex items-center gap-2 text-lg font-bold text-wsa-heading hover:brightness-110 transition-all"
      >
        <img src="/favicon.svg" alt="" aria-hidden="true" class="h-6 w-6" />
        <span class="font-display tracking-[0.18em]">PEON</span>
      </router-link>
      <div class="ml-4 hidden gap-1 lg:flex">
        <router-link
          v-for="link in NAV_LINKS"
          :key="link.name"
          :to="{ name: link.name }"
          class="whitespace-nowrap text-sm px-3 py-1.5 rounded transition-colors"
          :class="isNavActive(link, route.name)
            ? 'text-wsa-heading bg-wsa-muted/15 border border-wsa-border'
            : 'text-wsa-muted hover:text-wsa-heading border border-transparent'"
          :aria-current="isNavActive(link, route.name) ? 'page' : undefined"
        >
          {{ link.label }}
        </router-link>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <NavSearch ref="desktopSearch" compact class="hidden lg:block" />

      <template v-if="auth.isAuthenticated">
        <router-link :to="{ name: 'profile' }" class="text-sm text-wsa-muted hover:text-wsa-heading transition-colors px-2 py-1">
          Profile
        </router-link>
        <button type="button" class="wsa-btn" @click="onLogout">Logout</button>
      </template>
      <template v-else>
        <router-link :to="{ name: 'login' }" class="whitespace-nowrap text-sm text-wsa-muted hover:text-wsa-heading transition-colors px-2 py-1">
          Sign in
        </router-link>
        <router-link :to="{ name: 'register' }" class="wsa-btn wsa-btn--primary whitespace-nowrap">
          Register
        </router-link>
      </template>

      <button
        type="button"
        class="lg:hidden text-wsa-muted hover:text-wsa-heading p-1 ml-1"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
        :aria-expanded="mobileOpen"
        aria-controls="mobile-menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>

  <div
    id="mobile-menu"
    v-show="mobileOpen"
    class="lg:hidden relative z-20 border-b-2 border-wsa-border px-4 py-3 flex flex-col gap-1"
    style="background: rgb(var(--wsa-bg))"
  >
    <NavSearch ref="mobileSearch" class="mb-2" @navigated="mobileOpen = false" />
    <router-link
      v-for="link in NAV_LINKS"
      :key="link.name"
      :to="{ name: link.name }"
      class="text-sm px-3 py-2 rounded transition-colors"
      :class="isNavActive(link, route.name) ? 'text-wsa-heading bg-wsa-muted/15' : 'text-wsa-muted hover:text-wsa-heading'"
      :aria-current="isNavActive(link, route.name) ? 'page' : undefined"
      @click="mobileOpen = false"
    >
      {{ link.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavSearch from '@/components/layout/NavSearch.vue'
import { NAV_LINKS, isNavActive } from '@/components/layout/navLinks'
import { useSlashShortcut } from '@/composables/useSlashShortcut'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const desktopSearch = ref<{ focus: () => void } | null>(null)
const mobileSearch = ref<{ focus: () => void } | null>(null)

/** Mirrors Tailwind's `lg` breakpoint — the width at which the bar shows links + search. */
function isDesktop(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches
}

useSlashShortcut(async () => {
  if (isDesktop()) {
    desktopSearch.value?.focus()
    return
  }
  mobileOpen.value = true
  await nextTick()
  mobileSearch.value?.focus()
})

async function onLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>
