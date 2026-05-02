<template>
  <div class="flex flex-col gap-6">
    <TalentTree
      :talents="character.talents"
      :loadout-code="character.talent_loadout_code"
      :classic="isClassic"
      :class-id="character.class_id"
      :tree-id="character.talent_tree_id ?? null"
      :spec-id="character.active_specialization_id ?? null"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import TalentTree from '@/components/character/talents/TalentTree.vue'

const { character, isClassic } = useCharacterContext()
</script>
