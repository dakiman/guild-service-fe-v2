<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ChevronDown, ChevronUp, Search } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import LookupForm from '@/components/form/LookupForm.vue'
import StatsHeroCard from '@/components/stats/StatsHeroCard.vue'
import StatMiniCard from '@/components/stats/StatMiniCard.vue'
import FactionSplitCard from '@/components/stats/FactionSplitCard.vue'
import PerformanceByClassCard from '@/components/stats/PerformanceByClassCard.vue'
import TopPerformersCard from '@/components/stats/TopPerformersCard.vue'
import SpecPopularityCard from '@/components/stats/SpecPopularityCard.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import { useCharacterStats } from '@/composables/useCharacterStats'
import { CLASSES, CLASS_COLORS } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import type { Region } from '@/types/api'

const router = useRouter()
const searchOpen = ref(false)

const { data: stats, isLoading, isError } = useCharacterStats()

function onSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'character-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}

const avgIlvl = computed(() => {
  if (!stats.value?.class_distribution.length) return '—'
  const total = stats.value.class_distribution.reduce((sum, c) => sum + c.avg_ilvl * c.count, 0)
  const count = stats.value.class_distribution.reduce((sum, c) => sum + c.count, 0)
  return (total / count).toFixed(1)
})

const avgRating = computed(() => {
  if (!stats.value?.class_distribution.length) return '—'
  const total = stats.value.class_distribution.reduce((sum, c) => sum + c.avg_mythic_plus_rating * c.count, 0)
  const count = stats.value.class_distribution.reduce((sum, c) => sum + c.count, 0)
  return (total / count).toFixed(0)
})

const topClass = computed(() => {
  if (!stats.value?.class_distribution.length) return { name: '—', count: 0, classId: 0 }
  const top = stats.value.class_distribution.reduce((a, b) => a.count > b.count ? a : b)
  return { name: CLASSES[top.class_id] ?? '', count: top.count, classId: top.class_id }
})

const avgAchievementPoints = computed(() => stats.value?.avg_achievement_points ?? 0)

const mostPopularSpec = computed(() => {
  const spec = stats.value?.most_popular_spec
  if (!spec) return null
  const specName = SPEC_NAMES[spec.spec_id]
  const className = CLASSES[spec.class_id]
  if (!specName || !className) {
    // Unknown spec id — numeric fallback, same as the old display
    return { ...spec, name: spec.count.toLocaleString(), subtitle: 'characters', color: undefined }
  }
  return {
    ...spec,
    name: specName,
    subtitle: `${className} · ${spec.count.toLocaleString()} chars`,
    color: CLASS_COLORS[spec.class_id],
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Collapsible Search -->
    <div class="search-cta">
      <button
        class="flex w-full items-center justify-between text-left"
        @click="searchOpen = !searchOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-[#ffcc88]">
          <Search class="h-4 w-4 text-[#aa8855]" />
          Search Characters
        </span>
        <component :is="searchOpen ? ChevronUp : ChevronDown" class="h-4 w-4 text-[#aa8855]" />
      </button>
      <div v-show="searchOpen" class="mt-3">
        <LookupForm kind="character" @submit="onSubmit" @pick="onSubmit" />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="wsa-spinner"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="isError" class="wsa-card !border-red-800/50 !p-4">
      <p class="text-sm text-[#ff4444]">Failed to load character stats.</p>
    </div>

    <!-- Dashboard content -->
    <template v-else-if="stats">
      <!-- Row 1: Hero + Faction -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4">
        <StatsHeroCard :distribution="stats.class_distribution" :total="stats.total_characters" />
        <FactionSplitCard
          :horde="stats.faction_distribution.horde"
          :alliance="stats.faction_distribution.alliance"
          :races="stats.race_distribution"
        />
      </div>

      <!-- Row 2: KPI Mini Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatMiniCard
          label="Avg Item Level"
          :value="avgIlvl"
          tooltip="Endgame-active characters only"
        />
        <StatMiniCard
          label="Avg M+ Rating"
          :value="avgRating"
          tooltip="Endgame-active characters only"
        />
        <StatMiniCard
          label="Avg Achievements"
          :value="avgAchievementPoints.toLocaleString()"
          tooltip="Endgame-active characters only"
        />
        <StatMiniCard
          label="Top Class"
          :value="topClass.name"
          :subtitle="`${topClass.count.toLocaleString()} chars`"
          :accent-color="topClass.classId ? CLASS_COLORS[topClass.classId] : undefined"
        />
        <StatMiniCard
          v-if="mostPopularSpec"
          label="Most Popular Spec"
          :value="mostPopularSpec.name"
          :subtitle="mostPopularSpec.subtitle"
          :accent-color="mostPopularSpec.color"
          :value-color="mostPopularSpec.color"
        >
          <template #icon>
            <SpecIcon :spec-id="mostPopularSpec.spec_id" :size="24" />
          </template>
        </StatMiniCard>
      </div>

      <!-- Row 3: Spec Popularity + Performance -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpecPopularityCard :specs="stats.spec_distribution" :total="stats.total_characters" />
        <PerformanceByClassCard :classes="stats.class_distribution" />
      </div>

      <!-- Row 5: Top Performers -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopPerformersCard
          title="Top Item Level"
          :entries="stats.top_performers.item_level"
          value-label="iLvl"
          :format-value="(v: number) => v.toFixed(1)"
        />
        <TopPerformersCard
          title="Top Achievement Points"
          :entries="stats.top_performers.achievement_points"
          value-label="Points"
          :format-value="(v: number) => v.toLocaleString()"
        />
      </div>

      <!-- Row 6: PvE page teasers -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RouterLink :to="{ name: 'mythic-plus' }" class="pve-teaser">
          <span class="text-sm font-semibold text-[#e0d0b0]">Mythic+ leaderboards</span>
          <ArrowRight class="h-4 w-4 text-[#aa8855]" />
        </RouterLink>
        <RouterLink :to="{ name: 'raids' }" class="pve-teaser">
          <span class="text-sm font-semibold text-[#e0d0b0]">Raid progress</span>
          <ArrowRight class="h-4 w-4 text-[#aa8855]" />
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-cta {
  border: 2px solid #aa8855;
  border-radius: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, rgba(170, 136, 85, 0.12), rgba(170, 136, 85, 0.04));
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-cta:hover {
  border-color: #ffcc88;
  box-shadow: 0 0 12px rgba(255, 204, 136, 0.25);
}

.pve-teaser {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #5c4a32;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(170, 136, 85, 0.05);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.pve-teaser:hover {
  border-color: #aa8855;
  background: rgba(170, 136, 85, 0.1);
}
</style>
