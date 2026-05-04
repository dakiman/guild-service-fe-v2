<template>
  <div class="flex flex-col gap-4">
    <ErrorState
      v-if="lookup.error.value && !lookup.isFetching.value"
      :error="lookup.error.value"
      @retry="lookup.refetch()"
    />

    <template v-else-if="character">
      <CharacterHeader
        :character="character"
        :achievements-enabled="meta?.feature_flags?.achievements !== false"
        :synced-at="character.synced_at"
      />

      <div class="flex flex-wrap items-center gap-3">
        <StaleBadge v-if="isStale" :last-synced-at="character.synced_at ?? undefined" />
        <FreshnessChips v-if="meta" :freshness="meta.freshness" />
        <button
          v-if="character.talent_loadout_code"
          type="button"
          class="btn btn-sm btn-ghost"
          @click="onCopyLoadout"
        >
          Copy loadout
        </button>
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

      <CharacterTabStrip :tabs="tabs" />
      <router-view />
    </template>

    <PollingState v-else :attempt="lookup.failureCount.value" :max-attempts="12" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { useCharacterLookup } from '@/composables/usePollingLookup'
import { useWowheadRefresh } from '@/composables/useWowhead'
import { useStaleAutoRefresh } from '@/composables/useStaleAutoRefresh'
import { provideCharacterContext } from '@/composables/useCharacterContext'
import { useAuthStore } from '@/stores/auth'
import { toggleRecruitment } from '@/api/characters'
import { Sparkles, BookOpen, Crown, Gem, Skull, Swords, Star, Trophy } from 'lucide-vue-next'
import CharacterHeader from '@/components/character/CharacterHeader.vue'
import CharacterTabStrip, {
  type TabDescriptor,
} from '@/components/character/CharacterTabStrip.vue'
import PollingState from '@/components/feedback/PollingState.vue'
import StaleBadge from '@/components/feedback/StaleBadge.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import FreshnessChips from '@/components/feedback/FreshnessChips.vue'
import type { Region } from '@/types/api'
import type { CharacterLookupResult, CharacterResource, MetaBlock } from '@/types/character'
import { getErrorMessage } from '@/utils/errors'

const props = defineProps<{ region: Region; realm: string; name: string }>()
const { region, realm, name } = toRefs(props)

const auth = useAuthStore()
const queryClient = useQueryClient()
const route = useRoute()

const lookup = useCharacterLookup(region, realm, name)

const character = computed(() => lookup.data.value?.data ?? null)
const meta = computed(() => lookup.data.value?.meta ?? null)
const isStale = computed(() => lookup.data.value?.isStale ?? false)
const isClassic = computed(() => character.value?.game_version === 'classic')

useWowheadRefresh(() => character.value)
useWowheadRefresh(() => route.fullPath)
useStaleAutoRefresh(isStale, () => ['character', region.value, realm.value, name.value])

// The layout v-if-gates <router-view> on `character` non-null, so children
// observing the context never see null. Cast away the union here.
provideCharacterContext({
  character: character as ComputedRef<CharacterResource>,
  meta: meta as ComputedRef<MetaBlock>,
  freshness: computed(() => (meta.value ? meta.value.freshness : ({} as MetaBlock['freshness']))),
  isStale,
  isClassic,
  refetch: () => lookup.refetch(),
})

const tabs = computed<TabDescriptor[]>(() => {
  const params = { region: region.value, realm: realm.value, name: name.value }
  const achievementsEnabled = meta.value?.feature_flags?.achievements !== false
  const result: TabDescriptor[] = [
    { label: 'Summary',      to: { name: 'character-summary', params },      icon: Sparkles },
    { label: 'Talents',      to: { name: 'character-talents', params },      icon: BookOpen },
    { label: 'Titles',       to: { name: 'character-titles', params },       icon: Crown },
    {
      label: 'Collections',
      to: { name: 'character-collections', params },
      icon: Gem,
      activeMatchNames: [
        'character-collections-mounts',
        'character-collections-pets',
        'character-collections-toys',
      ],
    },
    {
      label: 'Dungeons',
      to: { name: 'character-dungeons', params },
      icon: Skull,
    },
    {
      label: 'Raids',
      to: { name: 'character-raids', params },
      icon: Swords,
    },
    { label: 'Reputations',  to: { name: 'character-reputations', params },  icon: Star },
  ]
  if (achievementsEnabled) {
    result.push({ label: 'Achievements', to: { name: 'character-achievements', params }, icon: Trophy })
  }
  return result
})

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
    toast.error(getErrorMessage(err, 'Could not update recruitment status.'))
  } finally {
    isToggling.value = false
  }
}

async function onCopyLoadout() {
  const code = character.value?.talent_loadout_code
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    toast.success('Talent loadout copied to clipboard')
  } catch {
    toast.error('Could not copy loadout')
  }
}
</script>
