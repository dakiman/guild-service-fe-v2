<template>
  <div class="max-w-2xl mx-auto mt-10">
    <ErrorState
      :error="notFoundError"
      title="Page not found"
      message="This page doesn't exist — the URL may be mistyped or out of date."
    >
      <template #actions>
        <router-link :to="{ name: 'home' }" class="wsa-btn">Back to the mines</router-link>
      </template>
    </ErrorState>
  </div>
</template>

<script setup lang="ts">
import ErrorState from '@/components/feedback/ErrorState.vue'
import { NotFoundError } from '@/types/api'

const notFoundError = new NotFoundError()
</script>
