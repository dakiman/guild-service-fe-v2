<template>
  <div class="flex flex-col gap-4">
    <ErrorState
      v-if="lookup.error.value && !lookup.isFetching.value"
      :error="lookup.error.value"
      @retry="lookup.refetch()"
    />

    <template v-else-if="character">
      <CharacterHeader :character="character" />

      <div class="flex flex-wrap items-center gap-3">
        <StaleBadge v-if="isStale" :last-synced-at="character.synced_at ?? undefined" />
        <button
          v-if="canToggleRecruitment"
          type="button"
          class="btn btn-sm"
          :class="character.recruitment ? 'btn-success' : 'btn-outline'"
          :disabled="isToggling"
          @click="onToggleRecruitment"
        >
          <span v-if="isToggling" class="loading loading-spinner loading-xs" />
          {{ character.recruitment ? 'Looking for guild' : 'Not looking for guild' }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EquipmentList :equipment="character.equipment" />
        <TalentTree :talents="character.talents" />
      </div>

      <DungeonRunsList :runs="character.dungeon_runs" />
    </template>

    <PollingState
      v-else
      :attempt="lookup.failureCount.value"
      :max-attempts="12"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { useCharacterLookup } from '@/composables/usePollingLookup'
import { useWowheadRefresh } from '@/composables/useWowhead'
import { useStaleAutoRefresh } from '@/composables/useStaleAutoRefresh'
import { useAuthStore } from '@/stores/auth'
import { toggleRecruitment } from '@/api/characters'
import CharacterHeader from '@/components/character/CharacterHeader.vue'
import EquipmentList from '@/components/character/EquipmentList.vue'
import TalentTree from '@/components/character/TalentTree.vue'
import DungeonRunsList from '@/components/character/DungeonRunsList.vue'
import PollingState from '@/components/feedback/PollingState.vue'
import StaleBadge from '@/components/feedback/StaleBadge.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import type { Region } from '@/types/api'
import type { CharacterLookupResult } from '@/types/character'
import { getErrorMessage } from '@/utils/errors'

const props = defineProps<{ region: Region; realm: string; name: string }>()

const { region, realm, name } = toRefs(props)

const auth = useAuthStore()
const queryClient = useQueryClient()

const lookup = useCharacterLookup(region, realm, name)

const character = computed(() => lookup.data.value?.data ?? null)
const isStale = computed(() => lookup.data.value?.isStale ?? false)

useWowheadRefresh(() => character.value)
useStaleAutoRefresh(isStale, () => ['character', region.value, realm.value, name.value])

// Ownership check: the BE's CharacterResource currently does not expose
// `user_id`, so we infer ownership by matching this character's id against
// the user's own characters list (which the BE already returns on /me).
const canToggleRecruitment = computed(() => {
  if (!auth.user || !character.value) return false
  return auth.user.characters?.some((c) => c.id === character.value!.id) ?? false
})

const isToggling = ref(false)

async function onToggleRecruitment() {
  if (!character.value || isToggling.value) return
  isToggling.value = true
  try {
    const updated = await toggleRecruitment(character.value.id)
    queryClient.setQueryData<CharacterLookupResult>(
      ['character', region.value, realm.value, name.value],
      (old) => (old ? { ...old, data: updated } : old),
    )
    toast.success(
      updated.recruitment
        ? 'Marked as looking for guild'
        : 'Marked as not looking for guild',
    )
  } catch (err) {
    const message = getErrorMessage(err, 'Could not update recruitment status.')
    toast.error(message)
  } finally {
    isToggling.value = false
  }
}
</script>
