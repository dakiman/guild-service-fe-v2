<template>
  <div class="card max-w-md mx-auto bg-base-200">
    <div class="card-body">
      <h1 class="card-title">Reset password</h1>

      <div v-if="!hasValidLink" class="flex flex-col gap-3">
        <div class="alert alert-error">
          <span>Invalid or expired reset link</span>
        </div>
        <router-link :to="{ name: 'forgot-password' }" class="link link-hover text-sm">
          Request a new reset link
        </router-link>
      </div>

      <form v-else class="flex flex-col gap-3" @submit.prevent="onSubmit">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">New password</span>
          </div>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            class="input input-bordered w-full"
          />
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Confirm new password</span>
          </div>
          <input
            v-model="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            class="input input-bordered w-full"
          />
        </label>

        <div v-if="errorMessage" class="alert alert-error">
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="btn btn-primary mt-2" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          <span>Reset password</span>
        </button>
      </form>
    </div>
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
