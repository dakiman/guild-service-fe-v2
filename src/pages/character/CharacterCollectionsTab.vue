<template>
  <div class="flex flex-col gap-4">
    <EmptyTab
      v-if="subTabs.length === 0"
      slice="collections"
      title="Collections aren't tracked"
      message="Mount, pet, and toy syncing is disabled on this instance, so there's nothing to show here."
      :icon="Gem"
    />
    <template v-else>
      <CharacterTabStrip :tabs="subTabs" />
      <router-view />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Mountain, Cat, Sparkles, Gem } from 'lucide-vue-next'
import CharacterTabStrip, {
  type TabDescriptor,
} from '@/components/character/CharacterTabStrip.vue'
import { useCharacterContext } from '@/composables/useCharacterContext'
import EmptyTab from '@/components/character/EmptyTab.vue'

const route = useRoute()
const { character, meta } = useCharacterContext()

const mountCount = computed(() => character.value.mounts?.length ?? 0)
const petCount = computed(() => character.value.pets?.length ?? 0)
const toyCount = computed(() => character.value.toys?.length ?? 0)

const subTabs = computed<TabDescriptor[]>(() => {
  const params = route.params
  const mountsEnabled = meta.value?.feature_flags?.mounts !== false
  const petsEnabled = meta.value?.feature_flags?.pets !== false
  const toysEnabled = meta.value?.feature_flags?.toys !== false
  const tabs: TabDescriptor[] = []
  if (mountsEnabled) {
    tabs.push({
      label: mountCount.value ? `Mounts (${mountCount.value})` : 'Mounts',
      to: { name: 'character-collections-mounts', params },
      icon: Mountain,
    })
  }
  if (petsEnabled) {
    tabs.push({
      label: petCount.value ? `Pets (${petCount.value})` : 'Pets',
      to: { name: 'character-collections-pets', params },
      icon: Cat,
    })
  }
  if (toysEnabled) {
    tabs.push({
      label: toyCount.value ? `Toys (${toyCount.value})` : 'Toys',
      to: { name: 'character-collections-toys', params },
      icon: Sparkles,
    })
  }
  return tabs
})
</script>
