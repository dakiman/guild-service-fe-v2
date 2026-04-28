<template>
  <EmptyTab
    slice="collections"
    title="No pets yet"
    message="Account pets will appear here once collections sync is enabled."
    :icon="Cat"
  />
</template>

<script setup lang="ts">
import { Cat } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
</script>
