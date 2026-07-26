<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
import RaidHeatmapCard from '@/components/stats/RaidHeatmapCard.vue'
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHeader icon="/brand/icon-raids.jpg" title="Raids" />
    <RaidHeatmapCard />
  </div>
</template>
