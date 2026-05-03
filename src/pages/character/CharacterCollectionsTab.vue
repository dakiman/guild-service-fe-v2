<template>
  <div class="flex flex-col gap-4">
    <CharacterTabStrip :tabs="subTabs" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Mountain, Cat, Sparkles } from 'lucide-vue-next'
import CharacterTabStrip, {
  type TabDescriptor,
} from '@/components/character/CharacterTabStrip.vue'
import { useCharacterContext } from '@/composables/useCharacterContext'

const route = useRoute()
const { character, meta } = useCharacterContext()

const mountCount = computed(() => character.value.mounts?.length ?? 0)
const petCount = computed(() => character.value.pets?.length ?? 0)
const toyCount = computed(() => character.value.toys?.length ?? 0)

const subTabs = computed<TabDescriptor[]>(() => {
  const params = route.params
  const petsEnabled = meta.value?.feature_flags?.pets !== false
  const tabs: TabDescriptor[] = [
    {
      label: mountCount.value ? `Mounts (${mountCount.value})` : 'Mounts',
      to: { name: 'character-collections-mounts', params },
      icon: Mountain,
    },
  ]
  if (petsEnabled) {
    tabs.push({
      label: petCount.value ? `Pets (${petCount.value})` : 'Pets',
      to: { name: 'character-collections-pets', params },
      icon: Cat,
    })
  }
  tabs.push({
    label: toyCount.value ? `Toys (${toyCount.value})` : 'Toys',
    to: { name: 'character-collections-toys', params },
    icon: Sparkles,
  })
  return tabs
})
</script>
