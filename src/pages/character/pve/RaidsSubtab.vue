<template>
  <RaidEncountersList :entries="character.raid_progress" />
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import RaidEncountersList from '@/components/character/RaidEncountersList.vue'

const { character } = useCharacterContext()
</script>
