# CODEX_V0_8_4_READABLE_MACRO_PATTERNS_PROMPT.md

Copy this prompt into Codex.

This is a focused readability / pattern-shaping patch for the current V0.9 codebase.

It is not a conceptual rebase.

It is not a replacement for the Macro World Layer.

It should keep the existing V0.8.3 ecology and V0.9 macro observer, but make bottom-layer patterns more visually readable.

Set patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
```

Keep version split clear:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
```

---

# Read first

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_MEMORY_CN.md
Docs/Tasks/CODEX_V0_9_MACRO_WORLD_LAYER_PROMPT.md
sim.js
index.html
style.css
```

Act as Executor.

If older V0.1-V0.8 task prompts conflict with this prompt, follow this prompt.

If this prompt conflicts with `TRI_SPECIES_WORLD_SIM_RULES.md`, update the rules file with a V0.8.4 section before changing code.

---

# Hard constraints

Do not add new visible terrain.

Do not add DEPLETED terrain.

Do not add corpse overlay.

Do not restore 0-100 fertility.

Do not add economy/resources/buildings/NPCs/quests/tarot/story events.

Do not implement Zelda-style multi-screen maps.

Do not add screen-to-screen propagation.

Do not add external libraries.

Do not remove the V0.9 macroWorld export.

Do not replace the current macro layer.

Do not add a complex worldgen / biome system in this patch.

Do not add settler trail fields in this patch.

Do not add Spirit origin fields in this patch.

Keep changes small, local, and explainable.

---

# Why V0.8.4 exists

Recent V0.9 recordings show that the Macro World Layer is connected and useful, but the bottom layer is still hard to read visually.

Observed from recent recordings:

```text
Run A:
H 24 -> 165 -> 35 -> 59
F 82 -> 315 -> 155 -> 199
W 148 -> 29
M 22 -> 97 -> 23

Run B:
H 24 -> 260 -> 0
F 42 -> 436 -> 110
W 126 -> 34
M 36 -> 176 -> 0
```

Interpretation:

```text
Humans can boom too fast.
FIELD can spread faster than it becomes visually meaningful.
WILD cores often collapse into small remnants.
MARK can behave like scattered noise instead of readable scars.
Macro routes and outbreaks can remain active too long.
```

The goal is not to make the world safer or perfectly balanced.

The goal is to make the world produce clearer visible patterns:

```text
FIELD = recognizable settlement blocks
WILD = recognizable wild/recovery cores
MARK = recognizable scars/outbreak residue
Settlers = migration pressure without visual chaos
Spirit = local outbreak lifecycle
Macro icons = less permanent active noise
```

---

# Design goal

V0.8.4 should make existing systems more readable by reducing overactivity and improving persistence of meaningful clusters.

Expected visual improvement:

```text
Human FIELD forms fewer, clearer settlement blocks.
Crowded or depleted settlements send settlers instead of only continuing local birth.
WILD has a few more persistent cores.
MARK noise decays, but clustered MARK survives as visible scar.
Old FIELD near MARK reads as ruin / abandoned settlement.
Macro route/outbreak labels age out of active state instead of staying active forever.
```

---

# Part A - Lower Human birth and require FIELD core support

Current issue:

```text
Human population can explode early.
This creates huge FIELD blankets, then fertility crash and mass decline.
```

Current code likely has:

```js
surplus birth chance: 0.28
balanced birth chance: 0.12
pressured birth chance: 0.04
```

Change to:

```js
surplus: 0.18
balanced: 0.07
pressured: 0.015
collapse: 0
```

Add FIELD core support gate:

```text
For a Human birth target on FIELD:
    if neighboring FIELD count >= 3:
        use normal chance
    else:
        chance *= 0.35
```

Keep existing requirements:

```text
target has no unit
terrain is FIELD
fertility >= 2
neighboring Human count is 2 or 3
neighboring Beast count <= 1
neighboring Spirit count == 0
local condition matters
```

Expected visual difference:

```text
Humans should still grow, but FIELD/H expansion should be less explosive.
Settlement blocks should be more compact.
```

Failure signs:

```text
Humans regularly fail to survive past tick 100 in balanced seeds.
No settlementFoundings occur in Human Migration / Expansion tests.
```

---

# Part B - Convert low-fertility crowding into crisis migration

Current issue:

```text
Population pressure can still express as local boom before migration becomes visually meaningful.
```

Use existing `applySettlerSpawns()` and `humanLocalCondition()`.

Add or strengthen crisis pressure:

```text
If Human local radius 2 has:
    neighboring/nearby Human pressure high
    FIELD count high
    average FIELD fertility <= 1.5
Then:
    reduce local birth elsewhere via Part A
    increase crisis settler departure chance here
```

Recommended condition:

```text
local Human count radius 2 >= 8
local FIELD count radius 2 >= 6
average FIELD fertility <= 1.5
```

Recommended effect in `applySettlerSpawns()`:

```js
const depletedCrowdingPressure = localHumanCount >= 8 && localFieldCount >= 6 && averageFieldFertility <= 1.5;
const crisisPressure = existingCrisisPressure || depletedCrowdingPressure;
```

If `depletedCrowdingPressure` is true:

```text
use crisis settler chance at least 0.14
role -> settler_seeking_crisis
increment crisisSettlerDepartures
```

Do not spawn extra Humans for crisis migration.

Expected visual difference:

```text
Overloaded settlements should shed moving settlers before total collapse.
```

---

# Part C - Preserve meaningful WILD cores without adding wildCoreScore

Current issue:

```text
WILD often collapses from initial patches into small remnants.
Beast recovery becomes hard to see.
```

Do not add a new hidden `wildCoreScore` field.

Use existing local WILD/fertility checks in `applyTerrainDecay()`.

Current WILD decay likely resembles:

```js
if WILD and no Beast in radius 2 and terrainAge > 30:
    with 0.015 chance WILD -> EMPTY
```

Change:

```text
If WILD has no Beast in radius 2 and terrainAge > 30:
    if WILD count in radius 2 >= 5 and average WILD fertility nearby >= 3:
        decay chance = 0.003
    else:
        decay chance = 0.015
```

Do not make WILD permanent.

Do not let WILD flood the map.

Expected visual difference:

```text
Scattered unsupported WILD can still decay.
Dense fertile WILD patches persist long enough to read as wild cores.
```

---

# Part D - Slightly prefer WILD clusters for Beast relocation

Current issue:

```text
Beast relocation prefers single high-fertility cells but does not strongly preserve visible wild zones.
```

In `findBeastRelocationTarget()`, keep existing constraints:

```text
target unoccupied
not BLOCK/BORDER/MARK
WILD or EMPTY fertility >= 3
avoid 2+ Humans
avoid 2+ Beasts
```

Add a small preference:

```text
WILD neighbors near target reduce relocation score.
High WILD count in radius 2 is good.
```

Example:

```js
const wildClusterBonus = countTerrainInRadius(source, nx, ny, TERRAIN.WILD, 2);
score -= wildClusterBonus * 6;
```

Keep this mild.

Expected visual difference:

```text
Dispersed Beasts more often relocate into existing wild areas, helping wild cores remain active.
```

---

# Part E - MARK isolated-fast / clustered-slow decay

Current issue:

```text
MARK can look like scattered noise.
Spirit scars should persist as clusters, while isolated MARK should fade.
```

Change `applyTerrainDecay()` MARK logic.

For MARK with no Spirit on/near it:

```text
isolated MARK:
    neighboring MARK count <= 1
    decay chance after min lifetime = 0.10

clustered MARK:
    neighboring MARK count >= 3
    decay chance after min lifetime = 0.015

ordinary MARK:
    decay chance after min lifetime = existing 0.04
```

Keep low-fertility accelerated decay, but do not let it erase clustered scars too fast.

Suggested:

```text
If clustered MARK, ignore or halve the low-fertility accelerated decay.
```

Expected visual difference:

```text
Random one-off MARK disappears.
Local Spirit outbreak residue remains as readable scar.
```

---

# Part F - Make abandoned FIELD near MARK read as ruin

Current issue:

```text
Old FIELD can remain, but abandoned/haunted ruin readability is inconsistent.
```

Use existing terrain and `terrainAge`.

Do not add buildings.

Do not add ruin terrain.

In `applyTerrainDecay()` FIELD logic:

```text
If FIELD has no nearby Human:
    if fertility == 0 and nearby MARK == 0:
        FIELD -> EMPTY

    if fertility == 0 and nearby MARK > 0:
        FIELD may become MARK or remain FIELD longer

    if fertility <= 1 and nearby MARK >= 2:
        slow decay; preserve for abandoned_settlement detection
```

Recommended simple version:

```text
When FIELD fertility == 0 and no nearby Human:
    if nearby MARK >= 2:
        with 0.5 chance remain FIELD this tick
        otherwise FIELD -> MARK
    else:
        FIELD -> EMPTY
```

Expected visual difference:

```text
Failed settlements leave a visible FIELD/MARK ruin pattern for a while.
```

---

# Part G - Fix macro route lifecycle

Current issue:

```text
migration_route can remain active even after Humans are extinct or settler movement has stopped.
```

Do not add settler trail fields in this patch.

Update macro route state rules:

```text
If recent settler samples or recent settler moves exist:
    active_route

If no recent settler samples for 75 ticks:
    old_route

If route crosses nearby MARK/S pressure:
    dangerous_route

If total Humans == 0:
    abandoned_route or old_route
    visible only if confidence remains high enough
```

Lower confidence when inactive:

```text
confidence *= 0.65 after 75 inactive ticks
confidence *= 0.35 after 150 inactive ticks
```

Expected visual difference:

```text
Routes stop claiming to be active after migration stops.
Old paths can remain as memory, not active event.
```

---

# Part H - Fix macro Spirit outbreak lifecycle

Current issue:

```text
spirit_outbreak can remain active for hundreds of ticks after the local outbreak should have become aftermath/scar.
```

Update macro event state rules:

```text
warning:
    dormant Spirit near Humans

active_outbreak:
    active Spirit exists
    or recent humanDeathsToSpirit / spiritTrailMarksCreated near the event

aftermath:
    no dormant/active Spirit for 25 ticks
    but recent MARK or Spirit trail remains

scar:
    no Spirit for 75 ticks
    clustered MARK remains

archived/hidden:
    no Spirit and no clustered MARK remains
```

If local event positions are not available, use current world evidence plus recent global counters.

Important:

```text
Do not let one global active Spirit keep every old outbreak active.
Prefer creating a new outbreak if center is far from old one.
```

Suggested matching tightening:

```text
A Spirit outbreak candidate should only match an existing outbreak if center distance <= 6.
Otherwise create a new outbreak id.
```

Expected visual difference:

```text
Spirit outbreaks become readable episodes:
warning -> active -> aftermath -> scar.
```

---

# Part I - Macro visible icon filtering

Current issue:

```text
Macro icons can be technically correct but visually noisy.
```

Keep existing max icon count.

Add or strengthen priority:

```text
1. active Spirit outbreak / warning near Humans
2. living settlement
3. abandoned settlement / scar
4. active beast recovery
5. active human-beast frontier
6. old route
```

Do not show multiple icons too close together unless one is an active outbreak.

Recommended:

```text
If icon centers are within 4 cells:
    keep higher priority / higher confidence
```

Expected visual difference:

```text
The overlay should explain the map instead of labeling every small fluctuation.
```

---

# Part J - Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add V0.8.4 notes:

```text
V0.8.4 is a readability / pattern-shaping patch.
It does not add new terrain or new systems.
It lowers early Human overexpansion.
It makes FIELD birth prefer settlement cores.
It turns depleted crowding into crisis migration pressure.
It helps dense fertile WILD persist as readable wild cores.
It makes isolated MARK fade faster and clustered MARK persist as scars.
It makes abandoned FIELD near MARK read more clearly as ruin.
It improves macro route and Spirit outbreak lifecycles.
```

Keep V0.9 notes:

```text
Macro layer remains V0.9 and observer/interpreter only.
```

---

# Test checklist

Run and export recordings:

```text
Balanced Asymmetric Ecology Test 0-300
Balanced Asymmetric Ecology Test 0-800
Human Migration Test 0-300
Human Expansion Test 0-300
Beast Dispersion Test 0-250
Spirit Outbreak Test 0-250
No Spirit Control 0-250
```

Check:

```text
1. No console errors.
2. Humans do not routinely explode above 200 by tick 100 in Balanced.
3. Humans still survive and found settlements in at least some Balanced/Human Migration seeds.
4. FIELD forms more compact settlement blocks.
5. crisisSettlerDepartures still occur when FIELD fertility drops.
6. WILD does not vanish too quickly from all regions.
7. WILD does not flood the whole map.
8. MARK clusters persist longer than isolated MARK.
9. Failed settlements leave readable FIELD/MARK residue.
10. migration_route does not remain active after migration stops or H == 0.
11. spirit_outbreak transitions to aftermath/scar when S disappears.
12. Snapshot and recording JSON still include macroWorld/macroFrames.
13. Macro icon overlay remains readable.
```

Useful numeric signs:

```text
H at tick 100 in Balanced should usually be lower than the previous 150-260 spike range.
WILD should retain some persistent clusters in long Balanced runs.
marksDecayed should remain active, but clustered scars should still be visible in keyframes.
settlementFoundings should not drop to zero across migration-oriented runs.
```

Failure signs:

```text
Human extinction becomes common before tick 100.
No settlers move or found after the birth reduction.
WILD becomes permanent and dominates the map.
MARK never decays.
macroWorld export breaks.
Macro events disappear too aggressively and no history remains.
```

---

# Completion report

When finished, report:

```text
files changed
patch version
ecology base version
macro layer version
Human birth/core changes
crisis migration pressure changes
WILD persistence / Beast relocation changes
MARK decay changes
abandoned FIELD / ruin readability changes
macro route lifecycle changes
macro Spirit outbreak lifecycle changes
tests run
known simplifications or deviations
expected visual difference
```

Known acceptable simplifications:

```text
WILD core is computed locally, not stored as a new field.
Migration routes are still approximate.
Spirit outbreak lifecycle may use current grid evidence if local event positions are incomplete.
Icons may remain text markers.
No geographic biome system is added yet.
```
