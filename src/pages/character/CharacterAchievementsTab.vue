<template>
  <div class="flex flex-col gap-4">
    <EmptyTab
      v-if="!achievementsEnabled"
      slice="achievements"
      title="Achievements aren't tracked"
      message="Achievement syncing is disabled on this instance, so there's nothing to show here."
      :icon="Trophy"
    />
    <AchievementsList
      v-else
      :region="character.region"
      :realm="character.realm"
      :name="character.name"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Trophy } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import AchievementsList from '@/components/character/AchievementsList.vue'
import EmptyTab from '@/components/character/EmptyTab.vue'

const { character, meta } = useCharacterContext()
const achievementsEnabled = computed(() => meta.value?.feature_flags?.achievements !== false)
</script>
