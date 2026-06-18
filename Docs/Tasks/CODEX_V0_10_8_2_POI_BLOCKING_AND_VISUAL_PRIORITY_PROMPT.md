# CODEX V0.10.8.2 POI Blocking And Visual Priority Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.8.2 as a focused POI semantics/readability correction after V0.10.8.1.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_8_INITIAL_POI_WORLD_ANCHORS_PROMPT.md
Docs/Tasks/CODEX_V0_10_8_1_POI_ECOLOGY_ANCHOR_REBALANCE_PROMPT.md
tests/v0_10_8_initial_poi_world_anchors.test.js
tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing behavior.

---

## User Feedback

The latest V0.10.8.1 result is directionally better, but several semantics are still unclear:

```text
1. BLOCK walls appear to receive POI / ecology color overlays.
2. Great Forest visuals are inconsistent: some cells feel circular, some square.
3. Spring center should be an unreachable water/source cell, like a wall for movement and sensing.
4. Spring's surrounding cells should keep the current fertility effect.
5. Rot Source is still not visually obvious enough.
6. POI layers need a clearer priority model instead of acting like another color filter.
```

This task should not rebalance the whole ecology. It should align POI display and blocking semantics.

---

## Hard Scope

Do not add:

```text
new terrain types
new species
Zelda-style multi-screen map
screen-to-screen propagation
map editor
brush painting
save/load
NPCs
quests
dialogue
resource economy
village buildings
network calls
external libraries
canvas/WebGL rewrite
runtime-created POIs
POI construction / cleansing / unlocking
```

Do not change:

```text
grid size
terrain enum
unit enum
view mode options
existing control ids
macro timeline frame top-level keys
recording frame required keys
core counter-cycle rules
the four POI set from V0.10.8.1
```

Allowed:

```text
add POI blocking helper functions
make spring center block movement / placement / reachable sensing
adjust POI display class application
adjust CSS visual priority for BLOCK / spring / great forest / rot source
add compact POI metadata if useful
tests / README / rules updates
```

---

## Design Target

V0.10.8.2 should establish this semantic hierarchy:

```text
1. BLOCK is always hard geography and always visually dominant.
2. Spring center is a POI hard blocker, but not a terrain type.
3. POI centers are world anchors, not ordinary influence cells.
4. POI influence rings may tint ecology, but must not erase hard geography or source identity.
5. Population evolution colors remain readable outside POI centers/cores.
```

Do not solve this by adding a new terrain enum. The current terrain model should remain unchanged.

---

## BLOCK Visual Priority

Observed issue:

```text
markPOICells() currently applies poi-influence / poi-* classes across POI radius cells without skipping BLOCK.
CSS then allows outlines / box-shadows / filters to visually tint walls.
```

Required behavior:

```text
BLOCK cells must not receive POI influence classes.
BLOCK cells must not receive POI center classes.
BLOCK cells must not receive rot contest / great forest core classes.
BLOCK visual style must remain dominant in Macro View and Substrate + Macro View.
```

Implementation guidance:

```js
if (source[y][x].terrain === TERRAIN.BLOCK) continue;
```

Apply this in POI display mask construction.

Also add a CSS safety reset:

```css
.grid.macro-view .terrain-block,
.grid.substrate-view .terrain-block {
  /* hard blocker visual wins */
}

.grid.macro-view .terrain-block.poi-influence,
.grid.macro-view .terrain-block.poi-center,
.grid.substrate-view .terrain-block.poi-influence,
.grid.substrate-view .terrain-block.poi-center {
  /* reset POI outlines/shadows/backgrounds if class leakage happens */
}
```

Keep the exact CSS simple and consistent with the existing style.

---

## Spring Center Blocking

Spring meaning after V0.10.8.2:

```text
Spring center is water/source: hard to enter and cannot be occupied.
Spring radius remains a fertility recovery halo.
```

Do not convert spring center to BLOCK terrain.

Add helper semantics:

```js
function isPOIHardBlocker(x, y, pois = worldPOIs) {
  return active spring center at x/y;
}

function isCellBlockedForMovement(source, x, y, pois = worldPOIs) {
  return terrain is BLOCK/BORDER or isPOIHardBlocker(x, y, pois);
}
```

Use the existing local patterns if names differ, but make the semantic split explicit:

```text
terrain BLOCK remains terrain.
spring center is POI hard blocker.
```

Required integration points:

```text
movement target validation
runtime click/intervention placement
reachable radius flood-fill / strategic sensing
settler target search if it uses passability
Beast / Spirit / Human movement helpers that currently only reject BLOCK/BORDER
```

Expected behavior:

```text
H / B / S cannot move into spring center.
H / B / S cannot be placed on spring center by click intervention.
reachable sensing cannot pass through spring center.
spring surrounding cells continue fertility effects.
spring center can still visually show as spring.
```

If existing code has many terrain checks, prefer a small helper and replace only the relevant passability gates. Do not broad-refactor the whole simulation.

---

## Spring Display

Spring center should visually read as a small water/source obstacle.

Required:

```text
poi-center poi-spring must use a consistent water-source marker.
spring center should not look like ordinary WILD/FIELD/EMPTY.
spring influence ring stays soft and low-priority.
```

Suggested visual:

```text
center: clear blue/cyan hard source icon or filled center
ring: faint blue/cyan fertility halo
```

Do not make every spring influence cell look like a water tile.

---

## Great Forest Visual Unification

Observed issue:

```text
Great Forest currently mixes circular radial halo cells and square center/core outlines.
This makes the icon language feel inconsistent.
```

Required behavior:

```text
Great Forest should read as one coherent forest habitat, not mixed round/square icons.
```

Update the visual language:

```text
center: one stable deep-green forest core marker.
core radius: consistent dense canopy / habitat texture.
outer radius: subtle wild influence, not circular icon cells.
```

Avoid using a radial marker on every influence cell if it makes each cell look like its own icon.

Great Forest should remain visually distinct from:

```text
ordinary WILD population shape
spring fertility halo
BLOCK walls
```

---

## Rot Source Visual Priority

Observed issue:

```text
Rot Source still works numerically, but visually reads more like low fertility or contested color than a source.
Human / Beast / Spirit colors can distract from the corruption source identity.
```

Required display hierarchy:

```text
rot center:
- always visually wins over population colors, terrain material, macro-cell overlays, and contest hints.
- should look like a dark corruption source marker.

rot inner ring radius 1:
- visibly reads as persistent corruption.
- can show contest hints, but corruption must remain primary.

rot outer ring radius 2-4:
- may show Human/Beast/Spirit interaction tint.
- should not overpower the core.
```

Implementation guidance:

```text
Ensure poi-rot-core / poi-rot-inner CSS rules are later or more specific than population and generic POI influence rules.
Avoid filters that make all rot cells uniformly saturated and hide the core.
Use dedicated center/inner-ring styling rather than relying on terrain MARK alone.
```

Important:

```text
Do not make the entire radius 4 solid purple.
The outer ring should remain ecologically contested.
Only the center and inner ring must be unmistakable.
```

---

## Data / Export

Keep exports compact.

Existing:

```text
pointsOfInterest top-level export includes four POIs.
macroSummary.poiSummary includes compact counts.
```

Allowed additive metadata:

```js
spring POI may include blocksMovement: true
```

Do not add full blocker rows or POI influence rows to every frame.

Macro Timeline frame top-level keys must remain:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

---

## Tests

Use TDD. Add:

```text
tests/v0_10_8_2_poi_blocking_visual_priority.test.js
```

Update existing V0.10.8 / V0.10.8.1 tests if their expectations assume spring center is occupiable.

Required assertions:

```text
BLOCK cells do not receive poi-influence / poi-center / poi-rot-* / poi-great-forest-core classes.
CSS includes a safety rule that keeps terrain-block visually dominant over POI classes.
Spring center is detected as a POI hard blocker.
Movement cannot enter spring center.
Runtime intervention cannot place H/B/S on spring center.
Reachable radius / strategic sensing cannot pass through spring center.
Spring surrounding cells still receive fertility recovery effect.
Spring center renders a poi-center poi-spring class and does not require a new terrain type.
Great Forest uses a unified visual language; influence cells do not use per-cell radial icon markers.
Rot source center uses poi-rot-core and visually wins over contest/population classes.
Rot inner ring remains visually corruption-primary.
Rot outer ring may still show contested human/beast/spirit classes.
Export still contains four compact POIs.
Macro timeline frame top-level keys remain unchanged.
```

Suggested regression fixture:

```text
Create a custom world with a spring center at (5,5).
Place H/B/S around it.
Assert movement/placement/reachable helpers treat (5,5) like a blocker.
Assert cells at (5,4), (6,5), etc. still get spring fertility effects.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_2_terrain_readability_occlusion.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_8_initial_poi_world_anchors.test.js
node tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
node tests/v0_10_8_2_poi_blocking_visual_priority.test.js
```

If a listed test does not exist locally, run the closest existing tests and report the difference.

---

## Rules / Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.8.2 POI Blocking And Visual Priority
```

Document:

```text
BLOCK cells do not receive POI influence display.
Spring center is a POI hard blocker but not a terrain type.
Spring surrounding cells keep fertility effects.
Great Forest visual language is unified.
Rot Source center / inner ring visually wins over population and contest colors.
The four initial POIs remain unchanged.
No new terrain, species, map mode, runtime POI creation, quest, NPC, dialogue, save/load, or multi-screen map is added.
```

Update version string:

```text
TRI_SPECIES_WORLD_SIM_V0.10.8.2_POI_BLOCKING_VISUAL_PRIORITY
```

Update `README.md` with the same player-facing summary.

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Confirm BLOCK walls stay visually black/grey and are not tinted by POI halos.
4. Confirm spring center is visually a clear source/water blocker.
5. Confirm units never stand on spring center after running 300-600 ticks.
6. Confirm spring surrounding cells still show fertility/ecology benefit.
7. Confirm Great Forest reads as one coherent forest, not mixed round/square icons.
8. Confirm Rot Source center is unmistakable even when Human/Beast colors touch the outer ring.
9. Switch to Substrate + Macro View and confirm the same POI hierarchy holds.
10. Export Recording and Macro Timeline JSON and confirm compact POIs remain.
```

Expected result:

```text
POIs should now feel like world structures with clear semantics:
walls are walls, spring center is blocked water/source, forest is coherent habitat, rot source has an unmistakable core.
```

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether terrain/unit enums stayed unchanged
which V0.10.8.2 rule section was implemented
spring blocking integration points
BLOCK visual-priority fix
Great Forest visual unification
Rot Source visual-priority fix
JSON export changes or confirmation of no shape breakage
known simplifications or deviations
expected visual difference
```

