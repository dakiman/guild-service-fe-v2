<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  horde: number
  alliance: number
}>()

const total = computed(() => props.horde + props.alliance)
const hordePct = computed(() => (total.value > 0 ? (props.horde / total.value) * 100 : 50))
const alliancePct = computed(() => (total.value > 0 ? (props.alliance / total.value) * 100 : 50))

function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}
</script>

<template>
  <div class="card border border-base-content/5 bg-base-200 shadow-md overflow-hidden">
    <div class="relative h-44 sm:h-36">
      <!-- Horde side -->
      <div
        class="absolute inset-0 flex items-center"
        :style="{
          clipPath: `polygon(0 0, ${hordePct + 3}% 0, ${hordePct - 3}% 100%, 0 100%)`,
          background: 'linear-gradient(135deg, #B30000 0%, #8B0000 100%)',
        }"
      >
        <div class="flex items-center gap-3 pl-5 sm:pl-8">
          <div
            class="h-14 w-14 flex-shrink-0 opacity-90"
            :style="{
              backgroundColor: '#ff4444',
              WebkitMaskImage: 'url(/factions/horde.png)',
              maskImage: 'url(/factions/horde.png)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
            }"
          />
          <div class="flex flex-col">
            <span class="text-2xl font-bold text-red-100">{{ compactNumber(horde) }}</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-red-300">Horde</span>
            <span class="text-xs text-red-300/70 tabular-nums">{{ hordePct.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Alliance side -->
      <div
        class="absolute inset-0 flex items-center justify-end"
        :style="{
          clipPath: `polygon(${hordePct + 3}% 0, 100% 0, 100% 100%, ${hordePct - 3}% 100%)`,
          background: 'linear-gradient(135deg, #0060CC 0%, #0078FF 100%)',
        }"
      >
        <div class="flex items-center gap-3 pr-5 sm:pr-8">
          <div class="flex flex-col items-end">
            <span class="text-2xl font-bold text-blue-100">{{ compactNumber(alliance) }}</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-blue-300">Alliance</span>
            <span class="text-xs text-blue-300/70 tabular-nums">{{ alliancePct.toFixed(1) }}%</span>
          </div>
          <div
            class="h-14 w-14 flex-shrink-0 opacity-90"
            :style="{
              backgroundColor: '#66aaff',
              WebkitMaskImage: 'url(/factions/alliance.png)',
              maskImage: 'url(/factions/alliance.png)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
            }"
          />
        </div>
      </div>

      <!-- Diagonal divider line -->
      <div
        class="absolute inset-0 pointer-events-none"
        :style="{
          background: `linear-gradient(
            to bottom,
            transparent calc(${hordePct}% - 1px),
            oklch(var(--bc) / 0.15) calc(${hordePct}% - 1px),
            oklch(var(--bc) / 0.15) calc(${hordePct}% + 1px),
            transparent calc(${hordePct}% + 1px)
          )`,
          clipPath: `polygon(${hordePct + 3}% 0, ${hordePct + 3.3}% 0, ${hordePct - 2.7}% 100%, ${hordePct - 3}% 100%)`,
        }"
      />
    </div>
  </div>
</template>
