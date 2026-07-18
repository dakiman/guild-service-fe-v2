<template>
  <div class="wsa-card max-w-md mx-auto">
    <h1 class="wsa-text-heading text-[15px] text-lg mb-4">Sign in</h1>
    <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <label class="flex flex-col gap-1">
        <span class="stats-label font-medium uppercase tracking-wide">Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="wsa-input"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="stats-label font-medium uppercase tracking-wide">Password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="wsa-input"
        />
      </label>

      <div v-if="errorMessage" class="wsa-card !border-red-800/50 !p-3 mt-1">
        <p class="text-sm text-[#ff4444]">{{ errorMessage }}</p>
      </div>

      <button type="submit" class="wsa-btn wsa-btn--primary mt-2 py-2 text-sm" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="wsa-spinner !w-4 !h-4 inline-block mr-2 align-middle"></span>
        <span>Sign in</span>
      </button>
    </form>

    <div class="flex justify-between text-sm mt-4">
      <router-link :to="{ name: 'register' }" class="text-wsa-muted hover:text-wsa-heading transition-colors">
        Don't have an account? Register
      </router-link>
      <router-link :to="{ name: 'forgot-password' }" class="text-wsa-muted hover:text-wsa-heading transition-colors">
        Forgot password?
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await auth.login(email.value, password.value)
    toast.success('Welcome back')
    router.push((route.query.next as string) || '/')
  } catch (err) {
    const message = getErrorMessage(err, 'Unable to sign in. Please try again.')
    errorMessage.value = message
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>
