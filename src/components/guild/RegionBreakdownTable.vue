<script setup lang="ts">
import type { Region } from '@/types/api'
import FactionBadge from '@/components/wow/FactionBadge.vue'

defineProps<{
  rows: Array<{ region: Region; alliance: number; horde: number }>
}>()
</script>

<template>
  <p v-if="rows.length === 0" class="text-base-content/60 text-sm">No regional data.</p>
  <table v-else class="table table-sm">
    <thead>
      <tr>
        <th>Region</th>
        <th class="text-right">
          <span class="inline-flex items-center gap-1 justify-end">
            <FactionBadge faction="Alliance" />
            Alliance
          </span>
        </th>
        <th class="text-right">
          <span class="inline-flex items-center gap-1 justify-end">
            <FactionBadge faction="Horde" />
            Horde
          </span>
        </th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.region">
        <td>{{ row.region.toUpperCase() }}</td>
        <td class="text-right">{{ row.alliance.toLocaleString() }}</td>
        <td class="text-right">{{ row.horde.toLocaleString() }}</td>
        <td class="text-right">{{ (row.alliance + row.horde).toLocaleString() }}</td>
      </tr>
    </tbody>
  </table>
</template>
