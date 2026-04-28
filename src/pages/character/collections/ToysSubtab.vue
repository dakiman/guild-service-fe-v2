<template>
  <EmptyTab
    slice="collections"
    title="No toys yet"
    message="Account toys will appear here once collections sync is enabled."
    :icon="Sparkles"
  />
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
</script>
