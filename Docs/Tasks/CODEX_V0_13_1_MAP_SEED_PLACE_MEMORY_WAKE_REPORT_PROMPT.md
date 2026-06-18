# CODEX V0.13.1 Map Seed / Place Memory / Wake Report Prompt

## Summary

Implement V0.13.1 as the first player-facing place-memory pass.

The goal is to make the world easier to remember from Explore View by adding an editable fixed world seed, player-facing place information, and a wake report that explains how previously inspected places changed during sleep.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.13.1_MAP_SEED_PLACE_MEMORY_WAKE_REPORT
```

This pass should not add Insight, quests, NPCs, combat, seasons, dynamic POIs, or LLM integration. It should create the deterministic data structure that later LLM text generation can read.

## Player Experience Goal

Current Explore View proves the player can move locally, inspect things, and sleep. The problem is that the map still has low memory value:

```text
the world is hard to form a mental map of
sleep changes feel discontinuous from the player side
POI/tag info is too debug-like and not useful enough to players
content density is too low for exploration
```

V0.13.1 should address this by making places stable, inspectable, and comparable across sleep.

Core loop:

```text
Start from an editable fixed map seed
Explore local places
Inspect POIs / villages / seats / rivers / scars
Sleep for a short world update
Wake and read what changed at places inspected before sleep
Revisit places with a clearer mental map
```

## Hard Scope

Implement:

```text
editable map seed data structure
basic map seed editor controls
import/export seed JSON
apply seed to world initialization
mountains as BLOCK cells
river/water feature cells
static POI placement from seed
H/B/S initial seed placement
player-facing place memory anchors
numeric snapshots and deltas for inspected places
natural-language deterministic text templates
wake report modal/list for places inspected before sleep
```

Do not implement:

```text
Insight or any sleep resource
LLM calls
dynamic POI creation
quests
NPCs
dialogue trees
combat
items
inventory
buildings
resource economy
season system
multi-screen Zelda map
screen-to-screen propagation
save/load beyond seed import/export JSON
new terrain type
new species
external libraries
```

## Preserve Existing Simulation Rules

Read:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
```

Do not change:

```text
H/B/S core movement rules except river/blocker passability where specified
conflict
conversion
terrain rewrite
reproduction
fertility baseline except water feature effects where specified
terrain decay
macro memory
Human lineage / polity / village identity rules
grid size
terrain schema
unit schema
```

Use existing patterns in `sim.js`, `index.html`, and `style.css`.

## Part 1: Editable Map Seed

Add a compact map seed contract.

Suggested shape:

```js
mapSeed = {
  version: "0.13.1",
  name: "Custom Seed",
  width: 40,
  height: 25,
  units: [
    { type: "H", x: 10, y: 12 },
    { type: "B", x: 28, y: 8 },
    { type: "S", x: 32, y: 18 }
  ],
  mountains: [
    { x: 5, y: 4 },
    { x: 6, y: 4 }
  ],
  rivers: [
    {
      id: "river_001",
      name: "North River",
      cells: [{ x: 3, y: 7 }, { x: 4, y: 7 }],
      effectRadius: 1,
      blocksMovement: true,
      blocksSensing: true
    }
  ],
  pois: [
    { id: "spring_001", type: "spring", name: "North Spring", x: 8, y: 6, radius: 4, strength: "strong" },
    { id: "rot_001", type: "rot_source", name: "Rot Hollow", x: 30, y: 17, radius: 4, strength: "strong" },
    { id: "forest_001", type: "great_forest", name: "Green Rest", x: 28, y: 5, radius: 4, strength: "strong" },
    { id: "monument_001", type: "monument", name: "First Monument", x: 15, y: 15, radius: 4, strength: "strong" }
  ]
}
```

Constraints:

```text
Do not add terrain type WATER.
Mountains are terrain BLOCK.
POIs remain in worldPOIs.
Rivers are map features, not POIs and not terrain.
Initial H/B/S seeds set units at initialization only.
```

## Part 2: Map Seed Editor

Add a simple editor mode/panel suitable for the current prototype.

Controls:

```text
Map Seed Editor toggle or mode
Brush select:
  Human
  Beast
  Spirit
  Mountain
  River
  Spring
  Rot Source
  Great Forest
  Monument
  Erase
Click cell to place
Drag to paint Mountain / River / H/B/S if simple
Export Seed JSON
Import Seed JSON
Apply Seed
Reset From Seed
```

Keep UI compact. Do not build a full level editor.

Behavior:

```text
Mountain brush sets terrain BLOCK in seed.
River brush adds/removes cells to a selected/default river feature.
POI brushes place exactly one POI per clicked cell with deterministic id/name if not provided.
Erase removes seed object at clicked cell in this order:
  unit seed
  river cell
  mountain cell
  POI center
```

It is acceptable for first version to edit a JSON textarea plus click painting. Prioritize reliability over polish.

## Part 3: River / Water Feature Semantics

Rivers should reuse spring-like water semantics without pretending each river cell is a spring.

River cells:

```text
block player movement
block H/B/S movement
block relevant path/sensing pass-through where the project already checks blockers
do not occupy terrain
do not occupy unit
render as visible water in Macro/Explore views
```

River effect:

```text
nearby non-BLOCK, non-MARK cells receive a weak fertility recovery effect
effectRadius default 1
fertility recovery should be weaker than spring
does not directly convert terrain
```

Suggested first values:

```js
RIVER_FERTILITY_RESTORE_CHANCE = 0.10;
RIVER_FERTILITY_MAX = 3;
```

Use existing spring/POI fertility helper logic where possible, but keep river data separate from `worldPOIs`.

Exports:

```text
Snapshot / Recording may include compact mapFeatures or rivers.
Macro Timeline frame top-level keys should stay stable.
If timeline includes river info, keep it compact under macroSummary or top-level mapSeed/mapFeatures only if already stable.
```

## Part 4: Place Memory Anchor Data Contract

Create a unified player-facing place memory layer. It must cover both static places and emergent civilization traces.

Anchor types:

```text
poi
river
village
seat
old_seat
outpost
remnant
scar
beast_range
domain
```

Suggested shape:

```js
placeMemoryAnchor = {
  id,
  type,
  displayName,
  position: { x, y },
  sourceRef: {
    kind,
    id
  },
  discoveredAtTick,
  lastInspectedAtTick,
  lastSleepObservedTick,
  currentSnapshot,
  previousSnapshot,
  changeSinceLastInspect,
  changeSinceLastSleep
}
```

Important:

```text
Place Memory Anchor is player-facing observation data.
It should not affect H/B/S ecology.
It is not a quest system.
It is not a new terrain or entity layer.
```

Anchor creation:

```text
When player inspects a POI/river/H village/H seat/H old seat/H outpost/H remnant/S scar/B range/H domain:
  create or update a placeMemoryAnchor.
  store a numeric snapshot.
  update lastInspectedAtTick.
```

Deduplication:

```text
Same sourceRef kind/id should reuse the same anchor.
If no stable source id exists, dedupe by type + rounded position.
```

## Part 5: Numeric Snapshot Structure

Each inspected place must store a numeric snapshot that future LLM text generation can read.

Suggested shape:

```js
placeSnapshot = {
  tick,
  radius,
  terrain: {
    field,
    wild,
    mark,
    empty,
    block,
    river
  },
  units: {
    human,
    beast,
    spirit
  },
  fertility: {
    average,
    lowCells,
    highCells
  },
  poi: {
    id,
    type,
    state,
    influenceArea,
    contestedByHuman,
    contestedByBeast,
    contestedBySpirit
  },
  human: {
    polityId,
    polityState,
    lineageId,
    lineageState,
    villageId,
    villageState,
    seatState,
    outpostState,
    nearbyVillageCount,
    nearbyOutpostCount,
    polityTrend
  },
  ecology: {
    dominantPresence,
    pressure,
    stability
  }
}
```

Implementation may omit fields that are truly unavailable, but it must keep the structure stable and documented.

Do not show raw counts to the player by default.

## Part 6: Place Change Structure

Compare two snapshots and produce a structured change record.

Suggested shape:

```js
placeChange = {
  anchorId,
  fromTick,
  toTick,
  changeType,
  subject,
  severity,
  direction,
  metricsDelta: {
    field,
    wild,
    mark,
    empty,
    river,
    human,
    beast,
    spirit,
    fertilityAverage,
    influenceArea,
    nearbyVillageCount,
    nearbyOutpostCount
  },
  deterministicSummary,
  playerText,
  llmContext
}
```

Allowed values:

```text
changeType:
  expanded
  shrank
  corrupted
  recovered
  abandoned
  settled
  contested
  stabilized
  unchanged
  mixed

subject:
  human
  beast
  spirit
  rot
  water
  polity
  village
  seat
  forest
  monument
  place

severity:
  low
  medium
  high

direction:
  improved
  worsened
  neutral
  mixed
```

`llmContext` must include enough numeric data for future LLM rewriting:

```js
llmContext = {
  anchorName,
  anchorType,
  sourceRef,
  fromSnapshot,
  toSnapshot,
  metricsDelta,
  inferredChangeTypes,
  importantEntities: {
    poiId,
    riverId,
    polityId,
    lineageId,
    villageId,
    outpostId
  },
  deterministicSummary,
  toneHint: "clear, concise, exploratory"
}
```

Do not call an LLM in V0.13.1.

## Part 7: Player-Facing Text Templates

The player should see natural language, not raw metrics.

Bad player text:

```text
FIELD +8, MARK -3, human +2.
```

Good player text:

```text
The fields near North Spring have become more continuous.
The rot around Rot Hollow has pushed farther outward.
The old seat has fewer nearby Human traces than before.
Beast activity is more noticeable near the forest edge.
```

Create deterministic template rules based on `placeChange`.

Examples:

```text
if mark delta is high positive:
  "Corruption has spread around {anchorName}."

if field delta is positive and mark delta is non-positive:
  "The fields around {anchorName} look more stable than before."

if villageState active -> fading/missing:
  "A Human settlement near {anchorName} has weakened or disappeared."

if nearbyVillageCount positive:
  "Human settlement activity has increased near {anchorName}."

if beast delta positive near great_forest:
  "Beast activity is stronger around the forest edge."

if no meaningful delta:
  "{anchorName} has not visibly changed since you last observed it."
```

Keep text short and readable.

## Part 8: POI / Place Info Panel

Update Space interaction panel contents for player-facing places.

The panel should prioritize:

```text
place name
current status sentence
change since last inspection
related memory/entity
```

It may include a small debug details toggle/section, but raw ids should not dominate the default view.

Examples:

```text
North Spring
The spring keeps the nearby ground fertile.
Since you last came here, nearby fields have become more continuous.
Watch whether corruption approaches the water.
```

```text
Hill Village
This is a Human settlement tied to an active polity.
Since you last came here, Human activity nearby has weakened.
Its lineage is still present in the area.
```

```text
Old Seat
This place was once a Human center.
Since you last came here, corruption has moved closer.
No new settlement has recovered the old center.
```

Use existing semantic tag info panel if possible. If too tangled, add a small place info panel, but avoid duplicate UI systems where practical.

## Part 9: Wake Report

On sleep entry:

```text
collect anchors inspected since the previous wake/sleep cycle
store their before-sleep snapshots
```

On wake:

```text
resample those anchors
compute placeChange for each
show a modal/list titled "While You Slept"
```

Player-facing report:

```text
While You Slept

- North Spring: The fields around the spring became more continuous.
- Rot Hollow: Corruption spread outward from the source.
- Hill Village: Human activity nearby weakened.
```

No raw counts in the visible list.

Underlying data:

```js
wakeReport = {
  id,
  fromTick,
  toTick,
  inspectedAnchorIds,
  changes,
  playerTextLines
}
```

Important:

```text
Only report places the player interacted with during the previous awake cycle.
If no places were inspected, show a short message:
  "You did not focus on any place before sleeping."
Do not report the whole world.
```

## Part 10: Sleep Duration

Do not add Insight yet.

But sleep should be short enough for continuity testing.

Required behavior:

```text
Sleep advances a fixed number of ticks and then wakes automatically.
E may still wake early if currently sleeping.
```

Suggested first value:

```js
EXPLORE_SLEEP_TICKS_PER_REST = 30;
```

If current V0.12.1 sleep is timer-based, stop after this many sleep ticks and show wake report.

Player should be able to test several sleep cycles quickly without the world changing beyond recognition.

## Tests

Add:

```text
tests/v0_13_1_map_seed_place_memory_wake_report.test.js
```

Required deterministic tests:

1. Map seed import/export round trip.

Expected:

```text
units, mountains, rivers, POIs persist through export/import
ids and names remain stable
```

2. Applying map seed creates expected world features.

Expected:

```text
mountain cells become BLOCK
unit seeds place H/B/S
POIs populate worldPOIs
river cells populate map feature state
```

3. River blocks movement and restores fertility nearby.

Expected:

```text
player cannot move into river cell
H/B/S movement helper treats river as blocker where movement blockers are checked
nearby eligible cell can receive river fertility effect
river cell itself does not become terrain WATER
```

4. Inspecting POI creates place memory anchor.

Expected:

```text
anchor has id, type poi, displayName, sourceRef, currentSnapshot
snapshot contains numeric terrain/unit/fertility fields
player panel text does not expose raw counts by default
```

5. Inspecting Human village/seat/outpost creates place memory anchor.

Expected:

```text
anchor sourceRef points to village/seat/outpost source
snapshot includes human polity/lineage/village fields where available
```

6. Place change computes numeric deltas and natural language text.

Fixture:

```text
before snapshot has lower mark / higher field
after snapshot has higher mark / lower field
```

Expected:

```text
placeChange.metricsDelta has numeric values
placeChange.changeType includes corrupted or mixed
placeChange.playerText uses natural language and does not contain raw "+N" style counts
placeChange.llmContext contains before/after snapshots
```

7. Wake report includes only inspected places.

Expected:

```text
inspected anchors appear
uninspected anchors do not appear
visible report lines use natural language
wakeReport.changes keep numeric llmContext
```

8. Sleep auto-wakes after fixed duration.

Expected:

```text
sleep advances EXPLORE_SLEEP_TICKS_PER_REST ticks
player.isSleeping becomes false
wake report is created
```

9. Existing regressions still pass.

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_12_local_explore_view.test.js
node tests/v0_12_1_explore_view_correction.test.js
node tests/v0_13_1_map_seed_place_memory_wake_report.test.js
```

## Manual QA

Run the app and verify:

```text
1. Open Map Seed Editor.
2. Place mountains, river cells, one spring, one rot source, one great forest, one monument, and H/B/S seeds.
3. Export seed JSON.
4. Import the same JSON and apply it.
5. The world matches the designed seed.
6. Explore View shows fixed landmarks and river/mountain geography.
7. Player cannot cross mountain or river cells.
8. Player can inspect POIs and Human traces.
9. Info panel uses player-facing text, not raw debug-first data.
10. Sleep advances only a short fixed duration.
11. Wake report lists changes only for places inspected before sleep.
12. Wake report text is natural language, while exported/internal data keeps numeric snapshots/deltas.
```

## Expected Player-Facing Difference

After V0.13.1:

```text
The map can be deliberately designed and replayed.
Static geography and POIs give the player a mental map.
Rivers and mountains create spatial memory.
POI/Human trace info explains why a place matters.
Sleep no longer feels like random discontinuity because wake reports summarize changes at places the player cared about.
```

## Files To Touch

Expected:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
index.html
style.css
sim.js
tests/v0_13_1_map_seed_place_memory_wake_report.test.js
```

If implementation needs small helpers, keep them in existing plain JavaScript style. Do not add dependencies.

## Documentation Requirements

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.13.1 map seed contract
river/water feature semantics
place memory anchor contract
snapshot/change/wake report contract
known simplifications
version string
```

Update `README.md` with a concise player-facing summary:

```text
Map seeds can be edited/imported/exported.
Rivers and mountains make fixed geography.
Inspecting places records snapshots.
Waking shows natural-language changes at inspected places.
LLM integration is not implemented; numeric context is stored for future use.
```

## Known Simplifications To Preserve

Document these:

```text
Map Seed Editor is a prototype editor, not a full level editor.
Rivers are map features, not terrain.
Place memory anchors are player observation records, not gameplay entities.
Natural-language text is deterministic template output.
LLM rewriting is future work only.
Insight/sleep cost is not implemented yet.
Wake report only covers places inspected during the previous awake cycle.
```

