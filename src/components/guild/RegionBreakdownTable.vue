<script setup lang="ts">
import type { Region } from '@/types/api'
import FactionBadge from '@/components/wow/FactionBadge.vue'

defineProps<{
  rows: Array<{ region: Region; alliance: number; horde: number }>
}>()
</script>

<template>
  <p v-if="rows.length === 0" class="text-wsa-disabled text-sm">No regional data.</p>
  <div v-else class="overflow-x-auto">
    <table class="w-full text-xs min-w-[420px]">
      <thead>
        <tr class="text-wsa-muted text-left">
          <th class="py-1.5 px-2">Region</th>
          <th class="py-1.5 px-2 text-right">
            <span class="inline-flex items-center gap-1 justify-end">
              <FactionBadge faction="Alliance" />
              Alliance
            </span>
          </th>
          <th class="py-1.5 px-2 text-right">
            <span class="inline-flex items-center gap-1 justify-end">
              <FactionBadge faction="Horde" />
              Horde
            </span>
          </th>
          <th class="py-1.5 px-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.region" class="border-b border-wsa-border/20">
          <td class="py-1.5 px-2 text-wsa-text">{{ row.region.toUpperCase() }}</td>
          <td class="py-1.5 px-2 text-right text-wsa-text">{{ row.alliance.toLocaleString() }}</td>
          <td class="py-1.5 px-2 text-right text-wsa-text">{{ row.horde.toLocaleString() }}</td>
          <td class="py-1.5 px-2 text-right text-wsa-text">{{ (row.alliance + row.horde).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
