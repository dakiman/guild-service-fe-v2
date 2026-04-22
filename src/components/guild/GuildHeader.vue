<script setup lang="ts">
import { computed } from 'vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import type { GuildResource } from '@/types/guild'

const props = defineProps<{ guild: GuildResource }>()

// Blizzard convention: created_timestamp is a unix epoch in milliseconds.
// If the value is unexpectedly small (seconds), it'll still render a valid date
// — just much earlier than expected. We render via toLocaleDateString().
const createdDate = computed(() => {
  const ts = props.guild.created_timestamp
  if (!ts) return null
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString()
})

const memberCount = computed(() => props.guild.member_count.toLocaleString())
const achievementPoints = computed(() => props.guild.achievement_points.toLocaleString())

const realmDisplay = computed(() =>
  `${props.guild.realm} · ${props.guild.region.toUpperCase()}`,
)
</script>

<template>
  <header class="card bg-base-200 shadow-sm">
    <div class="card-body gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-3xl font-bold leading-tight">{{ guild.name }}</h1>
          <p class="text-base-content/70">{{ realmDisplay }}</p>
        </div>
        <FactionBadge :faction="guild.faction" />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-md bg-base-100 p-3">
          <p class="text-xs uppercase tracking-wide text-base-content/60">Members</p>
          <p class="text-xl font-semibold">{{ memberCount }}</p>
        </div>
        <div class="rounded-md bg-base-100 p-3">
          <p class="text-xs uppercase tracking-wide text-base-content/60">Achievement points</p>
          <p class="text-xl font-semibold">{{ achievementPoints }}</p>
        </div>
        <div class="rounded-md bg-base-100 p-3">
          <p class="text-xs uppercase tracking-wide text-base-content/60">Created</p>
          <p class="text-xl font-semibold">{{ createdDate ?? 'Unknown' }}</p>
        </div>
      </div>
    </div>
  </header>
</template>
