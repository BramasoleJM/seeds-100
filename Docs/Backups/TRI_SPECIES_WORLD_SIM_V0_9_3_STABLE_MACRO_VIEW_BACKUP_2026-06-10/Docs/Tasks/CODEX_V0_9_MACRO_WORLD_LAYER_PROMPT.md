# CODEX_V0_9_MACRO_WORLD_LAYER_PROMPT.md

Copy this prompt into Codex.

This is V0.9 for the current V0.8.3 single-screen tri-species world simulation.

This is not a bottom-layer ecology rebase.

This is not rule tuning.

The goal is to add a Macro World Layer that can read the existing low-level simulation as places, histories, events, routes, and map icons.

Set rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
```

---

# Read first

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_MEMORY_CN.md
TRI_SPECIES_JSON_EXPORT_SPEC.md
sim.js
index.html
style.css
```

Act as Executor.

If this prompt conflicts with older V0.1-V0.8 task prompts, follow this prompt.

If this prompt conflicts with `TRI_SPECIES_WORLD_SIM_RULES.md`, update the rules file to add V0.9 Macro World Layer notes, then implement those notes.

---

# Hard constraints

Do not change the core V0.8.3 ecology rules unless a small bug blocks the Macro World Layer.

Do not add new visible terrain.

Do not add DEPLETED terrain.

Do not add corpse overlay.

Do not restore 0-100 fertility.

Do not add economy/resources/buildings/NPCs/quests/tarot/story events.

Do not implement Zelda-style multi-screen maps.

Do not add screen-to-screen propagation.

Do not add external libraries.

Keep plain HTML/CSS/JavaScript.

The macro layer must first be an observer and interpreter, not a hard script director.

---

# Why V0.9 exists

V0.8.3 has a working bottom-layer ecology:

```text
Human = expansion, settlement, migration.
Beast = mobile natural recovery / purifier.
Spirit = short-lived outbreak from Human failure or death.
MARK = passive residue / scar.
WILD = natural recovery space.
FIELD = Human-organized settlement space.
```

Recent long recordings show:

```text
The world can run past 1500 ticks.
Humans and Beasts can both survive.
Spirits work as temporary events rather than a permanent species.
Settlers, new settlements, Beast cleansing, and Spirit scars can emerge.
```

But the player/designer still sees mostly low-level grid noise.

V0.9 should answer:

```text
Where is a place?
Where did something happen?
Which areas deserve names?
Which events deserve map icons?
How can bottom-layer change become world meaning?
```

---

# Design goal

Create a historical macro observer:

```text
low-level world + recent events -> macroWorld JSON + optional icon overlay
```

The macro layer should identify and remember:

```text
settlement
abandoned_settlement
beast_recovery_zone
spirit_outbreak
spirit_scar
migration_route
human_beast_frontier
```

The first implementation should prioritize useful exported JSON over visual polish.

The UI overlay may be simple letters/icons. Final art is out of scope.

---

# Conceptual architecture

Add a macro analysis layer with three responsibilities:

```text
1. Detection:
   Scan the current world and recent recording frames.
   Find candidate regions, routes, and events.

2. Memory:
   Match candidates to existing macro objects.
   Preserve ids, age, lastSeenTick, state transitions, and history.

3. Presentation:
   Add macroWorld to snapshot/recording export.
   Optionally display one small icon per macro object on the grid.
```

Recommended files:

```text
macro.js       // macro analysis and memory functions
sim.js         // calls macro layer, includes macroWorld in exports
index.html     // loads macro.js and adds overlay toggle if implemented
style.css      // simple overlay/icon styling if implemented
```

If adding `macro.js` is awkward because current globals are tightly coupled, implement macro functions in `sim.js` for V0.9. Keep them grouped and clearly labeled.

Do not make a large framework or class hierarchy.

---

# Macro data model

Maintain global macro state:

```js
let macroWorld = createEmptyMacroWorld();
let macroHistory = createEmptyMacroHistory();
```

Suggested exported shape:

```js
{
  version: "0.9",
  tick: 250,
  analyzedEvery: 25,
  regions: [
    {
      id: "settlement_001",
      type: "settlement",
      state: "stable",
      center: { x: 12, y: 8 },
      bounds: { minX: 8, minY: 5, maxX: 17, maxY: 12 },
      cells: [{ x: 10, y: 7 }],
      size: 24,
      age: 175,
      firstSeenTick: 75,
      lastSeenTick: 250,
      confidence: 0.86,
      displayIcon: "house",
      metrics: {
        population: 9,
        fieldArea: 31,
        avgFertility: 2.3,
        nearbyMark: 1,
        nearbySpirit: 0,
        recentBirths: 3,
        recentDeaths: 1,
        recentSettlerDepartures: 2
      },
      history: [
        { tick: 75, state: "new_settlement" },
        { tick: 150, state: "growing" },
        { tick: 250, state: "stable" }
      ]
    }
  ],
  routes: [
    {
      id: "migration_route_001",
      type: "migration_route",
      state: "active_route",
      fromRegionId: "settlement_001",
      toRegionId: "settlement_002",
      path: [{ x: 13, y: 9 }, { x: 14, y: 10 }],
      age: 50,
      firstSeenTick: 200,
      lastSeenTick: 250,
      confidence: 0.72,
      displayIcon: "footprints",
      metrics: {
        recentSettlerMoves: 16,
        recentFoundings: 1
      },
      history: []
    }
  ],
  events: [
    {
      id: "spirit_outbreak_001",
      type: "spirit_outbreak",
      state: "contained",
      center: { x: 19, y: 11 },
      age: 17,
      firstSeenTick: 233,
      lastSeenTick: 250,
      severity: "medium",
      confidence: 0.8,
      displayIcon: "spirit_warning",
      metrics: {
        dormantSpirits: 1,
        activeSpirits: 0,
        marksCreated: 4,
        humanDeathsToSpirit: 1
      },
      history: []
    }
  ],
  memories: [
    {
      id: "memory_001",
      type: "former_settlement",
      center: { x: 12, y: 8 },
      sourceRegionId: "settlement_001",
      createdTick: 700,
      lastUpdatedTick: 900,
      summary: "Former settlement declined and became a scarred field."
    }
  ]
}
```

Keep `cells` arrays short if export size is a concern. It is acceptable to store full cells only for active regions and use bounds/center for older memories.

---

# Analysis interval

Analyze every 25 ticks by default:

```js
const MACRO_ANALYSIS_INTERVAL = 25;
```

Also run analysis on:

```text
Reset
Randomize
Apply Initial Settings
Export Snapshot JSON
Start Recording initial frame
```

Do not analyze every animation render if not needed.

---

# Recent-frame window

Macro detection needs recent history, not only the current frame.

Use recent recording frames when available:

```text
last 50-150 ticks
```

If recording is not active, keep a small internal macro frame buffer:

```js
const MAX_MACRO_RECENT_FRAMES = 150;
```

Each macro frame can store compact data:

```js
{
  tick,
  counts,
  events,
  diagnostics,
  terrainRows,
  unitRows,
  fertilityRows
}
```

If full grid every tick is too heavy, store full grid every 25 ticks and event counters every tick.

For V0.9, simple and readable is more important than perfect optimization.

---

# Spatial helpers

Implement simple helpers:

```js
getCellKey(x, y)
distance(a, b)
centroid(cells)
boundsForCells(cells)
floodFillCells(world, predicate)
countUnitsNear(world, cells, radius)
countTerrainNear(world, cells, radius)
avgFertilityForCells(world, cells)
overlapsOrNear(regionA, regionB, maxDistance)
```

Use 8-neighborhood for connected regions unless a specific detector says otherwise.

Do not use external graph libraries.

---

# Part A - Settlement detection

Detect current Human settlements from FIELD connected components.

Candidate:

```text
FIELD connected component area >= 8
nearby Human count >= 3
nearby Spirit pressure low or moderate
```

Metrics:

```text
fieldArea
population
avgFieldFertility
nearbyMark
nearbySpirit
recentBirths
recentDeaths
recentSettlerDepartures
recentSettlementFoundings
```

States:

```text
new_settlement
growing
stable
overloaded
declining
abandoned
```

Recommended state rules:

```text
new_settlement:
    firstSeenTick within last 75 ticks

growing:
    population or fieldArea increased over recent window
    and avgFieldFertility >= 2

stable:
    population >= 3
    fieldArea >= 8
    low recent deaths

overloaded:
    high Human density
    avgFieldFertility <= 1.5
    or many crisisSettlerDepartures

declining:
    population falling
    recentDeaths > recentBirths
    or nearby MARK/S pressure rising

abandoned:
    fieldArea remains
    population < 2
```

Display:

```text
house / village / flag / broken_house
```

Important:

```text
Do not create village buildings.
This is only a macro label/icon.
```

---

# Part B - Abandoned settlement detection

Detect abandoned settlements in two ways:

```text
1. Current FIELD remains with low/no Human population and high MARK or low fertility.
2. A previously tracked settlement disappears or falls below settlement threshold.
```

Candidate:

```text
FIELD component area >= 5
Human count nearby <= 1
and one of:
    MARK nearby >= 2
    avgFieldFertility <= 1.5
    previous macro region was settlement
```

States:

```text
recently_abandoned
haunted_ruin
reclaimed_by_wild
resettled
```

Rules:

```text
recently_abandoned:
    was settlement within last 100 ticks

haunted_ruin:
    abandoned + MARK/S pressure remains

reclaimed_by_wild:
    abandoned + WILD grows nearby + MARK decreases

resettled:
    abandoned memory later matches a new settlement
```

Display:

```text
ruin / broken_house / scar
```

---

# Part C - Beast recovery zone detection

Do not identify Beast recovery only by Beast count.

Beast recovery is a functional trace.

Candidate signals over recent window:

```text
beastAuraMarksCleaned > 0
beastAuraSpiritCleansed > 0
beastRelocations > 0
marksCleanedByBeast > 0
WILD increased locally
MARK decreased locally
fertility increased locally
Beast present or recently present nearby
```

If local event positions are not currently tracked, start with current spatial evidence:

```text
WILD component area >= 8
Beast count nearby >= 1
nearby MARK low or decreasing
avg WILD fertility >= 3
```

Then add event-position tracking if needed.

States:

```text
beast_trail
active_recovery
wild_restoration
wild_frontier
beast_habitat
```

Suggested rules:

```text
beast_trail:
    narrow/scattered WILD with recent Beast movement

active_recovery:
    recent MARK/S cleansing signals

wild_restoration:
    WILD expanding and fertility high

wild_frontier:
    near FIELD/Human settlement

beast_habitat:
    persistent WILD + recurring Beast presence
```

Display:

```text
sprout / paw / grass
```

---

# Part D - Spirit outbreak and scar detection

Spirit is not a stable region.

Track it as an event lifecycle.

Candidate signals:

```text
dormantSpirits > 0
activeSpirits > 0
humanDeathsToSpirit > 0
spiritsCreatedByHumanDeath > 0
spiritTrailMarksCreated > 0
spiritWarningFlees > 0
M increasing locally
Humans adjacent to dormant/active Spirit
```

States:

```text
warning
incubating
active_outbreak
contained
aftermath
scar
```

Suggested rules:

```text
warning:
    dormant Spirit exists, no major deaths yet

incubating:
    dormant Spirit persists for multiple ticks

active_outbreak:
    active Spirit present or Spirit-related Human deaths occur

contained:
    Spirit removed/cleansed, Beast cleansing occurred, MARK remains

aftermath:
    no active Spirit, recent MARK trail/deaths remain

scar:
    old MARK cluster remains after outbreak
```

Display:

```text
spirit_warning / mist / crack / scar
```

Important:

```text
Do not make MARK spawn Spirit.
Do not add story text.
Just label the macro event.
```

---

# Part E - Migration route detection

Migration routes are hard because current events may not store positions.

Implement a simple V0.9 route detector first:

```text
Track positions of Humans with settler roles each macro analysis.
If many settler positions appear between an older settlement and a newer settlement/founding area, create a route.
```

Add compact macro tracking:

```js
macroHistory.settlerPositionSamples.push({
  tick,
  cells: [{ x, y, role }]
});
```

Candidate:

```text
recent settler samples >= 4
path connects or trends from one settlement region toward another settlement/founding
or settlementFoundings > 0 near recent settler samples
```

States:

```text
active_route
old_route
dangerous_route
pilgrim_trail
```

Suggested rules:

```text
active_route:
    recent settler samples continue

old_route:
    no recent settlers, but route was active before

dangerous_route:
    route crosses MARK/S pressure

pilgrim_trail:
    route repeatedly passes scars/ruins
```

Display:

```text
footprints / flag / trail
```

Keep this approximate. The goal is to make migration visible, not to solve path reconstruction perfectly.

---

# Part F - Human-Beast frontier detection

Detect places where Human expansion and Beast recovery meet.

Candidate:

```text
FIELD/H activity near WILD/B activity
and at least one of:
    beastDispersals > 0 recently
    beastRelocations > 0 recently
    fieldTrampled > 0 recently
    WILD and FIELD adjacent within radius 2
```

States:

```text
hunting_ground
contested_frontier
grazing_edge
wild_border
```

Suggested rules:

```text
hunting_ground:
    Humans near Beasts, Beast dispersal/relocation occurs

contested_frontier:
    FIELD and WILD both changing locally

grazing_edge:
    Beast presence near FIELD, low conflict

wild_border:
    persistent FIELD/WILD boundary
```

Display:

```text
crossed_flags / paw_field / bow
```

---

# Part G - Region identity and memory

This is the most important part.

Do not treat every detection as a new region.

Match new candidates to existing macro objects by:

```text
same type or compatible type
center distance <= 6
or cell overlap >= 30%
or previous region bounds intersects candidate bounds
```

When matched:

```text
keep id
update state
update metrics
increment age
lastSeenTick = tick
append history entry only when state changes or major metric crosses threshold
```

When unmatched:

```text
create new id
firstSeenTick = tick
age = 0
history starts with initial state
```

When an existing object is not seen:

```text
do not delete immediately
mark stale
keep for at least 100 ticks
if settlement disappears, convert to abandoned_settlement memory when appropriate
if spirit_outbreak disappears, convert to aftermath/scar when MARK remains
```

This is what gives the world history.

---

# Part H - Confidence and display filtering

Every macro object should have confidence from 0 to 1.

Only display icons when:

```text
confidence >= 0.55
and object age >= 25 ticks
```

Exceptions:

```text
spirit_outbreak warning can display immediately if active/dormant Spirit is near Humans.
```

Avoid visual noise:

```text
max displayed icons default: 12
prefer highest confidence and highest severity
prefer diverse types over many settlements
do not show multiple icons with centers too close unless types are meaningfully different
```

Export all macro objects, even if not displayed.

Add field:

```js
visible: true/false
```

---

# Part I - Macro icon overlay

Add a UI toggle:

```text
Show Macro Icons
```

If enabled, show one simple marker per visible macro object.

Simple acceptable rendering:

```text
Use absolutely positioned divs over the grid.
Use text icons or short labels:
S for settlement
R for ruin
W for wild recovery
! for spirit outbreak
* for spirit scar
-> for migration route
F for frontier
```

Do not add final art.

Do not make a landing page.

Do not turn this into a full map UI.

If overlay positioning is too risky in V0.9, skip the overlay but complete JSON export.

---

# Part J - JSON export integration

Add `macroWorld` to snapshot export:

```js
{
  type: "tri_species_snapshot",
  ...
  macroWorld
}
```

Add `macroWorld` to recording export:

```js
{
  type: "tri_species_recording",
  ...
  macroWorld,
  macroFrames: [...]
}
```

Each recording frame may include a compact macro summary:

```js
frame.macro = {
  regions: macroWorld.regions.length,
  events: macroWorld.events.length,
  routes: macroWorld.routes.length,
  visibleIcons: count
}
```

Each keyframe should include full `macroWorld` if available.

Do not break existing export schema fields.

---

# Part K - Optional local event positions

If current event counters are too global to identify local macro events, add lightweight positional event logging.

Example:

```js
currentTickLocalEvents.push({
  type: "settlementFounding",
  x,
  y,
  tick
});
```

Useful local event types:

```text
settlementFounding
settlerMove
humanDeathToSpirit
humanDeathToMark
spiritTrailMark
spiritSuppressedByBeast
markCleanedByBeast
beastRelocation
beastDispersal
fieldTrampled
wildCreatedByBeast
wildDecayedToEmpty
```

Keep only recent local events:

```js
const MAX_LOCAL_EVENT_HISTORY = 500;
```

Do not make this a full analytics database.

---

# Part L - Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add V0.9 notes:

```text
V0.9 adds a Macro World Layer.
It does not change core ecology rules.
It scans the single-screen world and recent events.
It identifies settlements, abandoned settlements, Beast recovery zones, Spirit outbreaks/scars, migration routes, and Human-Beast frontiers.
It keeps region identity and history over time.
It exports macroWorld JSON.
It may display simple macro icons.
```

Update the rules version to:

```text
TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
```

If the implementation deliberately keeps the V0.8.3 rules version for ecology but adds a separate macro version, document that clearly:

```text
Ecology rules: V0.8.3
Macro layer: V0.9
```

---

# Part M - Expected behavior

After V0.9:

```text
Snapshot JSON includes macroWorld.
Recording JSON includes macroWorld and/or macroFrames.
Settlements keep stable ids across analysis ticks.
A settlement can become abandoned instead of disappearing from memory.
Spirit outbreaks can become aftermath/scar records.
Beast recovery zones can appear from WILD/fertility/cleansing traces.
Migration routes can be approximated from settler position samples.
Human-Beast frontiers can be recognized where FIELD/H and WILD/B meet.
Optional icon overlay shows a small number of readable macro markers.
```

Failure signs:

```text
Every analysis creates new ids for the same settlement.
Icons flicker every 25 ticks.
Dozens of icons clutter the grid.
macroWorld only repeats current counts and has no history.
Macro layer changes bottom-layer ecology heavily.
Existing snapshot/recording export breaks.
```

---

# Test checklist

Run manually in browser:

```text
Balanced Asymmetric Ecology Test 0-300
Human Migration Test 0-300
Human Expansion Test 0-300
Beast Dispersion Test 0-200
Spirit Outbreak Test 0-200
No Spirit Control 0-200
```

Check:

```text
1. No console errors.
2. Play/Pause/Step/Reset/Randomize still work.
3. Snapshot export downloads and includes macroWorld.
4. Recording export downloads and includes macroWorld/macroFrames.
5. Settlement ids persist across multiple macro analyses.
6. At least one settlement is detected in balanced/human tests.
7. Abandoned settlement or scar can appear when population drops or MARK remains.
8. Beast recovery zone can appear in Beast-heavy or cleanup-heavy runs.
9. Spirit outbreak/scar appears in Spirit Outbreak Test.
10. Migration route appears when settlers move/found.
11. Human-Beast frontier appears where FIELD and WILD/B interact.
12. Optional icon overlay can be toggled and does not cover the grid unreadably.
```

If automated tests exist, add focused tests for pure macro helpers:

```text
flood fill region detection
settlement detection
region id matching
stale region memory
macroWorld export shape
```

Do not add external test dependencies.

---

# Completion report

When finished, report:

```text
files changed
ecology rules version
macro layer version
macro architecture used
macro object types implemented
history/id matching behavior
JSON export changes
UI overlay changes, if any
tests run
known simplifications or deviations
```

Known acceptable simplifications for V0.9:

```text
Migration routes may be approximate.
Beast recovery may initially use current WILD/fertility/Beast evidence if local event positions are not complete.
Icons may be simple text markers.
Macro names/lore text are not required.
No macro-to-ecology feedback is required yet.
```
