import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import * as AuthApi from '@/api/auth'
import type { User } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = useStorage<string | null>('auth.token', null)
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(email: string, password: string) {
    const result = await AuthApi.login(email, password)
    token.value = result.access_token
    user.value = result.user
  }

  async function register(payload: { name: string; email: string; password: string }) {
    const result = await AuthApi.register(payload)
    token.value = result.access_token
    user.value = result.user
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = await AuthApi.fetchMe()
    } catch {
      clearSession()
    }
  }

  async function logout() {
    try {
      await AuthApi.logout()
    } catch {
      /* noop */
    } finally {
      clearSession()
    }
  }

  function clearSession() {
    token.value = null
    user.value = null
  }

  return { token, user, isAuthenticated, login, register, fetchMe, logout, clearSession }
})
