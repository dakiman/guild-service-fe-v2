<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from 'chart.js'
import { CLASSES, CLASS_COLORS } from '@/utils/wowConstants'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import type { ClassDistribution } from '@/types/stats'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{
  distribution: ClassDistribution[]
  total: number
}>()

function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

const sortedDistribution = computed(() =>
  [...props.distribution].sort((a, b) => b.count - a.count),
)

const chartData = computed(() => ({
  labels: sortedDistribution.value.map((d) => CLASSES[d.class_id] ?? `Class ${d.class_id}`),
  datasets: [
    {
      data: sortedDistribution.value.map((d) => d.count),
      backgroundColor: sortedDistribution.value.map((d) => CLASS_COLORS[d.class_id] ?? '#666'),
      borderWidth: 2,
      borderColor: '#5c4a32',
      spacing: 2,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  animation: {
    animateRotate: true,
    duration: 800,
    easing: 'easeOutQuart' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1410',
      titleColor: '#ffcc88',
      bodyColor: '#e0d0b0',
      borderColor: '#5c4a32',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      titleFont: { weight: 'bold' as const },
      callbacks: {
        label: (ctx: { parsed: number; label: string }) => {
          const pct = ((ctx.parsed / props.total) * 100).toFixed(1)
          return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="wsa-card">
    <div class="p-2">
      <h2 class="wsa-text-heading text-[15px] text-lg mb-4">Class Distribution</h2>
      <div class="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <!-- Chart -->
        <div class="relative h-72 w-72 flex-shrink-0">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold text-wsa-text">{{ compactNumber(total) }}</span>
            <span class="text-xs text-wsa-muted">characters</span>
          </div>
        </div>

        <!-- Legend with stats -->
        <div class="flex flex-col gap-1.5 w-full">
          <div
            v-for="item in sortedDistribution"
            :key="item.class_id"
            class="flex items-center gap-3 rounded-md px-3 py-1.5"
            style="background: rgba(0, 0, 0, 0.25)"
          >
            <ClassIcon :class-id="item.class_id" :size="20" />
            <span
              class="w-28 text-sm font-medium truncate"
              :style="{ color: CLASS_COLORS[item.class_id] }"
            >
              {{ CLASSES[item.class_id] }}
            </span>
            <span class="text-sm font-semibold tabular-nums w-12 text-right text-wsa-text">
              {{ compactNumber(item.count) }}
            </span>
            <span class="text-xs tabular-nums w-10 text-right text-wsa-muted">
              {{ ((item.count / total) * 100).toFixed(1) }}%
            </span>
            <div class="ml-auto flex items-center gap-3">
              <span class="text-xs tabular-nums text-wsa-muted">
                {{ item.avg_ilvl.toFixed(0) }} ilvl
              </span>
              <span class="text-xs tabular-nums text-wsa-muted">
                {{ item.avg_mythic_plus_rating.toFixed(0) }} m+
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
