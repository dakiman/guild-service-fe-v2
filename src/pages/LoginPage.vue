<template>
  <div class="card max-w-md mx-auto bg-base-200">
    <div class="card-body">
      <h1 class="card-title">Sign in</h1>
      <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
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

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Password</span>
          </div>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="input input-bordered w-full"
          />
        </label>

        <div v-if="errorMessage" class="alert alert-error">
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="btn btn-primary mt-2" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          <span>Sign in</span>
        </button>
      </form>

      <div class="flex justify-between text-sm mt-4">
        <router-link :to="{ name: 'register' }" class="link link-hover">
          Don't have an account? Register
        </router-link>
        <router-link :to="{ name: 'forgot-password' }" class="link link-hover">
          Forgot password?
        </router-link>
      </div>
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
