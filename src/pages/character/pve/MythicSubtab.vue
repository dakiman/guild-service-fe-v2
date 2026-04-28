<template>
  <DungeonRunsList :runs="character.dungeon_runs" />
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import DungeonRunsList from '@/components/character/DungeonRunsList.vue'

const { character } = useCharacterContext()
</script>
