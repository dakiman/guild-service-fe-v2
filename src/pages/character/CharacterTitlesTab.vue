<template>
  <EmptyTab
    slice="titles"
    title="No titles yet"
    message="Titles will appear here once the next sync completes."
    :icon="Crown"
  />
</template>

<script setup lang="ts">
import { Crown } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
</script>
