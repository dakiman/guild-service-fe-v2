<template>
  <div class="flex flex-col gap-6">
    <MirroredEquipmentLayout
      :equipment="character.equipment"
      :render-url="character.media.main"
      :character-name="character.name"
    />
    <ProfessionsStrip :entries="character.professions" />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CharacterStatsCard :stats="character.stats" />
      <PvpRatingsCard :brackets="character.pvp_brackets" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import MirroredEquipmentLayout from '@/components/character/MirroredEquipmentLayout.vue'
import ProfessionsStrip from '@/components/character/ProfessionsStrip.vue'
import CharacterStatsCard from '@/components/character/CharacterStatsCard.vue'
import PvpRatingsCard from '@/components/character/PvpRatingsCard.vue'

const { character } = useCharacterContext()
</script>
