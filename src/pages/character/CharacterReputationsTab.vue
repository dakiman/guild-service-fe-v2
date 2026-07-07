<template>
  <div class="flex flex-col gap-4">
    <EmptyTab
      v-if="!hasEntries"
      slice="reputations"
      :freshness="freshness.reputations"
      title="No reputations yet"
      message="Reputations will appear here once the next sync completes."
      :icon="Star"
    />

    <ReputationsList v-else :entries="character.reputations ?? null" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import EmptyTab from '@/components/character/EmptyTab.vue'
import ReputationsList from '@/components/character/ReputationsList.vue'

const { character, freshness } = useCharacterContext()

const hasEntries = computed(() => (character.value.reputations?.length ?? 0) > 0)
</script>
