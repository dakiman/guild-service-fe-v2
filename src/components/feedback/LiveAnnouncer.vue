<template>
  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
</template>

<script setup lang="ts">
import { useAnnounce } from '@/composables/useAnnounce'

// The only role="status" element in the app — see useAnnounce.
const { announcement } = useAnnounce()
</script>
