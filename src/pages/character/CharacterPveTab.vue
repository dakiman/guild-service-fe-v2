<template>
  <div class="flex flex-col gap-6">
    <PveHeadlineStrip
      :rating="character.mythic_plus_rating"
      :raid-progress="character.raid_progress"
    />
    <RaidProgressionSection :raid-progress="character.raid_progress" />
    <MythicPlusSection
      :runs="character.dungeon_runs"
      :rating="character.mythic_plus_rating"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import PveHeadlineStrip from '@/components/character/pve/PveHeadlineStrip.vue'
import RaidProgressionSection from '@/components/character/pve/RaidProgressionSection.vue'
import MythicPlusSection from '@/components/character/pve/MythicPlusSection.vue'

const { character } = useCharacterContext()
</script>
