# CODEX V0.12.1 Explore View Correction Prompt

## Summary

Implement V0.12.1 as a targeted correction pass for Explore View.

V0.12 added the first local exploration mode, but the current implementation does not yet match the intended player-facing experience:

1. Explore View renders like local Cell View instead of local Macro View.
2. Player movement is grid-step movement rather than smooth free movement.
3. Space interaction is unreliable for POIs and Human civilization tags.
4. E sleep shows a global view but does not itself advance world time unless Play is already running.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.12.1_EXPLORE_VIEW_CORRECTION
```

This is still not the Zelda-style multi-screen map. Keep the existing single 40x25 world.

## Design Goal

Explore View should feel like a local player window into the existing Macro View display layer.

The player should:

```text
move smoothly through the world
see a local viewport rendered with Macro View visual semantics
reliably inspect nearby POIs and Human civilization traces
sleep to automatically watch the global world evolve
wake back into the local viewport
```

## Hard Scope

Do implement:

```text
local Explore viewport uses Macro View display masks/classes
continuous player position and smooth movement
grid/blocker collision sampled from continuous movement
stable Space interaction with POIs and Human civilization traces
sleep mode auto-advances simulation
sleep mode displays global Macro View while advancing
tests for all four corrected behaviors
```

Do not implement:

```text
multi-screen Zelda map
fog of war
explored-cell memory
minimap
combat
items
inventory
quests
NPCs
dialogue trees
buildings
resources
season system
dynamic POIs
player effects on simulation rules
new terrain
new species
save/load
external libraries
```

## Preserve Existing Simulation Rules

Read:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
```

Do not change:

```text
H/B/S movement
conflict
conversion
terrain rewrite
reproduction
fertility
POI effects
terrain decay
macro memory
Human lineage / polity / village rules
grid size
terrain schema
unit schema
```

## Problem 1: Explore View Uses Cell View Instead Of Macro View

Current evidence:

```js
renderExploreWorld()
  gridEl.classList.toggle("macro-view", false)
  nextClassName = `cell ${terrainClass(cell.terrain)} ${fertilityClass(cell.fertility)} ...`
```

This makes Explore View look like Cell View.

Required behavior:

```text
Explore View should render the local viewport using the same visual language as Macro View.
```

Implementation guidance:

1. Build macro display masks from `macroDisplayWorld || world`:

```js
const source = macroDisplayWorld || world;
const macroMasks = buildMacroDisplayMasks(source, "macro");
```

2. For each local viewport cell, include the same macro cell class that full Macro View would use:

```js
const macroClass = macroMasks.cellClasses[worldY][worldX] || "";
const nextClassName = `cell ${terrainClass(cell.terrain)} ${fertilityClass(cell.fertility)}${macroClass ? ` ${macroClass}` : ""} ...`;
```

3. Keep `gridEl` in macro styling while exploring:

```js
gridEl.classList.toggle("macro-view", true);
gridEl.classList.toggle("explore-view", true);
```

4. Hide ordinary H/B/S unit letters in Explore View the same way Macro View hides them, unless you deliberately need units for debugging.

Expected result:

```text
Explore View shows Human/Beast/Spirit macro shapes, POI influence/cores, scars, settlement areas, etc.
It should not look like raw terrain cell view.
```

## Problem 2: Movement Is Grid-Step Instead Of Smooth Free Movement

Current evidence:

```js
player.x = nextX;
player.y = nextY;
```

Required behavior:

```text
The player should move smoothly through the world, not jump one cell per key press.
```

Use continuous player coordinates:

```js
player = {
  x, y,              // continuous coordinates
  vx, vy,            // current input velocity or intended movement
  facing,
  isSleeping,
  lastInteraction
}
```

Suggested constants:

```js
const EXPLORE_PLAYER_SPEED_CELLS_PER_SECOND = 5.0;
const EXPLORE_PLAYER_RADIUS = 0.32;
```

Input handling:

```text
keydown records pressed direction keys in a Set.
keyup removes them.
animation/update step reads the Set and moves player each frame/tick.
```

If no animation loop exists, use a lightweight `requestAnimationFrame` loop while in Explore View. Do not add external libraries.

Collision:

```text
sample the target position against grid blockers
round/floor target x/y to terrain cell for center collision
also sample radius corners if simple enough
block movement into BLOCK, BORDER, hard POI blockers, out of bounds
H/B/S units do not block
```

Minimum acceptable smoothness:

```text
holding W/A/S/D moves continuously over multiple frames
player marker moves as an overlay or transform, not by rebuilding its cell once per key press
camera/viewport follows smoothly enough that it does not feel like step jumping
```

Rendering guidance:

```text
Do not replace the cell text with player.facing inside a grid cell.
Render the player as an absolutely positioned overlay inside the Explore viewport.
```

The viewport can still be cell-based, but player position inside it should be continuous.

## Problem 3: Space Interaction Is Unreliable

Current issue:

```text
Interaction only searches decluttered semantic tags from createSemanticTags plus POI centers.
Many Human civilization records are not visible semantic tags every frame.
Interaction uses macroDisplayWorld || world while player position uses world, which can drift.
Range 1.5 is too strict for smooth movement and tag positions.
```

Required behavior:

```text
Space should reliably inspect nearby POIs and Human civilization traces in Explore View.
```

Interaction sources must include:

```text
1. actual visible semantic tags inside current Explore viewport
2. worldPOIs / POI centers
3. humanPolitySummary or in-memory humanPolityMemory villages
4. current Human polity seats
5. old Human seats
6. Human outposts
7. H remnants if present
8. S scar and B range semantic tags when visible
```

Do not rely only on decluttered `createSemanticTags()`.

Recommended approach:

```js
function collectExploreInteractionTargets(source, viewport) {
  const targets = [];
  targets.push(...visibleSemanticTagsInViewport);
  targets.push(...poiCenterTargets(worldPOIs));
  targets.push(...humanPolityVillageTargets(humanPolityMemory));
  targets.push(...humanPolitySeatTargets(humanPolityMemory));
  targets.push(...humanOldSeatTargets(humanPolityMemory));
  targets.push(...humanOutpostTargets(humanLineageMemory));
  return dedupTargets(targets);
}
```

Range:

```js
const EXPLORE_INTERACT_RANGE = 2.25;
```

Priority:

```text
POI center / major POI
H seat
H old seat
H village
H outpost
H remnant
S scar
B range
H domain
```

If a target comes from raw memory rather than semantic tag, build a compact tag-like object so existing `showSemanticTagInfo()` can display it.

Expected result:

```text
Standing near a visible POI or H village/seat/outpost and pressing Space opens useful info.
If no nearby target exists, status says No nearby trace.
```

## Problem 4: Sleep Does Not Advance World Time

Current issue:

```text
toggleExploreSleep() changes isSleeping and renders global Macro View.
It does not start or run simulation steps.
World evolves only if Play was already running.
```

Required behavior:

```text
Pressing E in Explore View enters sleep mode and automatically advances world time.
Pressing E again wakes and stops sleep auto-advance.
```

Implementation guidance:

Add sleep-specific run state:

```js
let sleepWasPlayingBefore = false;
let sleepTimerId = null;
```

On sleep enter:

```text
player.isSleeping = true
sleepWasPlayingBefore = playing
if normal timer is not running, start a sleep timer
sleep timer calls runStepSafely or stepWorld at a readable sleep speed
render global Macro View
status: Sleeping - world is changing, press E to wake
```

Suggested sleep speed:

```js
const EXPLORE_SLEEP_TICK_MS = 140;
```

On wake:

```text
player.isSleeping = false
stop sleep timer if it was created by sleep
if sleepWasPlayingBefore was true, resume/keep normal Play behavior
return to local Explore View
```

Do not let both normal play timer and sleep timer double-step the world.

If Play was already running before sleep:

```text
do not start a second timer
sleep just changes rendering to global Macro View
wake returns to Explore View while Play continues
```

If Play was stopped before sleep:

```text
sleep starts auto-advance
wake stops auto-advance
```

## UI / Visual Requirements

Explore View:

```text
local viewport only
macro visual semantics
player marker overlay above macro cells
smooth movement
tags clipped/positioned to local viewport
```

Sleep View:

```text
global Macro View
visible status that world is changing
E wakes
```

Do not add a tutorial page.

## Tests

Add:

```text
tests/v0_12_1_explore_view_correction.test.js
```

Required deterministic tests:

1. Explore rendering uses Macro View classes.

Expected:

```text
render/model for local viewport includes macro mask classes.
grid has both macro-view and explore-view classes while awake in Explore View.
```

If DOM rendering is hard to test, expose:

```js
getExploreViewportRenderModelForTest(player, source)
```

and assert at least one known macro class is included when fixture has Human population/field pattern.

2. Player supports continuous coordinates.

Expected:

```text
after applying a small movement delta, player.x/y can be non-integer
facing updates
movement into passable terrain succeeds
```

3. Continuous movement respects blockers.

Expected:

```text
attempted movement into BLOCK/BORDER/POI hard blocker does not cross into blocked cell
```

4. Interaction finds raw POI center even without visible semantic tag.

Expected:

```text
nearby POI target returned
```

5. Interaction finds Human village/seat/outpost from memory even if not in decluttered tag list.

Expected:

```text
nearby H village target returned
showable tag-like fields include label, x, y, polityId, lineageId, state
```

6. Sleep auto-advances when Play was stopped.

Expected:

```text
enter sleep starts sleep stepping
at least one step can run through sleep helper
wake stops sleep stepping
```

Expose pure/test helpers if needed:

```js
enterExploreSleepForTest()
runExploreSleepStepForTest()
wakeExploreSleepForTest()
```

7. Sleep does not double-start when Play is already running.

Expected:

```text
if playing true, sleep does not create separate sleep timer
```

8. Existing regressions still pass.

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_11_15_human_village_stability_pass.test.js
node tests/v0_12_local_explore_view.test.js
node tests/v0_12_1_explore_view_correction.test.js
```

Update older V0.12 tests if they assert one-grid-step movement. The new correct behavior is continuous movement.

## Manual QA

Run the app and verify:

```text
1. Select Explore View.
2. Local viewport looks like Macro View, not raw Cell View.
3. H/B/S unit letters are not the dominant display in Explore View.
4. Player moves smoothly while holding WASD.
5. Player cannot pass through BLOCK, BORDER, spring center, rot source core.
6. Space near Monument / Spring / Rot Source / Great Forest opens info.
7. Space near H village / H seat / H old seat / H outpost opens info.
8. E enters sleep from stopped simulation and the world visibly evolves.
9. E wakes and returns to local viewport.
10. If Play was already running, sleep does not make the world update twice as fast.
11. Macro View and Substrate + Macro View still work normally.
```

## Files To Touch

Expected:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
sim.js
style.css
tests/v0_12_local_explore_view.test.js
tests/v0_12_1_explore_view_correction.test.js
```

If needed, update `index.html` only for minimal status text.

## Do Not Add

Do not add:

```text
multi-screen Zelda map
fog of war
explored-cell memory
minimap
combat
items
inventory
quests
NPCs
dialogue trees
buildings
resources
season system
dynamic POIs
player effects on simulation rules
new terrain
new species
save/load
network calls
external libraries
```

This pass should make V0.12 match the intended local exploration experience without starting the next feature stage.

