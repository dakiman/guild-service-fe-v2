<template>
  <div class="card max-w-md mx-auto bg-base-200">
    <div class="card-body">
      <h1 class="card-title">Forgot password</h1>

      <div v-if="submitted" class="alert alert-success">
        <span>If that email exists, a reset link has been sent.</span>
      </div>

      <form v-else class="flex flex-col gap-3" @submit.prevent="onSubmit">
        <p class="text-sm text-base-content/70">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Email</span>
          </div>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="input input-bordered w-full"
          />
        </label>

        <button type="submit" class="btn btn-primary mt-2" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          <span>Send reset link</span>
        </button>
      </form>

      <div class="text-sm mt-4">
        <router-link :to="{ name: 'login' }" class="link link-hover">
          Back to sign in
        </router-link>
      </div>
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
