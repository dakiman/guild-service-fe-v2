<template>
  <div class="flex flex-col gap-4">
    <AchievementsList
      :region="character.region"
      :realm="character.realm"
      :name="character.name"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import AchievementsList from '@/components/character/AchievementsList.vue'

const { character } = useCharacterContext()
</script>
