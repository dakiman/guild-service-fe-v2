<template>
  <div class="flex flex-col gap-6">
    <TalentTree
      :talents="character.talents"
      :loadout-code="character.talent_loadout_code"
      :classic="isClassic"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import TalentTree from '@/components/character/TalentTree.vue'

const { character, isClassic } = useCharacterContext()
</script>
