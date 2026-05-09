<template>
  <div class="flex flex-col gap-6">
    <CompactEquipmentBar
      :equipment="character.equipment"
      :render-url="character.media?.main"
      :character-name="character.name"
      :class-id="character.class_id"
      :spec-id="character.active_specialization_id"
      :tree-id="character.talent_tree_id"
      :talents="character.talents"
      :classic="isClassic"
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
import CompactEquipmentBar from '@/components/character/CompactEquipmentBar.vue'
import ProfessionsStrip from '@/components/character/ProfessionsStrip.vue'
import CharacterStatsCard from '@/components/character/CharacterStatsCard.vue'
import PvpRatingsCard from '@/components/character/PvpRatingsCard.vue'

const { character, isClassic } = useCharacterContext()
</script>
