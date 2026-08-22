<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
    <h1 class="text-3xl font-bold text-wsa-heading">About Peon</h1>

    <div class="wsa-card flex flex-col gap-3 text-sm leading-relaxed text-wsa-text">
      <p>
        Peon is a World of Warcraft character and guild lookup service with a Mythic+ meta hub,
        built and run by one person. Two kinds of data power it.
      </p>
      <p>
        <strong class="text-wsa-heading">M+ meta data</strong> (the Meta page) comes from the
        <strong>official Blizzard Mythic+ leaderboards</strong>: the top-500 runs per dungeon on
        every connected-realm shard, EU and US, crawled daily after each region's reset. That is a
        curated top slice of each realm's runs, not the full keystone population, and every card
        shows when it was last computed.
      </p>
      <p>
        <strong class="text-wsa-heading">Character and guild data</strong> comes from the Blizzard
        profile API for characters people look up here, plus a discovery crawl. Leaderboards and
        site-wide stats on the Characters, Mythic+ and Raids pages are computed over that tracked
        subset — <strong>not a global census</strong> — and each card says how many characters it
        covers and when it was refreshed (hourly).
      </p>
      <p class="text-xs text-wsa-muted">
        Dungeon artwork via
        <a href="https://raider.io" target="_blank" rel="noopener" class="underline">raider.io</a>.
        Tooltips by Wowhead. Peon is not affiliated with Blizzard Entertainment.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
