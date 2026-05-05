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
          return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="card border border-base-content/5 bg-base-200 shadow-md">
    <div class="card-body">
      <h2 class="card-title text-lg">Class Distribution</h2>
      <div class="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <!-- Chart -->
        <div class="relative h-72 w-72 flex-shrink-0">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold">{{ compactNumber(total) }}</span>
            <span class="text-xs text-base-content/60">characters</span>
          </div>
        </div>

        <!-- Legend with stats -->
        <div class="flex flex-col gap-1.5 w-full">
          <div
            v-for="item in sortedDistribution"
            :key="item.class_id"
            class="flex items-center gap-3 rounded-md bg-base-100/50 px-3 py-1.5"
          >
            <ClassIcon :class-id="item.class_id" :size="20" />
            <span
              class="w-28 text-sm font-medium truncate"
              :style="{ color: CLASS_COLORS[item.class_id] }"
            >
              {{ CLASSES[item.class_id] }}
            </span>
            <span class="text-sm font-semibold tabular-nums w-12 text-right">
              {{ compactNumber(item.count) }}
            </span>
            <span class="text-xs text-base-content/40 tabular-nums w-10 text-right">
              {{ ((item.count / total) * 100).toFixed(1) }}%
            </span>
            <div class="ml-auto flex items-center gap-3">
              <span class="text-xs text-base-content/50 tabular-nums">
                {{ item.avg_ilvl.toFixed(0) }} ilvl
              </span>
              <span class="text-xs text-base-content/50 tabular-nums">
                {{ item.avg_mythic_plus_rating.toFixed(0) }} m+
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
