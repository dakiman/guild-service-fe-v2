<template>
  <div class="flex flex-col gap-6">
    <MirroredEquipmentLayout
      :equipment="character.equipment"
      :render-url="character.media.main"
      :character-name="character.name"
    />
    <ProfessionsStrip :entries="character.professions" />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CharacterStatsCardPlaceholder />
      <!-- PvpRatingsCard slot — Task 5 will add it here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import MirroredEquipmentLayout from '@/components/character/MirroredEquipmentLayout.vue'
import ProfessionsStrip from '@/components/character/ProfessionsStrip.vue'
import CharacterStatsCardPlaceholder from '@/components/character/CharacterStatsCardPlaceholder.vue'

const { character } = useCharacterContext()
</script>
