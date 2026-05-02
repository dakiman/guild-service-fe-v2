<template>
  <div class="flex flex-wrap gap-1.5 items-center">
    <TalentNode
      v-for="ref in refs"
      :key="ref.node_id"
      :spell-id="ref.spell_id"
      :is-picked="true"
      :is-choice="false"
      :rank-label="ref.rank_label"
      :class-color="classColor"
      :cell-size="36"
    />
  </div>
</template>

<script setup lang="ts">
import TalentNode from './TalentNode.vue'
import type { TalentNodeRef } from '@/types/talents'

defineProps<{
  refs: TalentNodeRef[]
  classColor?: string | null
}>()
</script>
