<template>
  <div class="flex flex-col gap-6">
    <MirroredEquipmentLayout
      :equipment="character.equipment"
      :render-url="character.media.main"
      :character-name="character.name"
    />
    <CharacterStatsCardPlaceholder />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import MirroredEquipmentLayout from '@/components/character/MirroredEquipmentLayout.vue'
import CharacterStatsCardPlaceholder from '@/components/character/CharacterStatsCardPlaceholder.vue'

const { character } = useCharacterContext()
</script>
