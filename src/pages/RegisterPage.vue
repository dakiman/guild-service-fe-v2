<template>
  <div class="card max-w-md mx-auto bg-base-200">
    <div class="card-body">
      <h1 class="card-title">Create an account</h1>
      <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Name</span>
          </div>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            minlength="2"
            maxlength="125"
            required
            class="input input-bordered w-full"
          />
        </label>

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
          <span>Create account</span>
        </button>
      </form>

      <div class="text-sm mt-4">
        <router-link :to="{ name: 'login' }" class="link link-hover">
          Already have an account? Sign in
        </router-link>
      </div>
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
