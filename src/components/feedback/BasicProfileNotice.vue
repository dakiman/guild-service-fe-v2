<template>
  <div class="wsa-card flex items-start gap-3">
    <Info class="w-5 h-5 shrink-0 text-wsa-gold mt-0.5" aria-hidden="true" />
    <div>
      <p class="text-sm font-medium text-wsa-heading">
        Below max level{{ level != null ? ` — level ${level}` : '' }}
      </p>
      <p class="text-sm text-wsa-muted">
        Detailed stats — Mythic+, raids, PvP, professions, reputations and
        achievements — are tracked at max level only. Profile, gear and talents
        stay up to date.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'

defineProps<{
  level?: number | null
}>()
</script>
