# CODEX V0.14B.1 Proto-Culture Readability Audit Task

## Executor instruction

Use this document as the full goal brief.

Work checkpoint by checkpoint. This task is export / audit / documentation only.

Before editing implementation code, read the required files listed below, especially `TRI_SPECIES_WORLD_SIM_RULES.md` and the observer-only policy in `AGENTS.md`.

Keep the implementation local and minimal:

```text
do not tune protoCultureHints scoring
do not tune protoCultureMemory update rules
do not tune Human-related gates
do not change wake report visibility
do not change H/B/S simulation behavior
do not add civilization gameplay or polity-level rollups
```

Likely implementation note:

```text
Prefer deriving protoCultureSummary inside the existing Place Memory export path.
If compactPlaceMemory() is the shared snapshot/recording export helper, integrate there.
Do not store protoCultureSummary as live mutable simulation state unless absolutely required.
```

Main work ownership:

```text
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/OBJECT_SCHEMA.md
sim.js
tests/v0_14b_1_proto_culture_summary.test.js
```

You are not alone in the codebase. Do not revert unrelated changes made by others; adjust to the current files.

Final report must include:

```text
checkpoints completed
files changed
tests run and results
summary of protoCultureSummary shape
known simplifications
observer-only confirmation
```

---

# Original Goal: V0.14B.1 Proto-Culture Readability Audit

## Goal

Implement **V0.14B.1 Proto-Culture Readability Audit**.

This is a small observer-only audit layer on top of the existing V0.14B `protoCultureHints` and `protoCultureMemory`.

The goal is to make exported recordings / snapshots easier to inspect by adding a compact `protoCultureSummary` to Place Memory export data.

This is not a new gameplay feature.

This is not a civilization system.

This is not AI.

This is not tarot.

This is not story events.

This is not resources, buildings, NPCs, quests, myth events, or factions.

This must not change the H/B/S ecology or simulation behavior.

---

## Required reading before editing

Read these files first:

```text
AGENTS.md
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
tests/v0_14b_proto_culture_hints.test.js
```

Pay special attention to the observer-only policy in `AGENTS.md`.

---

## Hard constraints

Do not change:

```text
H/B/S movement
tick order
lifecycle
conflict
conversion
terrain rewrite
reproduction
fertility
POI effects
river blockers
terrain types
unit types
terrain decay
Explore movement
map seed behavior
semantic trait derivation behavior
place archetype priority
protoCultureHints scoring
protoCultureMemory update rules
wake report sparsity
```

Do not add:

```text
civilization modules
civilization gameplay
AI calls
tarot mechanics
story events
myth events
resources
buildings
NPCs
quests
new terrain
new unit types
network calls
external libraries
save/load
multi-screen map
```

This stage is export / audit / documentation only.

---

## Problem

V0.14B successfully adds `protoCultureHints` and `protoCultureMemory`, but the data is currently hard to inspect across a full recording.

When reviewing exported JSON, we need a compact summary that answers:

```text
How many anchors have protoCultureMemory?
Which primary hints are most common?
Which stable hints are most common?
Which active hints are most common?
Which anchor types are producing proto-culture hints?
Are non-Human-labeled anchors producing hints too often?
Which anchors are the strongest examples for each hint?
```

This summary will help tune gates and scoring later, without changing rules now.

---

## New export object: `placeMemory.protoCultureSummary`

Add a compact `protoCultureSummary` object to exported Place Memory data.

Preferred location:

```js
recording.placeMemory.protoCultureSummary
snapshot.placeMemory.protoCultureSummary
```

If there are multiple export paths, keep the shape consistent.

Do not add large raw arrays.

Do not duplicate full snapshots inside the summary.

---

## Suggested shape

```js
protoCultureSummary: {
  version: "0.14B.1",
  totalAnchors: 31,
  anchorsWithHints: 29,
  anchorsWithMemory: 29,

  primaryHintCounts: {
    memory_bound: 4,
    forest_edge: 3,
    spring_refuge: 2
  },

  stableHintCounts: {
    memory_bound: 6,
    scar_bound: 4,
    seatless_drift: 3
  },

  activeHintCounts: {
    memory_bound: 8,
    forest_edge: 6,
    scar_bound: 5
  },

  anchorTypeCounts: {
    village: 10,
    old_seat: 2,
    poi: 4,
    beast_range: 3
  },

  anchorTypeWithHintCounts: {
    village: 10,
    old_seat: 2,
    poi: 3,
    beast_range: 1
  },

  nonHumanAnchorWithHints: 4,

  nonHumanAnchorExamples: [
    {
      anchorId: "beast_range:population_beast_006",
      anchorType: "beast_range",
      displayName: "B range",
      primaryHint: "forest_edge",
      activeHints: ["forest_edge"],
      reason: "Human semantic traits were present in the sampled place."
    }
  ],

  strongestExamplesByHint: {
    memory_bound: [
      {
        anchorId: "old_seat:human_lineage_001",
        anchorType: "old_seat",
        displayName: "H old seat",
        primaryHint: "memory_bound",
        score: 0.9,
        stable: true
      }
    ]
  }
}
```

The exact numeric values will depend on exported state.

Keep fields compact.

Use stable deterministic sorting.

---

## Definitions

### `totalAnchors`

Number of Place Memory anchors.

### `anchorsWithHints`

Number of anchors whose current snapshot has non-empty `protoCultureHints`.

### `anchorsWithMemory`

Number of anchors with non-empty `protoCultureMemory.signals`.

### `primaryHintCounts`

Count `anchor.protoCultureMemory.primaryHint`.

Ignore null / missing primaryHint.

### `stableHintCounts`

Count all entries in `anchor.protoCultureMemory.stableHints`.

### `activeHintCounts`

Count all entries in `anchor.protoCultureMemory.activeHints`.

### `anchorTypeCounts`

Count all `anchor.type`.

### `anchorTypeWithHintCounts`

Count `anchor.type` only for anchors with either:

```js
currentSnapshot.protoCultureHints.length > 0
```

or:

```js
protoCultureMemory.signals has at least one key
```

### `nonHumanAnchorWithHints`

Count anchors with proto-culture hints or memory whose anchor type is not clearly Human-related.

For this summary, consider these Human-related anchor types:

```text
village
seat
old_seat
outpost
remnant
domain
```

Everything else is non-Human-labeled for audit purposes, even if it may legitimately contain Human semantic traits.

This is audit-only. Do not change the gate.

### `nonHumanAnchorExamples`

Keep at most 8 examples.

Sort by strongest memory score, then anchor id.

Each example should be compact.

Suggested fields:

```js
{
  anchorId,
  anchorType,
  displayName,
  primaryHint,
  activeHints,
  stableHints,
  reason
}
```

`reason` should be deterministic and short.

Examples:

```text
Human semantic traits were present in the sampled place.
Remembered Human identity was present.
Human memory was attached to this anchor.
```

### `strongestExamplesByHint`

For each allowed proto-culture hint id, keep up to 3 strongest anchors.

Allowed hint ids are:

```text
river_bound
forest_edge
memory_bound
scar_bound
frontier_adapted
monument_centered
spring_refuge
split_lineage
seatless_drift
```

Sort by:

```text
highest signal score
then primaryHint match
then stable status
then anchor id
```

Example item:

```js
{
  anchorId,
  anchorType,
  displayName,
  primaryHint,
  score,
  stable
}
```

---

## Implementation guidance

Add pure helper functions near the existing proto-culture helpers.

Suggested functions:

```js
function createEmptyProtoCultureSummary() {}

function summarizeProtoCultureForPlaceMemory(placeMemory) {}

function isHumanRelatedAnchorType(anchorType) {}

function hasAnchorProtoCulture(anchor) {}

function getAnchorProtoCultureScores(anchor) {}

function getNonHumanAnchorProtoCultureReason(anchor) {}
```

The summary function must not mutate anchors, snapshots, world, macroWorld, placeMemory, or any simulation state.

It should return a new compact object.

---

## Integration points

Add `protoCultureSummary` during export only.

Likely locations:

```text
createRecordingExport
createSnapshotExport
any helper that serializes placeMemory
```

If there is already a `serializePlaceMemory` or compact export helper, prefer integrating there.

Do not update the summary every tick.

Do not store the summary as live simulation state unless the existing export architecture requires it.

Prefer deriving it at export time.

---

## Tests

Add a new test file:

```text
tests/v0_14b_1_proto_culture_summary.test.js
```

Use the same fake DOM / VM loading pattern as existing V0.14 tests.

### Test 1: summary exists in recording export

Create or inspect Human-related places so at least one anchor has `protoCultureMemory`.

Call recording export.

Assert:

```js
recording.placeMemory.protoCultureSummary
recording.placeMemory.protoCultureSummary.version === "0.14B.1"
typeof totalAnchors === "number"
typeof anchorsWithHints === "number"
typeof anchorsWithMemory === "number"
```

### Test 2: primary / stable / active counts

Create a repeated river village inspection so `river_bound` becomes active or stable.

Assert:

```js
primaryHintCounts.river_bound >= 1
activeHintCounts.river_bound >= 1
```

If the score reaches stable threshold:

```js
stableHintCounts.river_bound >= 1
```

### Test 3: non-Human anchor audit does not change gate

Create a non-Human place with no Human semantic traits.

Assert:

```js
protoCultureHints.length === 0
```

Then create or mock an anchor with non-Human anchor type but Human semantic traits / memory sufficient to produce protoCultureHints.

Assert:

```js
protoCultureSummary.nonHumanAnchorWithHints >= 1
protoCultureSummary.nonHumanAnchorExamples.length >= 1
```

This test is audit-only. Do not change protoCulture gate behavior.

### Test 4: strongest examples by hint

Create a known `memory_bound` or `river_bound` anchor.

Assert:

```js
summary.strongestExamplesByHint.river_bound
```

or:

```js
summary.strongestExamplesByHint.memory_bound
```

contains compact entries with:

```js
anchorId
anchorType
displayName
score
stable
```

### Test 5: summary derivation does not mutate world or place memory

Before calling export / summary:

```js
const before = JSON.stringify(placeMemory)
```

After summary:

```js
const after = JSON.stringify(placeMemory)
```

Assert unchanged, unless the existing export path already normalizes/copies placeMemory.

If the export path clones placeMemory, test the pure summary helper directly.

### Test 6: JSON stringify works

Assert:

```js
JSON.stringify(recording)
```

does not throw.

---

## Documentation updates

Update:

```text
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/OBJECT_SCHEMA.md
```

### README.md

Add V0.14B.1 to the version split:

```text
Proto-culture readability audit: TRI_SPECIES_WORLD_SIM_V0.14B.1_PROTO_CULTURE_READABILITY_AUDIT
```

Add a short section:

```text
V0.14B.1 Proto-Culture Readability Audit:

Recording and snapshot exports include compact protoCultureSummary inside placeMemory.
The summary counts primary, stable, and active proto-culture hints, anchor types, and non-Human-labeled anchors with proto-culture hints.
This is export-only and observer-only.
It does not change protoCultureHints, protoCultureMemory, Place Memory update timing, wake reports, or simulation rules.
```

### TRI_SPECIES_WORLD_SIM_RULES.md

Add a V0.14B.1 section.

Emphasize:

```text
export-only
observer-only
no bottom-layer rule changes
summary is derived at export time
does not change wake report visibility
does not tune scoring or gates
```

### Docs/README_DOCS.md

Update current completed stage to:

```text
TRI_SPECIES_WORLD_SIM_V0.14B_PROTO_CULTURE_HINTS
```

Recommended next stage:

```text
V0.14B.1 Proto-Culture Readability Audit
```

After implementation, it can mention V0.14B.1 as completed.

### Docs/Architecture/PROTO_CULTURE_HINTS.md

Add a section:

```md
## V0.14B.1 Readability Audit Summary
```

Document:

```text
protoCultureSummary
primaryHintCounts
stableHintCounts
activeHintCounts
nonHumanAnchorWithHints
strongestExamplesByHint
```

Make clear that it is export-only.

### Docs/Architecture/OBJECT_SCHEMA.md

Update PlaceMemory export shape to mention optional / export-derived:

```text
protoCultureSummary
```

Do not add it as live state unless necessary.

---

## Acceptance criteria

1. `node --check sim.js` passes.
2. Existing V0.14A and V0.14B tests pass.
3. New `tests/v0_14b_1_proto_culture_summary.test.js` passes.
4. Recording export includes `placeMemory.protoCultureSummary`.
5. Snapshot export, if it includes placeMemory, also includes the same summary shape.
6. `protoCultureSummary` is compact and deterministic.
7. `protoCultureSummary` does not mutate world or placeMemory.
8. Wake reports remain sparse and unchanged.
9. No proto-culture scoring or gate behavior is changed.
10. No H/B/S simulation rules are changed.
11. No civilizations, tarot, AI, story events, resources, buildings, NPCs, quests, new terrain, or new units are added.
12. README, TRI_SPECIES_WORLD_SIM_RULES, Docs/README_DOCS, PROTO_CULTURE_HINTS, and OBJECT_SCHEMA are updated.

---

## Checkpoint plan

Work checkpoint by checkpoint.

### Checkpoint 1: Plan

Before editing, report:

```text
files you plan to touch
functions you plan to add
tests you plan to add
confirmation that no simulation rules will change
```

### Checkpoint 2: Pure summary helper

Add pure summary helper functions.

Do not integrate export yet.

Run syntax check.

### Checkpoint 3: Export integration

Add `protoCultureSummary` to placeMemory export paths.

Do not change live simulation state.

### Checkpoint 4: Tests

Add `tests/v0_14b_1_proto_culture_summary.test.js`.

Run relevant tests.

### Checkpoint 5: Documentation

Update README / rules / architecture docs.

### Checkpoint 6: Final report

Report:

```text
files changed
tests run
summary of protoCultureSummary shape
known simplifications
confirmation that bottom simulation rules did not change
```

---

## Final reminder

This stage is not about making proto-cultures better.

It is about making proto-culture output easier to audit.

Do not tune scoring.

Do not tune gates.

Do not add civilization candidates.

Do not add polity-level rollups yet.

Those belong to later stages.
