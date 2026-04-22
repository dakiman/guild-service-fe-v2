<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Talents</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Class
          </h3>
          <p v-if="!talents.class.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.class" :key="`class-${t.id}`">
              <WowheadLink :spell-id="t.id" :label="t.name" />
            </li>
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Spec
          </h3>
          <p v-if="!talents.spec.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.spec" :key="`spec-${t.id}`">
              <WowheadLink :spell-id="t.id" :label="t.name" />
            </li>
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Hero
          </h3>
          <p v-if="!talents.hero.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.hero" :key="`hero-${t.id}`">
              <WowheadLink :spell-id="t.id" :label="t.name" />
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WowheadLink from '@/components/wow/WowheadLink.vue'
import type { TalentEntry } from '@/types/character'

defineProps<{
  talents: { class: TalentEntry[]; spec: TalentEntry[]; hero: TalentEntry[] }
}>()
</script>
