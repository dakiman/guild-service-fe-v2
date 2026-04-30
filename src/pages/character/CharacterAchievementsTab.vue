<template>
  <div class="flex flex-col gap-4">
    <EmptyTab
      v-if="!hasEntries"
      slice="achievements"
      :freshness="freshness.achievements"
      title="No achievements yet"
      message="Achievements will appear here once the next sync completes."
      :icon="Trophy"
    />

    <AchievementsList v-else :entries="character.achievements" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Trophy } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import EmptyTab from '@/components/character/EmptyTab.vue'
import AchievementsList from '@/components/character/AchievementsList.vue'

const { character, freshness } = useCharacterContext()

const hasEntries = computed(() => character.value.achievements.length > 0)
</script>
