<template>
  <EmptyTab
    slice="raids"
    :freshness="freshness.raids"
    title="No raid data yet"
    message="Raid encounter kills will appear here once raid progress sync lands."
    :icon="Castle"
  />
</template>

<script setup lang="ts">
import { Castle } from 'lucide-vue-next'
import EmptyTab from '@/components/character/EmptyTab.vue'
import { useCharacterContext } from '@/composables/useCharacterContext'

const { freshness } = useCharacterContext()
</script>
