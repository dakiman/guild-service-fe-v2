<template>
  <EmptyTab
    slice="achievements"
    title="No achievements yet"
    message="Achievement categories, Feats of Strength and Legacy will appear here once the next sync completes."
    :icon="Trophy"
  />
</template>

<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
</script>
