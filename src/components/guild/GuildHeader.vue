<script setup lang="ts">
import { computed } from 'vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { displayGuildName, displayRealm } from '@/utils/display'
import type { GuildResource } from '@/types/guild'

const props = defineProps<{ guild: GuildResource }>()

const guildDisplay = computed(() => displayGuildName(props.guild.name, props.guild.display_name))

// Blizzard convention: created_timestamp is a unix epoch in milliseconds.
// If the value is unexpectedly small (seconds), it'll still render a valid date
// — just much earlier than expected. We render via toLocaleDateString().
const createdDate = computed(() => {
  const ts = props.guild.created_timestamp
  if (!ts) return null
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

const memberCount = computed(() => props.guild.member_count.toLocaleString())
const achievementPoints = computed(() => props.guild.achievement_points.toLocaleString())

const realmDisplay = computed(() =>
  `${displayRealm(props.guild.realm, props.guild.display_realm)} · ${props.guild.region.toUpperCase()}`,
)
</script>

<template>
  <header class="wsa-card">
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-3xl font-bold leading-tight text-wsa-heading">{{ guildDisplay }}</h1>
          <p class="text-wsa-muted">{{ realmDisplay }}</p>
        </div>
        <FactionBadge :faction="guild.faction" />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-md bg-black/25 border border-wsa-border/20 p-3">
          <p class="text-xs uppercase tracking-wide text-wsa-muted">Members</p>
          <p class="text-xl font-semibold text-wsa-text">{{ memberCount }}</p>
        </div>
        <div class="rounded-md bg-black/25 border border-wsa-border/20 p-3">
          <p class="text-xs uppercase tracking-wide text-wsa-muted">Achievement points</p>
          <p class="text-xl font-semibold text-wsa-text">{{ achievementPoints }}</p>
        </div>
        <div class="rounded-md bg-black/25 border border-wsa-border/20 p-3">
          <p class="text-xs uppercase tracking-wide text-wsa-muted">Created</p>
          <p class="text-xl font-semibold text-wsa-text">{{ createdDate ?? 'Unknown' }}</p>
        </div>
      </div>
    </div>
  </header>
</template>
