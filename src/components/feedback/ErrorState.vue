<template>
  <div role="alert" class="alert alert-error">
    <div class="flex-1">
      <h3 class="font-semibold">{{ resolvedTitle }}</h3>
      <p v-if="resolvedMessage" class="text-sm opacity-90">{{ resolvedMessage }}</p>
    </div>
    <div class="flex-none">
      <slot name="actions">
        <button type="button" class="btn btn-sm" @click="emit('retry')">Try again</button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NotFoundError } from '@/types/api'

const props = defineProps<{
  title?: string
  message?: string
  error?: unknown
}>()

const emit = defineEmits<{ retry: [] }>()

const isNotFound = computed(() => props.error instanceof NotFoundError)

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (isNotFound.value) return 'Not found'
  return 'Something went wrong'
})

const resolvedMessage = computed(() => {
  if (props.message) return props.message
  if (isNotFound.value) return "We couldn't find that character/guild on Blizzard."
  return undefined
})
</script>
