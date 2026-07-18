<template>
  <div class="wsa-card max-w-md mx-auto">
    <h1 class="wsa-text-heading text-[15px] text-lg mb-4">Forgot password</h1>

    <div v-if="submitted" class="wsa-card !border-emerald-800/50 !p-3">
      <p class="text-sm text-emerald-400">If that email exists, a reset link has been sent.</p>
    </div>

    <form v-else class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <p class="text-sm text-wsa-muted">
        Enter your email and we'll send you a link to reset your password.
      </p>

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

      <button type="submit" class="wsa-btn wsa-btn--primary mt-2 py-2 text-sm" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="wsa-spinner !w-4 !h-4 inline-block mr-2 align-middle"></span>
        <span>Send reset link</span>
      </button>
    </form>

    <div class="text-sm mt-4">
      <router-link :to="{ name: 'login' }" class="text-wsa-muted hover:text-wsa-heading transition-colors">
        Back to sign in
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { forgotPassword } from '@/api/auth'

const email = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)

async function onSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await forgotPassword(email.value)
  } catch {
    /* swallow — never reveal whether the email exists */
  } finally {
    isSubmitting.value = false
    submitted.value = true
    toast.success('If that email exists, a reset link has been sent.')
  }
}
</script>
