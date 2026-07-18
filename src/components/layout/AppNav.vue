<template>
  <nav
    class="border-b-2 border-wsa-border flex items-center justify-between px-4 py-2"
    style="background: linear-gradient(135deg, rgb(var(--wsa-card-2)), rgb(var(--wsa-card))); box-shadow: inset 0 0 20px rgba(0,0,0,0.3)"
  >
    <div class="flex items-center gap-1">
      <router-link :to="{ name: 'home' }" class="text-lg font-bold text-wsa-heading hover:brightness-110 transition-all">
        WoW Service
      </router-link>
      <div class="ml-4 hidden gap-1 md:flex">
        <router-link
          v-for="link in navLinks"
          :key="link.name"
          :to="{ name: link.name }"
          class="text-sm px-3 py-1.5 rounded transition-colors"
          :class="isActive(link.name)
            ? 'text-wsa-heading bg-wsa-muted/15 border border-wsa-border'
            : 'text-wsa-muted hover:text-wsa-heading border border-transparent'"
        >
          {{ link.label }}
        </router-link>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <template v-if="auth.isAuthenticated">
        <router-link :to="{ name: 'profile' }" class="text-sm text-wsa-muted hover:text-wsa-heading transition-colors px-2 py-1">
          Profile
        </router-link>
        <button type="button" class="wsa-btn" @click="onLogout">Logout</button>
      </template>
      <template v-else>
        <router-link :to="{ name: 'login' }" class="text-sm text-wsa-muted hover:text-wsa-heading transition-colors px-2 py-1">
          Sign in
        </router-link>
        <router-link :to="{ name: 'register' }" class="wsa-btn wsa-btn--primary">
          Register
        </router-link>
      </template>

      <button
        type="button"
        class="md:hidden text-wsa-muted hover:text-wsa-heading p-1 ml-1"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
        :aria-expanded="mobileOpen"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>

  <div
    v-show="mobileOpen"
    class="md:hidden border-b-2 border-wsa-border px-4 py-3 flex flex-col gap-1"
    style="background: rgb(var(--wsa-bg))"
  >
    <router-link
      v-for="link in navLinks"
      :key="link.name"
      :to="{ name: link.name }"
      class="text-sm px-3 py-2 rounded transition-colors"
      :class="isActive(link.name) ? 'text-wsa-heading bg-wsa-muted/15' : 'text-wsa-muted hover:text-wsa-heading'"
      @click="mobileOpen = false"
    >
      {{ link.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const navLinks = [
  { name: 'home', label: 'Home' },
  { name: 'guild-search', label: 'Guilds' },
  { name: 'character-search', label: 'Characters' },
  { name: 'mythic-plus', label: 'Mythic+' },
  { name: 'raids', label: 'Raids' },
]

function isActive(name: string) {
  return route.name === name
}

async function onLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>
