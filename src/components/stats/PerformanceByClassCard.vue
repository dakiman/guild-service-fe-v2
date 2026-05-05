<script setup lang="ts">
import { computed } from 'vue'
import { CLASSES, CLASS_COLORS } from '@/utils/wowConstants'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import type { ClassDistribution } from '@/types/stats'

const props = defineProps<{
  classes: ClassDistribution[]
}>()

const sorted = computed(() =>
  [...props.classes].sort((a, b) => b.avg_mythic_plus_rating - a.avg_mythic_plus_rating),
)

const maxRating = computed(() =>
  sorted.value.length > 0 ? sorted.value[0].avg_mythic_plus_rating : 1,
)

function formatRating(rating: number): string {
  return rating.toFixed(0)
}

function formatIlvl(ilvl: number): string {
  return ilvl.toFixed(1)
}
</script>

<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title text-lg">Performance by Class</h2>
      <div class="flex flex-col gap-2">
        <div
          v-for="entry in sorted"
          :key="entry.class_id"
          class="flex items-center gap-3 rounded-md bg-base-100 p-3"
        >
          <ClassIcon :class-id="entry.class_id" :size="24" />
          <span
            class="w-28 text-sm font-medium truncate"
            :style="{ color: CLASS_COLORS[entry.class_id] }"
          >
            {{ CLASSES[entry.class_id] }}
          </span>

          <!-- M+ Rating bar -->
          <div class="flex flex-1 items-center gap-2">
            <div class="h-2 flex-1 rounded-full bg-base-300 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${(entry.avg_mythic_plus_rating / maxRating) * 100}%`,
                  backgroundColor: CLASS_COLORS[entry.class_id],
                  opacity: 0.8,
                }"
              />
            </div>
            <span class="w-12 text-right text-xs font-semibold tabular-nums">
              {{ formatRating(entry.avg_mythic_plus_rating) }}
            </span>
          </div>

          <!-- iLvl -->
          <span class="w-14 text-right text-xs text-base-content/60 tabular-nums">
            {{ formatIlvl(entry.avg_ilvl) }} ilvl
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
