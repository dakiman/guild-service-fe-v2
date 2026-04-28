<template>
  <EmptyTab
    slice="collections"
    title="No mounts yet"
    message="Account mounts will appear here once collections sync is enabled."
    :icon="Mountain"
  />
</template>

<script setup lang="ts">
import { Mountain } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
</script>
