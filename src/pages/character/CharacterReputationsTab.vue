<template>
  <EmptyTab
    slice="reputations"
    title="No reputations yet"
    message="Faction and Renown progress will appear here once the next sync completes."
    :icon="Star"
  />
</template>

<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
</script>
