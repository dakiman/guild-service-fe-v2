<template>
  <nav class="navbar bg-base-200">
    <div class="flex-1">
      <router-link :to="{ name: 'home' }" class="btn btn-ghost text-xl normal-case">
        WoW Service
      </router-link>
      <div class="ml-2 hidden gap-1 md:flex">
        <router-link :to="{ name: 'home' }" class="btn btn-ghost btn-sm">Home</router-link>
        <router-link :to="{ name: 'guild-search' }" class="btn btn-ghost btn-sm">Guilds</router-link>
        <router-link :to="{ name: 'character-search' }" class="btn btn-ghost btn-sm">
          Characters
        </router-link>
      </div>
    </div>
    <div class="flex-none gap-1">
      <template v-if="auth.isAuthenticated">
        <router-link :to="{ name: 'profile' }" class="btn btn-ghost btn-sm">Profile</router-link>
        <button class="btn btn-ghost btn-sm" type="button" @click="onLogout">Logout</button>
      </template>
      <template v-else>
        <router-link :to="{ name: 'login' }" class="btn btn-ghost btn-sm">Login</router-link>
        <router-link :to="{ name: 'register' }" class="btn btn-primary btn-sm">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>
