<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from 'chart.js'
import { CLASSES, CLASS_COLORS } from '@/utils/wowConstants'
import type { ClassDistribution } from '@/types/stats'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{
  distribution: ClassDistribution[]
  total: number
}>()

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
      borderColor: 'oklch(var(--b2))',
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
      backgroundColor: 'oklch(var(--b3))',
      titleColor: 'oklch(var(--bc))',
      bodyColor: 'oklch(var(--bc))',
      borderColor: 'oklch(var(--b3))',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      titleFont: { weight: 'bold' as const },
      callbacks: {
        label: (ctx: { parsed: number; label: string }) => {
          const pct = ((ctx.parsed / props.total) * 100).toFixed(1)
          return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title text-lg">Class Distribution</h2>
      <div class="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <!-- Chart -->
        <div class="relative h-64 w-64 flex-shrink-0">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold">{{ total }}</span>
            <span class="text-xs text-base-content/60">characters</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          <div
            v-for="item in sortedDistribution"
            :key="item.class_id"
            class="flex items-center gap-2"
          >
            <span
              class="h-3 w-3 rounded-full flex-shrink-0"
              :style="{ backgroundColor: CLASS_COLORS[item.class_id] }"
            />
            <span class="text-sm whitespace-nowrap">
              {{ CLASSES[item.class_id] }}
            </span>
            <span class="text-sm font-semibold text-base-content/70">
              {{ item.count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
