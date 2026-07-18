<template>
  <div class="wsa-card max-w-md mx-auto">
    <h1 class="wsa-text-heading text-[15px] text-lg mb-4">Reset password</h1>

    <div v-if="!hasValidLink" class="flex flex-col gap-3">
      <div class="wsa-card !border-red-800/50 !p-3">
        <p class="text-sm text-[#ff4444]">Invalid or expired reset link</p>
      </div>
      <router-link :to="{ name: 'forgot-password' }" class="text-wsa-muted hover:text-wsa-heading transition-colors text-sm">
        Request a new reset link
      </router-link>
    </div>

    <form v-else class="flex flex-col gap-3" @submit.prevent="onSubmit">
      <label class="flex flex-col gap-1">
        <span class="stats-label font-medium uppercase tracking-wide">New password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          class="wsa-input"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="stats-label font-medium uppercase tracking-wide">Confirm new password</span>
        <input
          v-model="passwordConfirmation"
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
        <span>Reset password</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { resetPassword } from '@/api/auth'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const router = useRouter()

const token = (route.query.token as string) || ''
const email = (route.query.email as string) || ''
const hasValidLink = computed(() => !!token && !!email)

const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  if (isSubmitting.value) return
  errorMessage.value = ''

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    await resetPassword({
      email,
      token,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    toast.success('Password reset')
    router.push({ name: 'login' })
  } catch (err) {
    const message = getErrorMessage(err, 'Unable to reset password. Please try again.')
    errorMessage.value = message
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>
