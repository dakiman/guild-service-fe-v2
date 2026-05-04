# Guild page roster redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 5-column roster table with a denser 9-column table that adds spec, faction, item level, and M+ score columns, with real race icons sourced from Wowhead's `zamimg` CDN.

**Architecture:** Backend introduces a `GuildMemberResource` that joins `Character` data via the existing `GuildMember.character()` belongsTo relation, exposing `equipped_item_level`, `mythic_plus_rating`, `active_specialization_id`, `synced_at`, and a server-derived `faction`. Frontend replaces the placeholder `RaceIcon` with a Wowhead-CDN-backed component, extends `wowConstants.ts` with race metadata (slugs, factions, default genders), and rewrites `RosterTable.vue` with denser styling, sortable headers, and mobile column collapsing. Existing `ClassIcon`, `SpecIcon`, and `FactionBadge` components are reused as-is.

**Tech Stack:** Laravel 12 + PHPUnit (BE), Vue 3 + TypeScript + Vitest + DaisyUI/Tailwind (FE).

**Spec:** `frontend/docs/superpowers/specs/2026-05-03-guild-page-roster-redesign-design.md`

---

## File Structure

**Backend** (paths relative to `backend/`):
- Create: `app/Support/RaceFaction.php` — static helper mapping `race_id` → `'Alliance'|'Horde'|null`
- Create: `app/Http/Resources/GuildMemberResource.php` — the new roster row resource
- Modify: `app/Http/Controllers/GuildController.php:18-49` — wrap members with the resource, eager-load character
- Create: `tests/Unit/Support/RaceFactionTest.php` — covers all 30+ race IDs
- Modify: `tests/Feature/Endpoints/GuildEndpointTest.php:9-42` — assert new fields on roster rows

**Frontend** (paths relative to `frontend/`):
- Modify: `src/utils/wowConstants.ts` — fix Nightborne typo, add missing race IDs (Zandalari/Kul Tiran/Dark Iron/Vulpera/Mag'har/Mechagnome/Dracthyr/Earthen), add `RACE_FACTIONS`, `RACE_WOWHEAD_SLUGS`, `RACE_DEFAULT_GENDERS`, `STALE_DATA_DAYS`
- Modify: `src/components/wow/RaceIcon.vue` — replace placeholder with Wowhead `<img>` and a fallback
- Modify: `src/types/guild.ts` — extend `GuildMember` with the new optional fields
- Modify: `src/components/guild/RosterTable.vue` — full rewrite (dense layout, 9 columns, sort, mobile-collapse)
- Create: `src/composables/useTableSort.ts` — generic client-side sort composable
- Create: `src/utils/wowConstants.test.ts` — covers race metadata maps
- Create: `src/composables/useTableSort.test.ts` — covers sort with null-handling
- Create: `src/components/wow/__tests__/RaceIcon.test.ts` — covers URL composition + fallback
- Modify: `frontend/CLAUDE.md` — add an "Icon sources" section

---

## Phase 1 — Backend

### Task 1: RaceFaction helper

**Files:**
- Create: `backend/app/Support/RaceFaction.php`
- Test: `backend/tests/Unit/Support/RaceFactionTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Support;

use App\Support\RaceFaction;
use PHPUnit\Framework\TestCase;

class RaceFactionTest extends TestCase
{
    public function test_alliance_races_resolve_to_alliance(): void
    {
        $allianceRaceIds = [1, 3, 4, 7, 11, 22, 25, 29, 30, 32, 34, 37, 52, 85];
        foreach ($allianceRaceIds as $id) {
            $this->assertSame('Alliance', RaceFaction::for($id), "race_id {$id} should be Alliance");
        }
    }

    public function test_horde_races_resolve_to_horde(): void
    {
        $hordeRaceIds = [2, 5, 6, 8, 9, 10, 26, 27, 28, 31, 35, 36, 70, 84];
        foreach ($hordeRaceIds as $id) {
            $this->assertSame('Horde', RaceFaction::for($id), "race_id {$id} should be Horde");
        }
    }

    public function test_neutral_pandaren_resolves_to_null(): void
    {
        $this->assertNull(RaceFaction::for(24));
    }

    public function test_unknown_race_id_resolves_to_null(): void
    {
        $this->assertNull(RaceFaction::for(9999));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose -f backend/docker-compose.yml exec app vendor/bin/phpunit tests/Unit/Support/RaceFactionTest.php`
Expected: FAIL with `Class "App\Support\RaceFaction" not found`

- [ ] **Step 3: Write the helper**

```php
<?php

declare(strict_types=1);

namespace App\Support;

final class RaceFaction
{
    /**
     * race_id -> 'Alliance' | 'Horde' | null (neutral / unknown).
     *
     * @var array<int, string>
     */
    private const MAP = [
        // Alliance
        1 => 'Alliance',   // Human
        3 => 'Alliance',   // Dwarf
        4 => 'Alliance',   // Night Elf
        7 => 'Alliance',   // Gnome
        11 => 'Alliance',  // Draenei
        22 => 'Alliance',  // Worgen
        25 => 'Alliance',  // Pandaren (Alliance)
        29 => 'Alliance',  // Void Elf
        30 => 'Alliance',  // Lightforged Draenei
        32 => 'Alliance',  // Kul Tiran
        34 => 'Alliance',  // Dark Iron Dwarf
        37 => 'Alliance',  // Mechagnome
        52 => 'Alliance',  // Dracthyr (Alliance)
        85 => 'Alliance',  // Earthen (Alliance)

        // Horde
        2 => 'Horde',      // Orc
        5 => 'Horde',      // Undead
        6 => 'Horde',      // Tauren
        8 => 'Horde',      // Troll
        9 => 'Horde',      // Goblin
        10 => 'Horde',     // Blood Elf
        26 => 'Horde',     // Pandaren (Horde)
        27 => 'Horde',     // Nightborne
        28 => 'Horde',     // Highmountain Tauren
        31 => 'Horde',     // Zandalari Troll
        35 => 'Horde',     // Vulpera
        36 => 'Horde',     // Mag'har Orc
        70 => 'Horde',     // Dracthyr (Horde)
        84 => 'Horde',     // Earthen (Horde)

        // race_id 24 (neutral Pandaren during char creation) intentionally omitted -> null
    ];

    public static function for(int $raceId): ?string
    {
        return self::MAP[$raceId] ?? null;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker compose -f backend/docker-compose.yml exec app vendor/bin/phpunit tests/Unit/Support/RaceFactionTest.php`
Expected: PASS, 4 tests, 4 assertions+

- [ ] **Step 5: Commit**

```bash
git -C backend add app/Support/RaceFaction.php tests/Unit/Support/RaceFactionTest.php
git -C backend commit -m "feat(be): RaceFaction helper for race_id -> Alliance/Horde mapping"
```

---

### Task 2: GuildMemberResource

**Files:**
- Create: `backend/app/Http/Resources/GuildMemberResource.php`
- Test: covered indirectly via the endpoint test in Task 4

- [ ] **Step 1: Create the resource**

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Support\RaceFaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $guild_id
 * @property-read string $name
 * @property-read string $realm
 * @property-read ?string $display_name
 * @property-read ?string $display_realm
 * @property-read int $level
 * @property-read int $class_id
 * @property-read int $race_id
 * @property-read int $rank
 */
class GuildMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Use relationLoaded() (not whenLoaded()) for conditional logic — whenLoaded()
        // returns a MissingValue object with no `exists` property. This mirrors the
        // Plan-5 convention documented in backend/CLAUDE.md.
        $hasCharacter = $this->relationLoaded('character') && $this->character !== null;
        $character = $hasCharacter ? $this->character : null;

        return [
            'id' => $this->id,
            'guild_id' => $this->guild_id,
            'name' => $this->name,
            'realm' => $this->realm,
            'display_name' => $this->display_name,
            'display_realm' => $this->display_realm,
            'level' => $this->level,
            'class_id' => $this->class_id,
            'race_id' => $this->race_id,
            'rank' => $this->rank,
            'faction' => RaceFaction::for($this->race_id),
            'equipped_item_level' => $hasCharacter ? $character->equipped_item_level : null,
            'mythic_plus_rating' => $hasCharacter && $character->mythic_plus_rating !== null
                ? [
                    'rating' => (int) $character->mythic_plus_rating,
                    'color' => $character->mythic_plus_rating_color,
                ]
                : null,
            'active_specialization_id' => $hasCharacter ? $character->active_specialization_id : null,
            'synced_at' => $hasCharacter ? $character->updated_at?->toIso8601String() : null,
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git -C backend add app/Http/Resources/GuildMemberResource.php
git -C backend commit -m "feat(be): GuildMemberResource exposing character-derived roster fields"
```

---

### Task 3: Wire resource into GuildController

**Files:**
- Modify: `backend/app/Http/Controllers/GuildController.php:18-49`

- [ ] **Step 1: Update the `show` method**

Replace the body from line 18 through line 49 with:

```php
public function show(string $region, string $realm, string $guild, GuildService $service, Request $request): JsonResponse
{
    $realm = BlizzardIdentity::realm($realm);
    $guild = BlizzardIdentity::realm($guild);

    try {
        $result = $service->getByIdentity($region, $realm, $guild);
    } catch (EntityNotFoundException) {
        return response()->json(['message' => 'Guild not found'], 404);
    }

    if ($result === null) {
        SyncGuildData::dispatch($region, $realm, $guild);

        return response()->json(['message' => 'Guild sync initiated'], 202)
            ->header('Retry-After', '5');
    }

    $perPage = (int) $request->query('per_page', '50');
    $members = $result->members()
        ->with(['character:id,equipped_item_level,mythic_plus_rating,mythic_plus_rating_color,active_specialization_id,updated_at'])
        ->paginate($perPage);

    $response = response()->json([
        'guild' => new GuildResource($result),
        'members' => GuildMemberResource::collection($members)->response()->getData(true),
    ]);

    if ($result->isStale()) {
        $response->header('X-Data-Staleness', 'stale');
    }

    return $response;
}
```

Add the import next to the existing `use App\Http\Resources\GuildResource;` line:

```php
use App\Http\Resources\GuildMemberResource;
```

- [ ] **Step 2: Run the existing endpoint test to confirm it still passes structurally**

Run: `docker compose -f backend/docker-compose.yml exec app vendor/bin/phpunit tests/Feature/Endpoints/GuildEndpointTest.php`
Expected: PASS (the existing test only asserts the `data.*` guild shape, not the members shape)

- [ ] **Step 3: Commit**

```bash
git -C backend add app/Http/Controllers/GuildController.php
git -C backend commit -m "feat(be): use GuildMemberResource and eager-load character for roster"
```

---

### Task 4: Extend the endpoint test for new roster fields

**Files:**
- Modify: `backend/tests/Feature/Endpoints/GuildEndpointTest.php`

- [ ] **Step 1: Write the failing assertion**

Add this method to the class (after `test_guild_endpoint_returns_valid_response`):

```php
#[DataProvider('guildProvider')]
public function test_guild_endpoint_returns_enriched_member_rows(array $fixture): void
{
    $this->requireFixture($fixture, 'guild');

    $url = "/api/v1/guilds/{$fixture['region']}/{$fixture['realm']}/{$fixture['name']}";

    // Cold cache may 202; warm second call.
    $this->getJson($url);
    $response = $this->getJson($url);

    $response->assertOk();

    $members = $response->json('members.data');
    $this->assertIsArray($members);
    $this->assertNotEmpty($members, 'guild has at least one member');

    $row = $members[0];
    foreach ([
        'id', 'guild_id', 'name', 'realm', 'level', 'class_id', 'race_id', 'rank',
        'faction', 'equipped_item_level', 'mythic_plus_rating',
        'active_specialization_id', 'synced_at',
    ] as $key) {
        $this->assertArrayHasKey($key, $row, "row missing key: {$key}");
    }

    $this->assertContains($row['faction'], ['Alliance', 'Horde', null]);
}
```

- [ ] **Step 2: Run the test**

Run: `docker compose -f backend/docker-compose.yml exec app vendor/bin/phpunit tests/Feature/Endpoints/GuildEndpointTest.php`
Expected: PASS (resource was wired in Task 3)

- [ ] **Step 3: Commit**

```bash
git -C backend add tests/Feature/Endpoints/GuildEndpointTest.php
git -C backend commit -m "test(be): assert enriched roster fields on guild endpoint"
```

---

## Phase 2 — Frontend constants & types

### Task 5: Extend wowConstants with race metadata

**Files:**
- Modify: `frontend/src/utils/wowConstants.ts`
- Test: `frontend/src/utils/wowConstants.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/utils/wowConstants.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  RACES,
  RACE_FACTIONS,
  RACE_WOWHEAD_SLUGS,
  RACE_DEFAULT_GENDERS,
  STALE_DATA_DAYS,
} from './wowConstants'

describe('wowConstants race metadata', () => {
  const PLAYABLE_RACE_IDS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 22, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 34, 35, 36, 37, 52, 70, 84, 85,
  ]

  it.each(PLAYABLE_RACE_IDS)('has a name for race id %i', (id) => {
    expect(RACES[id]).toBeTypeOf('string')
    expect(RACES[id]).not.toBe('')
  })

  it.each(PLAYABLE_RACE_IDS)('has a wowhead slug for race id %i', (id) => {
    expect(RACE_WOWHEAD_SLUGS[id]).toMatch(/^[a-z]+$/)
  })

  it.each(PLAYABLE_RACE_IDS)('has a default gender for race id %i', (id) => {
    expect(['male', 'female']).toContain(RACE_DEFAULT_GENDERS[id])
  })

  it('maps Alliance / Horde / Neutral correctly', () => {
    expect(RACE_FACTIONS[1]).toBe('Alliance')   // Human
    expect(RACE_FACTIONS[2]).toBe('Horde')      // Orc
    expect(RACE_FACTIONS[24]).toBeNull()        // Neutral Pandaren
    expect(RACE_FACTIONS[25]).toBe('Alliance')  // Pandaren (A)
    expect(RACE_FACTIONS[26]).toBe('Horde')     // Pandaren (H)
    expect(RACE_FACTIONS[52]).toBe('Alliance')  // Dracthyr (A)
    expect(RACE_FACTIONS[70]).toBe('Horde')     // Dracthyr (H)
  })

  it('fixes the Nightborne typo', () => {
    expect(RACES[27]).toBe('Nightborne')
  })

  it('exposes a stale-data threshold in days', () => {
    expect(STALE_DATA_DAYS).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/utils/wowConstants.test.ts`
Expected: FAIL — `RACE_FACTIONS`, `RACE_WOWHEAD_SLUGS`, `RACE_DEFAULT_GENDERS`, `STALE_DATA_DAYS` are not exported; race IDs 31, 32, 34, 35, 36, 37, 52, 70, 84, 85 missing from `RACES`; `RACES[27]` is `'Nighborne'`

- [ ] **Step 3: Update `wowConstants.ts`**

Replace the existing `RACES` constant and append the new exports. Find the `RACES` block near the end of the file and replace it with:

```ts
export const RACES: Record<number, string> = {
  1: 'Human',
  2: 'Orc',
  3: 'Dwarf',
  4: 'Night Elf',
  5: 'Undead',
  6: 'Tauren',
  7: 'Gnome',
  8: 'Troll',
  9: 'Goblin',
  10: 'Blood Elf',
  11: 'Draenei',
  22: 'Worgen',
  24: 'Pandaren',
  25: 'Pandaren',
  26: 'Pandaren',
  27: 'Nightborne',
  28: 'Highmountain Tauren',
  29: 'Void Elf',
  30: 'Lightforged Draenei',
  31: 'Zandalari Troll',
  32: 'Kul Tiran',
  34: 'Dark Iron Dwarf',
  35: 'Vulpera',
  36: "Mag'har Orc",
  37: 'Mechagnome',
  52: 'Dracthyr',
  70: 'Dracthyr',
  84: 'Earthen',
  85: 'Earthen',
}

// Wowhead zamimg URL slug per race_id (lowercase, no separators).
// Source: https://wow.zamimg.com/images/wow/icons/{size}/race_{slug}_{gender}.jpg
export const RACE_WOWHEAD_SLUGS: Record<number, string> = {
  1: 'human',
  2: 'orc',
  3: 'dwarf',
  4: 'nightelf',
  5: 'scourge',           // Wowhead spells Forsaken as 'scourge'
  6: 'tauren',
  7: 'gnome',
  8: 'troll',
  9: 'goblin',
  10: 'bloodelf',
  11: 'draenei',
  22: 'worgen',
  24: 'pandaren',
  25: 'pandaren',
  26: 'pandaren',
  27: 'nightborne',
  28: 'highmountaintauren',
  29: 'voidelf',
  30: 'lightforgeddraenei',
  31: 'zandalaritroll',
  32: 'kultiran',
  34: 'darkirondwarf',
  35: 'vulpera',
  36: 'magharorc',
  37: 'mechagnome',
  52: 'dracthyr',
  70: 'dracthyr',
  84: 'earthendwarf',
  85: 'earthendwarf',
}

export const RACE_DEFAULT_GENDERS: Record<number, 'male' | 'female'> = {
  1: 'male', 2: 'male', 3: 'male', 4: 'female', 5: 'male', 6: 'male', 7: 'male',
  8: 'male', 9: 'male', 10: 'female', 11: 'male', 22: 'male', 24: 'male',
  25: 'male', 26: 'male', 27: 'female', 28: 'male', 29: 'male', 30: 'male',
  31: 'male', 32: 'male', 34: 'male', 35: 'male', 36: 'male', 37: 'male',
  52: 'male', 70: 'male', 84: 'male', 85: 'male',
}

// Mirrors backend RaceFaction map. Server is the authority; this map is only
// used for client-only contexts (e.g. test fixtures) — at runtime, faction
// comes from the API response.
export const RACE_FACTIONS: Record<number, 'Alliance' | 'Horde' | null> = {
  1: 'Alliance', 3: 'Alliance', 4: 'Alliance', 7: 'Alliance', 11: 'Alliance',
  22: 'Alliance', 25: 'Alliance', 29: 'Alliance', 30: 'Alliance', 32: 'Alliance',
  34: 'Alliance', 37: 'Alliance', 52: 'Alliance', 85: 'Alliance',
  2: 'Horde', 5: 'Horde', 6: 'Horde', 8: 'Horde', 9: 'Horde', 10: 'Horde',
  26: 'Horde', 27: 'Horde', 28: 'Horde', 31: 'Horde', 35: 'Horde', 36: 'Horde',
  70: 'Horde', 84: 'Horde',
  24: null, // Neutral Pandaren
}

// Days after which character-derived data (iLvl, M+) is rendered as stale.
export const STALE_DATA_DAYS = 7
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/utils/wowConstants.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C frontend add src/utils/wowConstants.ts src/utils/wowConstants.test.ts
git -C frontend commit -m "feat(fe): extend wowConstants with race slugs/factions/genders for roster"
```

---

### Task 6: Extend GuildMember type

**Files:**
- Modify: `frontend/src/types/guild.ts`

- [ ] **Step 1: Update the `GuildMember` interface**

Replace the existing `GuildMember` interface (the one with 9 fields) with:

```ts
export interface GuildMember {
  id: number
  guild_id: number
  name: string
  realm: string
  display_name?: string | null
  display_realm?: string | null
  level: number
  class_id: number
  race_id: number
  rank: number
  faction: 'Alliance' | 'Horde' | null
  equipped_item_level: number | null
  mythic_plus_rating: { rating: number; color: string | null } | null
  active_specialization_id: number | null
  synced_at: string | null
}
```

- [ ] **Step 2: Run typecheck to confirm callers compile**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: PASS — the only consumer is `RosterTable.vue`, which we rewrite in Task 9. If the typecheck flags missing fields in the current `RosterTable.vue`, ignore until Task 9 — proceed to commit.

If typecheck fails on `RosterTable.vue` specifically, comment out the failing render lines temporarily; we replace the file in Task 9 anyway. (Use `// @ts-expect-error - rewritten in Task 9` if needed.)

- [ ] **Step 3: Commit**

```bash
git -C frontend add src/types/guild.ts
git -C frontend commit -m "feat(fe): extend GuildMember type with character-derived fields"
```

---

## Phase 3 — Frontend RaceIcon

### Task 7: Replace RaceIcon with Wowhead-CDN-backed component

**Files:**
- Modify: `frontend/src/components/wow/RaceIcon.vue`
- Test: `frontend/src/components/wow/__tests__/RaceIcon.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/wow/__tests__/RaceIcon.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RaceIcon from '../RaceIcon.vue'

describe('RaceIcon', () => {
  it('renders a Wowhead img URL using the slug + default gender', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 4 } }) // Night Elf, default female
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(
      'https://wow.zamimg.com/images/wow/icons/medium/race_nightelf_female.jpg',
    )
    expect(img.attributes('title')).toBe('Night Elf')
  })

  it('respects an explicit gender prop', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 1, gender: 'female' } })
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://wow.zamimg.com/images/wow/icons/medium/race_human_female.jpg',
    )
  })

  it('falls back to the initial-badge when slug is unknown', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 99999 } })
    expect(wrapper.find('img').exists()).toBe(false)
    // Initial-badge fallback retains the old visual (single letter)
    expect(wrapper.text()).toBe('U') // 'Unknown' -> 'U'
  })

  it('honors the size prop', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 1, size: 18 } })
    const img = wrapper.find('img')
    expect(img.attributes('width')).toBe('18')
    expect(img.attributes('height')).toBe('18')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/wow/__tests__/RaceIcon.test.ts`
Expected: FAIL — current `RaceIcon.vue` renders a `<span>`, not an `<img>`.

- [ ] **Step 3: Replace `RaceIcon.vue`**

Overwrite `frontend/src/components/wow/RaceIcon.vue` with:

```vue
<template>
  <img
    v-if="src && !imgError"
    :src="src"
    :width="size"
    :height="size"
    :title="name"
    :alt="name"
    class="inline-block align-middle rounded-sm"
    loading="lazy"
    @error="imgError = true"
  />
  <span
    v-else
    class="inline-flex items-center justify-center rounded text-white font-bold align-middle bg-neutral"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.floor(size * 0.55))}px`,
    }"
    :title="name"
  >
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RACES, RACE_WOWHEAD_SLUGS, RACE_DEFAULT_GENDERS } from '@/utils/wowConstants'

const props = withDefaults(
  defineProps<{
    raceId: number
    gender?: 'male' | 'female'
    size?: number
  }>(),
  { size: 24 },
)

const imgError = ref(false)
const name = computed(() => RACES[props.raceId] ?? 'Unknown')
const initial = computed(() => (name.value[0] ?? '?').toUpperCase())

const slug = computed(() => RACE_WOWHEAD_SLUGS[props.raceId])
const resolvedGender = computed(
  () => props.gender ?? RACE_DEFAULT_GENDERS[props.raceId] ?? 'male',
)

const src = computed(() => {
  if (!slug.value) return null
  return `https://wow.zamimg.com/images/wow/icons/medium/race_${slug.value}_${resolvedGender.value}.jpg`
})
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/wow/__tests__/RaceIcon.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git -C frontend add src/components/wow/RaceIcon.vue src/components/wow/__tests__/RaceIcon.test.ts
git -C frontend commit -m "feat(fe): RaceIcon backed by Wowhead zamimg CDN with fallback"
```

---

## Phase 4 — Frontend table

### Task 8: useTableSort composable

**Files:**
- Create: `frontend/src/composables/useTableSort.ts`
- Test: `frontend/src/composables/useTableSort.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTableSort } from './useTableSort'

interface Row {
  id: number
  name: string
  ilvl: number | null
}

const rows: Row[] = [
  { id: 1, name: 'Bob',   ilvl: 480 },
  { id: 2, name: 'Alice', ilvl: 510 },
  { id: 3, name: 'Carol', ilvl: null },
  { id: 4, name: 'Dave',  ilvl: 480 },
]

describe('useTableSort', () => {
  it('returns rows in original order with no sort key', () => {
    const source = ref(rows)
    const { sortedRows } = useTableSort<Row>(source, null)
    expect(sortedRows.value.map((r) => r.id)).toEqual([1, 2, 3, 4])
  })

  it('sorts ascending by string key', () => {
    const source = ref(rows)
    const { sortedRows, toggle } = useTableSort<Row>(source, null)
    toggle('name')
    expect(sortedRows.value.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Carol', 'Dave'])
  })

  it('toggles to descending on second click of same key', () => {
    const source = ref(rows)
    const { sortedRows, toggle, sortDir } = useTableSort<Row>(source, null)
    toggle('name')
    toggle('name')
    expect(sortDir.value).toBe('desc')
    expect(sortedRows.value.map((r) => r.name)).toEqual(['Dave', 'Carol', 'Bob', 'Alice'])
  })

  it('sinks null values to the bottom on ascending numeric sort', () => {
    const source = ref(rows)
    const { sortedRows, toggle } = useTableSort<Row>(source, null)
    toggle('ilvl')
    const ids = sortedRows.value.map((r) => r.id)
    expect(ids[ids.length - 1]).toBe(3) // Carol (null) at the bottom
  })

  it('preserves original order on ties (stable sort)', () => {
    const source = ref(rows)
    const { sortedRows, toggle } = useTableSort<Row>(source, null)
    toggle('ilvl')
    // Bob (id 1) and Dave (id 4) both have ilvl 480 — Bob first by insertion order.
    const bobIdx = sortedRows.value.findIndex((r) => r.id === 1)
    const daveIdx = sortedRows.value.findIndex((r) => r.id === 4)
    expect(bobIdx).toBeLessThan(daveIdx)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/composables/useTableSort.test.ts`
Expected: FAIL — `useTableSort` not found

- [ ] **Step 3: Implement the composable**

```ts
import { computed, ref, type Ref } from 'vue'

export type SortDir = 'asc' | 'desc'

export function useTableSort<T extends Record<string, unknown>>(
  source: Ref<T[]>,
  initialKey: keyof T | null,
) {
  const sortKey = ref<keyof T | null>(initialKey) as Ref<keyof T | null>
  const sortDir = ref<SortDir>('asc')

  function toggle(key: keyof T) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const sortedRows = computed<T[]>(() => {
    if (sortKey.value === null) return source.value
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1

    // Decorate-sort-undecorate for stable ordering on ties.
    return source.value
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const av = a.row[key]
        const bv = b.row[key]
        const aNull = av === null || av === undefined
        const bNull = bv === null || bv === undefined
        if (aNull && bNull) return a.index - b.index
        if (aNull) return 1 // nulls always sink (regardless of direction)
        if (bNull) return -1

        let cmp: number
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else {
          cmp = String(av).localeCompare(String(bv))
        }
        if (cmp === 0) return a.index - b.index
        return cmp * dir
      })
      .map(({ row }) => row)
  })

  return { sortKey, sortDir, sortedRows, toggle }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/composables/useTableSort.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git -C frontend add src/composables/useTableSort.ts src/composables/useTableSort.test.ts
git -C frontend commit -m "feat(fe): useTableSort composable with null-sinking and stable ties"
```

---

### Task 9: Rewrite RosterTable for dense layout + new columns

**Files:**
- Modify: `frontend/src/components/guild/RosterTable.vue`

- [ ] **Step 1: Replace `RosterTable.vue` entirely**

Overwrite the file with:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { CLASS_COLORS, STALE_DATA_DAYS } from '@/utils/wowConstants'
import { displayName } from '@/utils/display'
import { useTableSort } from '@/composables/useTableSort'
import type { Paginated } from '@/types/api'
import type { GuildMember } from '@/types/guild'

const props = defineProps<{
  members: Paginated<GuildMember>
  page: number
  filterText?: string
}>()

const emit = defineEmits<{ pageChange: [page: number] }>()

const currentPage = computed(() => props.members.current_page)
const lastPage = computed(() => props.members.last_page)

const filteredRows = computed(() => {
  const rows = props.members.data
  const q = (props.filterText ?? '').trim().toLowerCase()
  if (!q) return rows
  return rows.filter((m) => m.name.toLowerCase().includes(q))
})

// Flatten nested mythic_plus_rating onto a top-level sort key.
const sortableRows = computed(() =>
  filteredRows.value.map((m) => ({
    ...m,
    mythic_plus_score: m.mythic_plus_rating?.rating ?? null,
  })),
)

const { sortedRows, sortKey, sortDir, toggle } = useTableSort(sortableRows, 'rank')

const STALE_MS = STALE_DATA_DAYS * 24 * 60 * 60 * 1000
function isStaleSync(syncedAt: string | null): boolean {
  if (!syncedAt) return false
  return Date.now() - new Date(syncedAt).getTime() > STALE_MS
}

function classColor(classId: number): string | undefined {
  return CLASS_COLORS[classId]
}

function ariaSort(key: keyof GuildMember | 'mythic_plus_score'): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function sortGlyph(key: keyof GuildMember | 'mythic_plus_score'): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

function goPrev() { if (currentPage.value > 1) emit('pageChange', currentPage.value - 1) }
function goNext() { if (currentPage.value < lastPage.value) emit('pageChange', currentPage.value + 1) }
function goTo(p: number) {
  if (p !== currentPage.value && p >= 1 && p <= lastPage.value) emit('pageChange', p)
}

const pageWindow = computed<number[]>(() => {
  const total = lastPage.value
  const cur = currentPage.value
  if (total <= 1) return [1]
  const radius = 2
  const start = Math.max(1, cur - radius)
  const end = Math.min(total, cur + radius)
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
})

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < lastPage.value)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-x-auto rounded-md border border-base-300">
      <table class="table table-zebra table-xs roster-table">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-base-content/70">
            <th
              role="columnheader"
              :aria-sort="ariaSort('name')"
              class="cursor-pointer select-none"
              @click="toggle('name')"
            >
              Name<span class="text-base-content/50">{{ sortGlyph('name') }}</span>
            </th>
            <th class="w-8 text-center">Cls</th>
            <th class="w-8 text-center hidden sm:table-cell">Spec</th>
            <th class="w-8 text-center">Race</th>
            <th class="w-8 text-center hidden sm:table-cell">Side</th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('level')"
              class="text-right cursor-pointer select-none w-12"
              @click="toggle('level')"
            >
              Lvl<span class="text-base-content/50">{{ sortGlyph('level') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('equipped_item_level')"
              class="text-right cursor-pointer select-none w-14 hidden sm:table-cell"
              @click="toggle('equipped_item_level')"
            >
              iLvl<span class="text-base-content/50">{{ sortGlyph('equipped_item_level') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('mythic_plus_score')"
              class="text-right cursor-pointer select-none w-16 hidden sm:table-cell"
              @click="toggle('mythic_plus_score')"
            >
              M+<span class="text-base-content/50">{{ sortGlyph('mythic_plus_score') }}</span>
            </th>
            <th
              role="columnheader"
              :aria-sort="ariaSort('rank')"
              class="text-right cursor-pointer select-none w-12"
              @click="toggle('rank')"
            >
              Rank<span class="text-base-content/50">{{ sortGlyph('rank') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedRows.length === 0">
            <td colspan="9" class="text-center text-base-content/60">No members match your filter.</td>
          </tr>
          <tr v-for="m in sortedRows" :key="m.id">
            <td class="font-medium" :style="{ color: classColor(m.class_id) }">
              {{ displayName(m.name, m.display_name) }}
            </td>
            <td class="text-center">
              <ClassIcon :class-id="m.class_id" :size="18" />
            </td>
            <td class="text-center hidden sm:table-cell">
              <SpecIcon
                v-if="m.active_specialization_id"
                :spec-id="m.active_specialization_id"
                :size="18"
              />
              <span v-else class="text-base-content/40">—</span>
            </td>
            <td class="text-center">
              <RaceIcon :race-id="m.race_id" :size="18" />
            </td>
            <td class="text-center hidden sm:table-cell">
              <FactionBadge v-if="m.faction" :faction="m.faction" :size="14" />
            </td>
            <td class="text-right tabular-nums">{{ m.level }}</td>
            <td
              class="text-right tabular-nums hidden sm:table-cell"
              :class="{ 'italic text-base-content/50': isStaleSync(m.synced_at) }"
            >
              <template v-if="m.equipped_item_level != null">{{ m.equipped_item_level }}</template>
              <span v-else class="text-base-content/40">—</span>
            </td>
            <td
              class="text-right tabular-nums hidden sm:table-cell"
              :class="{ 'italic opacity-70': isStaleSync(m.synced_at) }"
            >
              <span
                v-if="m.mythic_plus_rating"
                :style="{ color: m.mythic_plus_rating.color ?? undefined }"
              >
                {{ m.mythic_plus_rating.rating }}
              </span>
              <span v-else class="text-base-content/40">—</span>
            </td>
            <td class="text-right tabular-nums">{{ m.rank }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="flex items-center justify-between gap-2">
      <p class="text-xs text-base-content/60">
        Page {{ currentPage }} of {{ lastPage }} · {{ members.total }} members
      </p>
      <div class="join">
        <button type="button" class="btn btn-sm join-item" :disabled="!hasPrev" @click="goPrev">Previous</button>
        <button
          v-for="p in pageWindow"
          :key="p"
          type="button"
          class="btn btn-sm join-item"
          :class="{ 'btn-active': p === currentPage }"
          @click="goTo(p)"
        >
          {{ p }}
        </button>
        <button type="button" class="btn btn-sm join-item" :disabled="!hasNext" @click="goNext">Next</button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.roster-table :deep(td),
.roster-table :deep(th) {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
</style>
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Visual smoke test**

The dev environment is the docker stack — frontend is served from the FE nginx container at `http://100.82.124.39:8092/`. Open `http://100.82.124.39:8092/guilds/eu/the-maelstrom/<a-known-guild>` (use any guild that contains a synced character such as `melaniya` from the test-character fixture; pick a guild from the homepage's "popular" list if unsure).

Confirm by inspection:
- 9 columns at desktop width: Name | Cls | Spec | Race | Side | Lvl | iLvl | M+ | Rank
- Class icon is 18px (smaller than before)
- Race icon is a real race portrait, not a letter-badge
- Faction badge appears for non-neutral races
- iLvl/M+ show `—` for unsynced members and a number (with M+ color tint) for synced ones
- Resize browser narrower than `sm` (≤640px): Spec, Side, iLvl, M+ columns disappear; remaining columns stay readable
- Click a column header → rows reorder; click again → reverses

Note any visual issue and fix inline before committing.

- [ ] **Step 4: Run vitest suite to confirm nothing else broke**

Run: `cd frontend && npx vitest run`
Expected: All previously-passing tests still pass.

- [ ] **Step 5: Commit**

```bash
git -C frontend add src/components/guild/RosterTable.vue
git -C frontend commit -m "feat(fe): denser guild roster with spec/faction/iLvl/M+ columns and sortable headers"
```

---

## Phase 5 — Documentation

### Task 10: Document icon sources in frontend CLAUDE.md

**Files:**
- Modify: `frontend/CLAUDE.md`

- [ ] **Step 1: Add an "Icon sources" section**

Read `frontend/CLAUDE.md` first to find an appropriate insertion point (likely near other asset/wow notes). Append (or insert under an existing assets-related heading) the following section verbatim:

```markdown
## Icon sources

### Runtime CDN

- **Race icons:** `https://wow.zamimg.com/images/wow/icons/{size}/race_{slug}_{gender}.jpg`
  - `{size}` = `large` (56px), `medium` (36px), or `small` (18px)
  - `{slug}` = lowercase, no separators (`bloodelf`, `nightelf`, `kultiran`, `lightforgeddraenei`, `magharorc`, etc.). The race_id → slug map lives in `src/utils/wowConstants.ts` as `RACE_WOWHEAD_SLUGS`.
  - `{gender}` = `male` or `female`. Default per race in `RACE_DEFAULT_GENDERS`.
  - Domain `wow.zamimg.com` is already trusted (Wowhead tooltip widget loads from it).
  - Notable slug quirks: Forsaken/Undead → `scourge`, Earthen → `earthendwarf`.

### Manual reference catalogs (do not hotlink)

Fandom blocks programmatic fetches and may block hotlinking. Use these only as human-browsable references during development:

- https://wowpedia.fandom.com/wiki/Wowpedia:WoW_Icons — top-level index of every icon category
- https://wowpedia.fandom.com/wiki/Wowpedia:List_of_humanoid_icons — race / humanoid icon catalog with PascalCase slugs (`NightElf`, `BloodElf`, `KulTiran`, `MagharOrc`, etc.)
- https://wowpedia.fandom.com/wiki/Wowpedia:List_of_small_icons — `ObjectIconsAtlas.png` reference (faction sigils, currency icons, miscellaneous small UI icons). Extract sprites manually if a new icon is needed.

### Local sprite sheets

Class and spec icons are shipped as local sprite sheets to keep them stable across CDN changes:
- `src/assets/wow/classes-sprite.png` (256×256, 64px tiles)
- `src/assets/wow/specs-sprite.png` (448×384, 64px tiles)

Coordinate maps and helpers live in `src/utils/wowIcons.ts`.
```

- [ ] **Step 2: Commit**

```bash
git -C frontend add CLAUDE.md
git -C frontend commit -m "docs(fe): document icon sources (Wowhead CDN + Wowpedia references)"
```

---

## Phase 6 — End-to-end verification

### Task 11: Final verification pass

- [ ] **Step 1: Full BE test suite**

Run: `docker compose -f backend/docker-compose.yml exec app vendor/bin/phpunit --group integration tests/Feature/Endpoints/GuildEndpointTest.php`
Expected: PASS

- [ ] **Step 2: Full FE test suite**

Run: `cd frontend && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Typecheck FE**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Build FE**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors. (The FE deploys static files; nginx serves the resulting `dist/`.)

- [ ] **Step 5: Manual smoke at http://100.82.124.39:8092/**

Navigate to a guild page (use one from the homepage "popular" list). Verify the new dense roster renders, race icons load from `wow.zamimg.com`, sortable headers work, and mobile layout (resize to ≤640px) hides the right columns gracefully.

If any visible regression: stop and fix before declaring done. Do not commit a half-working state.

- [ ] **Step 6: Final commit (if any inline fixes were needed during step 5)**

If no fixes needed, no commit. Otherwise:

```bash
git -C frontend add <files>
git -C frontend commit -m "fix(fe): <description of inline fix>"
```

---

## Spec coverage check

| Spec section | Implemented in |
|--------------|----------------|
| 9 columns left→right | Task 9 |
| Wowhead race icons | Task 5 (slugs) + Task 7 (component) |
| 18px icons | Task 9 (per-instance `:size="18"`) |
| Class color on name | Task 9 (`classColor()` style binding) |
| Stale-data muted style | Task 9 (`isStaleSync()` + class binding) |
| Mobile column collapse (sm) | Task 9 (`hidden sm:table-cell`) |
| Sortable headers | Task 8 (composable) + Task 9 (wired) |
| Default sort = rank asc | Task 9 (`useTableSort(..., 'rank')`) |
| Stable sort on ties | Task 8 (decorate-sort-undecorate, tested) |
| `GuildMemberResource` | Task 2 |
| `faction` derived server-side | Task 1 + Task 2 |
| `equipped_item_level`, `mythic_plus_rating`, `active_specialization_id`, `synced_at` exposed | Task 2 |
| Eager-load character | Task 3 |
| Existing client-side name filter retained | Task 9 |
| `STALE_DATA_DAYS = 7` | Task 5 |
| Race-icon error fallback to initial badge | Task 7 |
| Wowpedia + ObjectIconsAtlas documented as references | Task 10 |
| Wowhead CDN documented as runtime source | Task 10 |
