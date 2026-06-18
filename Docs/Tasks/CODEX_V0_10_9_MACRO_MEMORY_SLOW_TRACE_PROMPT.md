# CODEX V0.10.9 Macro Memory Slow Trace Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.9 as the first macro memory / slow trace stage.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_7_1_MACRO_POPULATION_VISUAL_PRIMARY_PROMPT.md
Docs/Tasks/CODEX_V0_10_8_INITIAL_POI_WORLD_ANCHORS_PROMPT.md
Docs/Tasks/CODEX_V0_10_8_1_POI_ECOLOGY_ANCHOR_REBALANCE_PROMPT.md
Docs/Tasks/CODEX_V0_10_8_2_POI_BLOCKING_AND_VISUAL_PRIORITY_PROMPT.md
Docs/Tasks/CODEX_V0_10_8_3_ROT_SOURCE_INNER_RING_HARDENING_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing behavior or exports.

---

## User Goal

The user is concerned that as the simulation runs longer:

```text
the map accumulates too much noise,
small cell fragments change too quickly,
and it becomes hard to summarize continuous readable traces.
```

V0.10.9 should test a solution:

```text
Add a slow memory layer that filters fast grid noise and records what areas repeatedly become over time.
```

The purpose is not to create story, quests, NPCs, or named lore. The purpose is to make the map readable over time.

---

## Concept

Current layers:

```text
cell terrain / unit = fast variable
population evolution shapes = medium variable
POIs = stable anchors
macro memory traces = slow variable
```

V0.10.9 adds the slow variable.

Instead of asking:

```text
What is this cell right now?
```

Macro memory asks:

```text
What has this place repeatedly been recently?
```

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
complex region naming / lore generation
full replay system
```

Do not change:

```text
grid size
terrain enum
unit enum
view mode options
existing control ids
four initial POIs
spring blocking behavior
core counter-cycle rules
macro timeline frame top-level keys
recording frame required keys
```

Allowed:

```text
new observer-only macroMemory state
slow trace accumulation and decay
display-only memory classes
compact macro timeline / recording summaries
POI state labels derived from memory traces
tests / README / rules updates
```

---

## Macro Memory State

Add an observer-only `macroMemory` layer.

Recommended structure:

```js
macroMemory = {
  version: "0.10.9",
  tick,
  updatedEvery: MACRO_DISPLAY_INTERVAL,
  traces: {
    human: number[][],
    beast: number[][],
    rot: number[][],
    fertility: number[][],
    conflict: number[][]
  },
  poiStates: []
}
```

Trace values should be normalized:

```text
0.0 to 1.0
```

Do not store full history per tick.
Do not store huge event logs.
Do not add per-frame full trace rows to recording or macro timeline.

---

## Trace Semantics

Use five initial trace channels:

```text
humanTrace
beastTrace
rotTrace
fertilityTrace
conflictTrace
```

Meaning:

```text
humanTrace:
Repeated Human / FIELD / human population shape presence.

beastTrace:
Repeated Beast / WILD / beast population shape presence.

rotTrace:
Repeated MARK / Spirit / rot_source / spirit population shape presence.

fertilityTrace:
Repeated high fertility, spring-supported or fertile recovery area.

conflictTrace:
Repeated BORDER / frontier / Human-Beast overlap / contested POI ring.
```

The trace is not the same as current terrain.

Example:

```text
A cell that flickers FIELD once should not become a Human memory.
A cell that stays in Human shape for many samples should.
A place that was Human but becomes Beast should fade from Human memory slowly, not instantly disappear.
```

---

## Update Cadence

Update macro memory on the lightweight macro cadence:

```text
MACRO_DISPLAY_INTERVAL
```

Do not run heavy macroWorld analysis every tick.

Manual step should update memory when macro display would update.

Recommended order:

```text
simulation tick
population evolution refresh if due
macro memory update if due
render
recording / macro timeline capture
```

Use the current world plus currently available population evolution frame / macro display masks.

---

## Accumulation / Decay

Use simple exponential decay and additive accumulation.

Recommended starting constants:

```text
MACRO_MEMORY_DECAY = 0.992 per memory update
MACRO_MEMORY_TERRAIN_GAIN = 0.025
MACRO_MEMORY_SHAPE_BODY_GAIN = 0.035
MACRO_MEMORY_SHAPE_CORE_GAIN = 0.055
MACRO_MEMORY_POI_GAIN = 0.030
MACRO_MEMORY_CONFLICT_GAIN = 0.045
```

Clamp all trace values:

```text
0.0 <= trace <= 1.0
```

Suggested signals:

```text
FIELD or Human unit -> humanTrace + terrain gain
population-human-body -> humanTrace + shape body gain
population-human-core -> humanTrace + shape core gain

WILD or Beast unit -> beastTrace + terrain gain
population-beast-body -> beastTrace + shape body gain
population-beast-core -> beastTrace + shape core gain

MARK or Spirit unit -> rotTrace + terrain gain
population-spirit-body/core -> rotTrace + shape gains
rot_source center / inner ring -> rotTrace + POI gain

fertility >= 3 -> fertilityTrace + terrain gain
spring radius -> fertilityTrace + POI gain

BORDER / macro-cell-frontier / overlapping strong human+beast traces -> conflictTrace + conflict gain
```

Keep the implementation cheap. The grid is small, so simple arrays are fine.

---

## Noise Filtering

This patch exists to fight noise.

Required behavior:

```text
Short-lived one-frame specks should not become visible memory.
Visible memory should require a threshold.
Old memory should fade gradually.
Memory classes should appear only for high-confidence traces.
```

Recommended visible thresholds:

```text
memory strong threshold: >= 0.50
memory faint threshold: >= 0.32
```

If two traces compete, choose the strongest for display unless conflictTrace is also high.

Conflict memory should be shown only when:

```text
conflictTrace >= threshold
or humanTrace and beastTrace are both high in the same area
```

---

## Display

Macro View should remain primarily a population evolution view.

Memory must be secondary:

```text
current population shapes = vivid
POI centers = clear anchors
memory traces = faint historical substrate
```

Add display-only classes such as:

```text
memory-human-faint
memory-human-strong
memory-beast-faint
memory-beast-strong
memory-rot-faint
memory-rot-strong
memory-fertile-faint
memory-fertile-strong
memory-conflict-faint
memory-conflict-strong
```

Display rules:

```text
Do not apply memory classes to BLOCK.
Do not hide spring center, rot_source core, or great_forest core.
Do not let memory colors overpower current population shape colors.
Substrate + Macro View may show memory even more softly than Macro View.
Cell View remains unchanged.
```

Memory should help the user say:

```text
this used to be Human/FIELD
this has been Beast/WILD for a while
this is a persistent rot scar
this is a recurring frontier/conflict zone
this is a fertile recovery area
```

---

## POI State Labels

Derive compact POI states from current + memory traces.

Do not create story events.
Do not create quests.
Do not create dialogue.

Recommended labels:

```text
monument:
prosperous | pressured | haunted | fallen

great_forest:
flourishing | guarded | contested | shrinking

rot_source:
dominant | spreading | contested | contained

spring:
wild_fed | field_fed | neutral | corrupted
```

Use simple local averages around each POI:

```text
humanTrace average
beastTrace average
rotTrace average
fertilityTrace average
conflictTrace average
current terrain / unit counts
```

Suggested examples:

```text
spring:
if rotTrace avg high -> corrupted
else if beastTrace avg > humanTrace avg + margin -> wild_fed
else if humanTrace avg > beastTrace avg + margin -> field_fed
else neutral

rot_source:
if rotTrace avg high and MARK count high -> dominant
else if conflictTrace high or human/beast traces high nearby -> contested
else if rotTrace avg increasing -> spreading
else contained
```

Keep labels deterministic and compact.

---

## Export Required For Later Analysis

The user explicitly wants this attempt visible in recording or macro timeline output so the result can be analyzed later.

Minimum required export:

```text
Macro Timeline frames must include compact macroSummary.macroMemory.
Macro Timeline frames must include compact macroSummary.poiStates.
Recording export must include either top-level macroMemorySummary or macro frame summaries that include memory/POI state.
```

Do not add full trace arrays to every frame.

Recommended macro timeline frame shape:

```js
macroSummary: {
  ...existing,
  macroMemory: {
    strongest: "human" | "beast" | "rot" | "fertility" | "conflict" | "none",
    activeCells: {
      human: number,
      beast: number,
      rot: number,
      fertility: number,
      conflict: number
    },
    strongCells: {
      human: number,
      beast: number,
      rot: number,
      fertility: number,
      conflict: number
    }
  },
  poiStates: [
    { id, type, state, human, beast, rot, fertility, conflict }
  ]
}
```

Values in `poiStates` should be compact rounded numbers, not cell lists.

Recording export:

```text
Add top-level macroMemorySummary from the final available macroMemory state.
Keep recording.frames existing required keys stable.
```

Macro Timeline frame top-level keys must remain stable:

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
tests/v0_10_9_macro_memory_slow_trace.test.js
```

Required assertions:

```text
macroMemory state exists and has five trace channels.
Trace values decay and clamp between 0 and 1.
Repeated Human/FIELD signal increases humanTrace more than one-frame noise.
Repeated WILD/Beast signal increases beastTrace.
Repeated MARK/rot_source signal increases rotTrace.
High fertility / spring area increases fertilityTrace.
BORDER/frontier or overlapping human+beast traces increases conflictTrace.
Memory display classes are not applied to BLOCK.
Memory display classes do not replace POI center/core classes.
Macro View renders high-confidence memory classes only after repeated signal.
POI state labels are deterministic for simple fixtures.
Macro Timeline frame top-level keys remain unchanged.
Macro Timeline macroSummary includes macroMemory and poiStates.
Recording export includes compact macroMemorySummary or macro memory summary in macro frames.
No full trace rows are exported per timeline frame.
Existing pointsOfInterest export remains compact.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_8_initial_poi_world_anchors.test.js
node tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
node tests/v0_10_8_2_poi_blocking_visual_priority.test.js
node tests/v0_10_8_3_rot_source_inner_ring_hardening.test.js
node tests/v0_10_9_macro_memory_slow_trace.test.js
```

If a listed test does not exist locally, run the closest existing tests and report the difference.

---

## Rules / Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.9 Macro Memory Slow Trace
```

Document:

```text
Macro memory is observer-only.
It adds slow trace channels for human, beast, rot, fertility, and conflict.
It accumulates repeated signals and decays old traces.
It exists to reduce perceived noise and preserve readable historical traces.
It derives compact POI state labels from local memory traces.
It exports compact summaries for analysis.
It does not add terrain, species, quests, NPCs, save/load, multi-screen gameplay, or a full history replay.
```

Update version string:

```text
TRI_SPECIES_WORLD_SIM_V0.10.9_MACRO_MEMORY_SLOW_TRACE
```

Update `README.md` with a short user-facing explanation.

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Run 300-800 ticks.
4. Confirm current population shapes remain vivid.
5. Confirm old stable areas leave faint memory traces.
6. Confirm one-frame specks do not become visible memory.
7. Confirm POI centers remain readable above memory traces.
8. Confirm recurring frontiers/conflict areas leave a faint conflict memory.
9. Export Macro Timeline JSON.
10. Confirm macroSummary.macroMemory and macroSummary.poiStates are present.
11. Export Recording JSON.
12. Confirm recording includes compact macroMemorySummary or equivalent macro memory summaries.
```

Expected result:

```text
The map should become easier to interpret over long runs.
Fast cell noise should be filtered.
The exported macro timeline should let a reviewer analyze whether readable historical traces emerged.
```

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether terrain/unit enums stayed unchanged
which V0.10.9 rule section was implemented
macro memory update cadence
trace channels and constants
POI state label rules
display classes added
Macro Timeline export fields added
Recording export fields added
confirmation that full trace rows are not exported per frame
known simplifications or deviations
expected visual difference
```

