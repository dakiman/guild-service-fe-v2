<template>
  <div class="wsa-card max-w-md mx-auto">
    <h1 class="stats-card-title text-lg mb-4">Create an account</h1>
    <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <label class="flex flex-col gap-1">
        <span class="stats-label font-medium uppercase tracking-wide">Name</span>
        <input
          v-model="name"
          type="text"
          autocomplete="name"
          minlength="2"
          maxlength="125"
          required
          class="wsa-input"
        />
      </label>

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
          autocomplete="new-password"
          minlength="8"
          required
          class="wsa-input"
        />
      </label>

      <div v-if="errorMessage" class="wsa-card !border-red-800/50 !p-3 mt-1">
        <p class="text-sm text-[#ff4444]">{{ errorMessage }}</p>
      </div>

      <button type="submit" class="wsa-btn wsa-btn--primary mt-2 py-2 text-sm" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="wsa-spinner !w-4 !h-4 inline-block mr-2 align-middle"></span>
        <span>Create account</span>
      </button>
    </form>

    <div class="text-sm mt-4">
      <router-link :to="{ name: 'login' }" class="text-wsa-muted hover:text-wsa-heading transition-colors">
        Already have an account? Sign in
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value })
    toast.success('Account created')
    router.push('/')
  } catch (err) {
    const message = getErrorMessage(err, 'Unable to create account. Please try again.')
    errorMessage.value = message
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>
