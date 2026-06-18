# CODEX V0.12 Local Explore View Prompt

## Summary

Implement V0.12 as the first player-facing local exploration view.

This is not the Zelda-style multi-screen map. Keep the existing single 40x25 world. Add a new display mode where the player sees only a local viewport around a controllable observer character, can move with WASD, inspect nearby memory/POI tags with Space, and sleep/wake with E.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.12_LOCAL_EXPLORE_VIEW
```

## Design Goal

The current project has a readable macro/world simulation from a god view. V0.12 should test whether the world remains interesting when viewed locally from inside the world.

Core loop:

```text
Explore local viewport
Find POI / village / old seat / scar / range traces
Press Space to inspect nearby trace
Press E to sleep and watch the global world evolve
Press E again to wake and continue exploring locally
```

## Hard Scope

Do implement:

```text
Explore View display mode
local viewport rendering
player observer state
WASD movement
smooth player / camera movement
BLOCK / BORDER / hard POI blocker collision
Space interaction with nearby important semantic tags / POIs
E sleep / wake toggle
sleep mode global view
minimal status / help text
compact export/snapshot player state if useful
```

Do not implement:

```text
Zelda-style multi-screen map
screen-to-screen propagation
fog of war
explored-cell memory
remembered tint
minimap
combat
items
inventory
quests
NPCs
dialogue trees
buildings
resources
save/load
new terrain
new species
season system
dynamic POI creation
player effects on H/B/S rules
external libraries
```

Important: Explore View should not render the full map with darkened hidden areas. It should render only the local viewport.

## Current Rules To Preserve

Read and respect:

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
human lineage / polity / village rules
grid size
terrain schema
unit schema
```

V0.12 is a view/input layer plus observer interaction only.

## Player Observer

Add a player observer state independent of world cells:

```js
player = {
  x,
  y,
  targetX,
  targetY,
  facing,
  isMoving,
  isSleeping,
  lastInteraction: null
}
```

The player:

```text
is not H / B / S
does not occupy unit layer
does not rewrite terrain
does not affect conflict or reproduction
does not appear in recordings as a unit
```

Initial placement:

```text
choose a non-blocked empty/passable cell near the center if possible
fallback to first passable cell scanning from top-left
```

Passable means:

```text
not BLOCK
not BORDER
not hard POI blocker
inside bounds
```

Reuse existing POI/blocker helpers where possible.

## Explore View Mode

Add a new display/view option:

```text
Explore
```

Existing modes remain:

```text
Substrate / Macro / Macro + Substrate / debug modes if present
```

Explore View behavior:

```text
Render only a fixed local viewport around the player.
Viewport outside cells are not rendered.
Do not show hidden world cells as dark fog.
Do not preserve explored cells.
```

Suggested viewport:

```js
EXPLORE_VIEWPORT_COLS = 15
EXPLORE_VIEWPORT_ROWS = 11
```

If the full app layout cannot fit 15x11 cleanly, use:

```js
13 x 9
```

The viewport samples cells from the existing world around player position. At map edges, clamp the camera so the viewport remains filled where possible.

## Smooth Camera / Movement

Movement input:

```text
W / ArrowUp    move north
A / ArrowLeft  move west
S / ArrowDown  move south
D / ArrowRight move east
```

Use grid-based collision but smooth visual interpolation.

Acceptable implementation:

```text
player logical position moves one cell at a time
player visual transform interpolates toward target cell
camera visual offset interpolates toward player
```

Do not require sub-cell physics.

If a movement key is held:

```text
continue stepping when previous movement completes
```

Movement should be disabled while sleeping.

## Collision

Player cannot move into:

```text
terrain BLOCK
terrain BORDER
POI hard blockers
out of bounds
```

For V0.12, the player may move through H/B/S units. Units are simulation entities, not physical collision objects for the observer.

This keeps the feature simple and avoids changing ecology rules.

## Rendering In Explore View

Each visible viewport cell should render the same current world information as the existing grid:

```text
terrain color
unit letter/glyph if unit exists
POI center/ring styling if visible
macro population material if the current mode needs it
important semantic tags if inside viewport
```

Keep it readable. If the full macro styling is too dense in the small viewport, prefer substrate terrain + POI + visible tags.

Do not invent a separate memory display layer.

The player marker should be clear and visually above cells:

```text
simple centered marker
direction/facing hint if easy
high contrast outline
```

Use CSS/HTML only. No external assets required.

## Interaction With Space

Pressing Space in Explore View inspects the nearest important trace within range.

Range:

```js
EXPLORE_INTERACT_RANGE = 1.5
```

Candidate sources:

```text
visible semantic tags in viewport
POI centers / major POI tags
H seat
H old seat
H village
H outpost
H remnant
H domain only if no higher-priority Human tag nearby
S scar
B range
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

Interaction opens/reuses the existing clickable tag info panel if possible.

If the existing tag panel cannot be reused cleanly, add a small Explore interaction panel with compact rows:

```text
title
type
position
polityId if present
lineageId if present
state if present
support / pressure if present
interpretation
```

No lore writing yet. Translate existing data into direct readable statements.

Example:

```text
H village
polity: human_polity_001
lineage: human_lineage_009
state: active
first seen: 935
This is a current Human settlement marker.
```

If no target is nearby:

```text
show "No nearby trace" briefly in status
```

## Sleep / Wake With E

Press E in Explore View:

```text
player.isSleeping = true
switch display to global sleep view
disable movement
world continues updating
```

Sleep view:

```text
show global map
use existing macro or macro+substrate display
show a small "Sleeping - press E to wake" status
keep controls/panels usable enough for debugging
```

Press E again:

```text
player.isSleeping = false
return to Explore View
keep player at same logical position
local viewport renders current world state around player
```

The purpose:

```text
player sees world evolve globally while sleeping
then wakes and explores changed local world
```

Do not add dream mechanics, time travel, or memory replay.

## UI / Controls

Add compact control text near the view controls or status panel:

```text
Explore: WASD move, Space inspect, E sleep/wake
```

Do not make a large tutorial page.

Panel usability:

```text
Explore mode should not force the user to scroll far before seeing the play viewport.
If needed, keep the Explore viewport at the top/left of the main content area.
```

## Data / Exports

Recordings and macro timeline do not need to include player path by default.

If adding compact player state is simple, snapshot/recording may include:

```js
playerObserver: {
  x,
  y,
  isSleeping
}
```

Do not add per-frame player path arrays.

Macro timeline frame top-level keys must remain stable.

## Tests

Add:

```text
tests/v0_12_local_explore_view.test.js
```

Required deterministic tests:

1. Player initializes on passable cell.

Expected:

```text
not BLOCK
not BORDER
not hard POI blocker
inside bounds
```

2. Player movement respects blockers.

Fixture:

```text
player next to BLOCK/BORDER/POI hard blocker
attempt move into blocked cell
```

Expected:

```text
player logical position unchanged
facing may update
```

3. Player can move into passable terrain.

Expected:

```text
target/logical position changes by one cell
```

4. Explore viewport returns only local cells.

Expected:

```text
render/model cell count equals EXPLORE_VIEWPORT_COLS * EXPLORE_VIEWPORT_ROWS
does not include all world cells
clamps at edges
```

If render is hard to test directly, expose a pure helper:

```js
getExploreViewportCellsForTest(player, world)
```

5. Space interaction selects nearest important trace.

Fixture:

```text
nearby POI / H village semantic tag
```

Expected:

```text
interaction target matches priority and range
no target outside range
```

6. E toggles sleeping.

Expected:

```text
false -> true -> false
movement disabled while sleeping
wake returns to Explore mode
```

7. Existing invariants still pass.

Expected:

```text
collapsed current tags = 0
duplicate authoritative source owners = 0
recording/json export still valid
```

Run regressions:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_11_14_collapsed_polity_seat_rebind_repair.test.js
node tests/v0_11_15_human_village_stability_pass.test.js
node tests/v0_12_local_explore_view.test.js
```

## Manual QA

After implementation, run the app and verify:

```text
1. Select Explore View.
2. Only local viewport is visible, not full map with fog.
3. WASD moves player smoothly.
4. Camera follows smoothly.
5. BLOCK/BORDER/spring center/rot source core block movement.
6. H/B/S units do not block the player.
7. Space near POI or Human village opens useful info.
8. Space away from traces shows no nearby trace.
9. E enters sleep and shows global view.
10. World continues changing while sleeping.
11. E wakes back into local viewport at same player position.
12. Existing Macro/Substrate views still work.
```

Expected visual/experience difference:

```text
The project now has a player-facing local exploration mode.
The user can stop reading the world only through the global macro view and begin discovering traces from inside the world.
Sleep creates a clean alternation between local exploration and global world evolution.
```

## Files To Touch

Expected:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
sim.js
index.html
styles.css
tests/v0_12_local_explore_view.test.js
```

If the project keeps all HTML/CSS/JS in fewer files, follow the existing structure.

## Do Not Add

Do not add:

```text
multi-screen Zelda map
new map generator
new terrain
new units/species
combat
inventory
quests
NPCs
buildings
resource economy
season system
dynamic POIs
save/load
network calls
external libraries
```

This is the smallest player-view prototype that can validate local exploration.

