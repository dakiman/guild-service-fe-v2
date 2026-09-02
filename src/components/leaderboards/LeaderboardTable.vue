<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import { displayName, displayRealm } from '@/utils/display'
import { SPEC_NAMES } from '@/utils/wowIcons'
import type { LeaderboardRow } from '@/types/leaderboards'

defineProps<{ rows: LeaderboardRow[] }>()
const n = (v: number) => v.toLocaleString('en-US')
// 0-based podium convention shared with TopRunsTable: index < 3 = top three.
function podiumClass(index: number): string {
  return index < 3 ? 'text-wsa-gold' : 'text-wsa-disabled'
}
</script>

<template>
  <div v-if="rows.length" class="overflow-x-auto">
    <table class="w-full text-sm min-w-[520px]">
      <thead>
        <tr class="text-wsa-muted text-left text-xs">
          <th class="py-1.5 w-12">#</th>
          <th class="py-1.5">Character</th>
          <th class="py-1.5">Realm</th>
          <th class="py-1.5">Spec</th>
          <th class="py-1.5 text-right">Rating</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="`${row.character.region}-${row.character.realm}-${row.character.name}`" class="border-b border-wsa-border/20">
          <td class="py-2 font-bold tabular-nums" :class="podiumClass(index)">{{ n(row.rank) }}</td>
          <td class="py-2">
            <RouterLink
              :to="{ name: 'character-detail', params: { region: row.character.region, realm: row.character.realm, name: row.character.name } }"
              class="inline-flex items-center gap-2 font-bold text-wsa-text hover:text-wsa-gold hover:underline"
            >
              <ClassIcon :class-id="row.character.class_id" />
              {{ displayName(row.character.name, row.character.display_name) }}
            </RouterLink>
          </td>
          <td class="py-2 text-wsa-muted">{{ displayRealm(row.character.realm, row.character.display_realm) }}</td>
          <td class="py-2 text-wsa-muted">
            <span v-if="row.character.spec_id" class="inline-flex items-center gap-1.5">
              <SpecIcon :spec-id="row.character.spec_id" :fallback-class-id="row.character.class_id" :size="16" />
              {{ SPEC_NAMES[row.character.spec_id] ?? '' }}
            </span>
            <span v-else>—</span>
          </td>
          <td class="py-2 text-right font-bold tabular-nums" :style="{ color: row.color ?? undefined }" :data-testid="`rating-${row.rank}`">
            {{ n(row.rating) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="py-6 text-center text-sm text-wsa-disabled">No ranked characters yet this season.</p>
</template>
