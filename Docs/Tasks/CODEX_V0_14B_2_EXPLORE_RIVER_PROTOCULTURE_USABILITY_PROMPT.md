# CODEX V0.14B.2 Explore Collision, River Generation, and Proto-Culture Audit Usability Task

## Executor Instruction

Use this document as the full implementation brief.

Work checkpoint by checkpoint. Keep changes focused and testable.

Before editing implementation code, read:

```text
AGENTS.md
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/OBJECT_SCHEMA.md
sim.js
style.css
index.html
tests/v0_13_1_1_map_seed_editor_usability_patch.test.js
tests/v0_13_1_map_seed_place_memory_wake_report.test.js
tests/v0_14b_1_proto_culture_summary.test.js
```

This task is a usability and audit tooling patch. It must not change bottom-layer H/B/S ecology rules unless explicitly called out below.

You are not alone in the codebase. Do not revert unrelated changes. In particular, do not touch generated review/export data under `Docs/Generated/` unless a test explicitly needs a new generated artifact. This task should not commit generated run JSON.

---

## Stage Name

Use:

```text
V0.14B.2 Explore / River / Proto-Culture Audit Usability
TRI_SPECIES_WORLD_SIM_V0.14B.2_EXPLORE_RIVER_PROTOCULTURE_USABILITY
```

---

## Hard Constraints

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
new terrain types
new unit types
network calls
external libraries
save/load
multi-screen map
polity-level culture rollups
```

Do not change:

```text
H/B/S lifecycle
H/B/S conflict
H/B/S conversion
H/B/S reproduction
H/B/S terrain rewrite
fertility rules, except existing river feature restoration may continue as-is
POI effects
semantic trait derivation behavior
place archetype priority
protoCultureHints scoring
protoCultureMemory update rules
wake report sparsity
```

Allowed changes:

```text
Explore player collision / movement feel
visual styling for blockers, especially BLOCK/mountains
generated river map feature creation for new/random worlds
recording-panel UI export for proto-culture summary
test/export helper for running multiple proto-culture summary samples by seed
docs and tests for the above
```

River remains a `mapFeatures.rivers` feature. Do not add WATER terrain.

---

## Problems To Solve

### 1. Explore movement can collide with unclear blockers

In Explore View, the player can feel like they hit unknown collision. Collision should match visible blockers.

Expected behavior:

```text
Visible BLOCK/mountains block.
Visible BORDER blocks.
Visible rivers block.
Visible hard POI centers block, especially Spring.
Ordinary terrain color / POI influence / macro overlays must not silently block the player.
If something blocks movement, it should have an obvious visual signal in Explore View.
Movement should slide smoothly along obstacle edges when one axis is passable.
```

Implementation guidance:

```text
Audit isExploreCellPassable, collidesExplorePosition, updatePlayerObserverContinuous, getExploreViewportRenderModel, and blocker styling.
If current floor-based collision samples make visual/passability feel offset, tune the sampling so the player marker collision aligns with visible cells.
Keep the player as continuous movement, not grid-step movement.
Do not make H/B/S units block the player.
Do not remove river/Spring/block collision.
Add an explicit compact debug/test helper if needed to explain why a cell blocks Explore movement.
```

Acceptance:

```text
Cells reported as Explore-passable should not stop the player.
Blocked cells should be visibly blocked.
Player can slide along a vertical wall when moving diagonally into it.
River and Spring center remain blockers.
```

---

### 2. Mountains / BLOCK need stronger visual identity

Mountain/BLOCK cells currently read too similarly to other cells. Make mountains visually unmistakable.

Expected behavior:

```text
BLOCK / mountain cells should render with pure or near-pure black base in Cell, Macro, Substrate Macro, and Explore View.
POI influence, macro overlays, fertility tint, and region/material tint must not make BLOCK look passable.
Optional: keep a subtle ridge/texture line only if the base is still clearly black.
```

Acceptance:

```text
In Explore View, every impassable mountain/BLOCK cell is black and visually distinct.
In Macro View, BLOCK remains visually distinct even under POI overlays.
```

---

### 3. Generated worlds should include river generation

The editable random map seed preset already has a river, but generated/random worlds should reliably include river map features too.

Expected behavior:

```text
When creating a new generated world / random world through the app, mapFeatures.rivers should be non-empty.
Rivers should be continuous-ish paths, not isolated dots.
Rivers should avoid mountains/BLOCK where practical.
Rivers should remain map features, block H/B/S and Explore movement through existing helpers, and restore fertility through existing river logic.
Exported mapSeed/mapFeatures should include the generated rivers.
```

Implementation guidance:

```text
Prefer extracting/reusing a deterministic river path generator helper.
If createRandomMapSeedPreset already has a suitable river generator, reuse or share that logic rather than creating a separate style.
Do not add WATER terrain.
Do not make rivers overwrite mountains as terrain.
Ensure generated units are not placed on river cells where existing seed rules disallow that.
Keep generation deterministic under the existing randomSeed behavior.
```

Acceptance:

```text
createInitialWorld / randomize path exports non-empty mapFeatures.rivers.
generateRandomMapSeedPreset still exports non-empty rivers.
River blockers still work.
Existing map seed editor behavior still works.
```

---

### 4. Recording panel needs lightweight proto-culture export

The user needs a light export path for proto-culture information without exporting a full 20MB+ recording.

Add a Recording-panel UI control, for example:

```text
Export Proto-Culture Summary JSON
```

Expected exported shape:

```js
{
  type: "tri_species_proto_culture_summary",
  version: "0.14B.2",
  createdAt,
  tick,
  sourceRecordingRange: { startTick, endTick },
  placeMemory: {
    protoCultureSummary,
    compactAnchors: [
      {
        anchorId,
        anchorType,
        displayName,
        position,
        placeArchetype,
        primaryHint,
        stableHints,
        activeHints,
        signals,
        currentHints
      }
    ]
  }
}
```

Keep it compact:

```text
No full frames.
No terrainRows/unitRows.
No full snapshots.
No full wake report text unless a short count/last-change summary is useful.
Cap arrays where needed.
```

Implementation guidance:

```text
Use existing protoCultureSummary from compactPlaceMemory / summarizeProtoCultureForPlaceMemory.
Add createProtoCultureSummaryExport() and exportProtoCultureSummaryJson().
Add a button in the Recording panel in index.html.
Wire the button in sim.js.
Add tests that the export is compact and includes expected fields.
```

Acceptance:

```text
Button appears under Recording controls.
Clicking it downloads a small JSON export.
The export includes protoCultureSummary and compact anchors.
JSON.stringify works.
The export does not mutate placeMemory.
```

---

### 5. Add built-in multi-seed proto-culture summary audit capability

The assistant/user needs a built-in way to run multiple seeds and get protoCultureSummary data without manually playing several runs.

This can be a test hook / lightweight helper first; UI is optional unless easy.

Required helper:

```js
runProtoCultureSummaryAuditForSeedsForTest({
  seeds: [31401, 31402, 31403],
  ticks: 200,
  inspectEvery: 25,
  maxTargets: 24
})
```

Return compact data:

```js
{
  version: "0.14B.2",
  ticks,
  inspectEvery,
  runs: [
    {
      seed,
      startTick,
      endTick,
      inspectedAnchors,
      protoCultureSummary,
      strongestExamplesByHint,
      finalCounts,
      inspectionLog
    }
  ],
  aggregate: {
    runCount,
    primaryHintCounts,
    stableHintCounts,
    activeHintCounts,
    anchorTypeWithHintCounts,
    nonHumanAnchorWithHints,
    strongestExamplesByHint
  }
}
```

Implementation guidance:

```text
This should be deterministic for a given seed list.
It may simulate in the current JS runtime but must restore or isolate app state after each run where practical.
It must not require external dependencies or network calls.
It may use existing inspection helpers internally.
It should inspect Human-related places and POIs similarly to manual play: Human villages, seats, old seats, outposts, POIs, scars/ranges when discoverable.
```

Acceptance:

```text
Tests can run 2 small seeds for a short tick count and get non-empty protoCultureSummary.
The helper does not export full recordings.
The helper returns aggregate counts.
The helper does not leave the current app state corrupted after running.
```

---

## Suggested Files

Likely files:

```text
index.html
style.css
sim.js
tests/v0_14b_2_explore_river_proto_audit_usability.test.js
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/OBJECT_SCHEMA.md
```

Do not touch generated run JSON under:

```text
Docs/Generated/
```

---

## Tests

Add:

```text
tests/v0_14b_2_explore_river_proto_audit_usability.test.js
```

Test coverage should include:

```text
1. Explore passability/collision matches visible blockers:
   - BLOCK/mountain blocks.
   - River blocks.
   - Spring center blocks.
   - Adjacent passable cell allows movement.
   - Diagonal into a wall slides along the free axis.

2. Generated worlds include rivers:
   - createInitialWorld / randomize path has mapFeatures.rivers in export.
   - generated rivers are non-empty and reasonably connected.
   - river blockers still work.

3. Mountain visual CSS:
   - style.css contains a strong black BLOCK base for normal/macro/explore/substrate views.
   - BLOCK overlay rules prevent POI/macro tint from making BLOCK look passable.

4. Lightweight proto-culture export:
   - createProtoCultureSummaryExport exists.
   - export includes protoCultureSummary and compactAnchors.
   - export does not include frames/keyframes/full terrain rows.
   - JSON.stringify works.

5. Multi-seed audit helper:
   - runProtoCultureSummaryAuditForSeedsForTest exists.
   - Running two small seeds with a short tick count returns runs and aggregate.
   - Each run includes protoCultureSummary.
   - Aggregate counts are deterministic and compact.

6. Regression:
   - Existing V0.13 map seed / river tests still pass.
   - Existing V0.14B.1 proto-culture summary test still passes.
```

Run at minimum:

```bash
node --check sim.js
node tests/v0_13_1_1_map_seed_editor_usability_patch.test.js
node tests/v0_13_1_map_seed_place_memory_wake_report.test.js
node tests/v0_14b_proto_culture_hints.test.js
node tests/v0_14b_1_proto_culture_summary.test.js
node tests/v0_14b_2_explore_river_proto_audit_usability.test.js
```

If time permits also run:

```bash
node tests/json-export.test.js
node tests/v0_13_1_2_place_memory_semantics_river_village_guard.test.js
```

---

## Checkpoints

### Checkpoint 1: Plan

Report:

```text
files to touch
functions to add/change
tests to add
confirmation no bottom simulation rules will change
```

### Checkpoint 2: Explore Collision + Visual Blockers

Implement collision/visual alignment and mountain/BLOCK styling.

Report:

```text
what blocks Explore movement
what visual classes mark blockers
how sliding behavior is preserved
```

### Checkpoint 3: River Generation

Add generated river logic to new/random worlds and keep map seed preset behavior.

Report:

```text
where generated rivers are created
how rivers avoid/handle mountains
how exports include them
```

### Checkpoint 4: Lightweight Proto-Culture Export

Add UI button and export helper.

Report:

```text
button id/location
export helper name
export shape
```

### Checkpoint 5: Multi-Seed Audit Helper

Add helper/test hook for running multiple seeds and returning summaries.

Report:

```text
helper name
input shape
output shape
state isolation/restoration approach
```

### Checkpoint 6: Tests + Docs

Add tests and documentation updates.

Report:

```text
tests run
docs updated
known simplifications
manual verification not performed, if any
```

---

## Acceptance Criteria

The task is complete only if:

```text
1. Explore movement no longer collides with visually passable cells in tested cases.
2. All actual Explore blockers are visually clear.
3. BLOCK/mountain cells are clearly black/dark in Explore and Macro views.
4. Generated/random worlds include river map features.
5. Rivers remain map features, not terrain.
6. River blockers still work.
7. Recording panel has a lightweight proto-culture summary export.
8. Lightweight proto-culture export excludes frames/keyframes/full map rows.
9. Multi-seed proto-culture summary audit helper exists and is tested.
10. Existing map seed / river / proto-culture tests still pass.
11. No H/B/S ecology rules, proto-culture scoring, or proto-culture gates changed.
12. Docs and rules mention V0.14B.2.
```

---

## Final Report Format

Report:

```text
Summary
Files changed
How to test in browser
Automated tests run
Observer-only / no bottom-rule-change confirmation
Known simplifications
Next recommended check
```
