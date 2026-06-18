# CODEX V0.14A Semantic Place Layer Task

## Summary

Implement V0.14A: an observer-only Semantic Place Layer.

This stage is not for tarot, AI, civilizations, story events, new resources, or new simulation rules. It prepares the current Place Memory layer for future world interpretation by giving inspected places a compact semantic vocabulary.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.14A_SEMANTIC_PLACE_LAYER
```

Core output:

```js
snapshotPlace(...).semanticTraits
snapshotPlace(...).placeArchetype
snapshotPlace(...).interpretationHints
computePlaceChange(...).llmContext.semanticTraits
computePlaceChange(...).llmContext.placeArchetype
computePlaceChange(...).llmContext.interpretationHints
```

Everything in this patch must be deterministic and observer-only.

## Hard Constraints

Do not implement:

```text
tarot mechanics
AI / oracle calls
civilization modules
story events
myth motifs
resources or economy
NPCs
quests
buildings as gameplay objects
save/load
new terrain types
new unit types
multi-screen map propagation
Zelda-style map expansion
combat / inventory / dialogue
external libraries
frameworks / build steps
large modular file splitting
```

Do not change bottom-layer simulation behavior:

```text
movement
lifecycle / natural death
conflict / conversion
terrain rewrite
reproduction
settler founding
fertility dynamics
terrain decay
POI effects
river blocker behavior
H/B/S role behavior
counter-cycle rules
tick order
grid size
terrain types
unit types
```

Do not make semantic traits affect gameplay.

Do not split `sim.js` in this task.

## Required Documentation

Use the existing project docs directory style. Add files under:

```text
Docs/Architecture/
```

Create:

```text
Docs/Architecture/ARCHITECTURE_MAP.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/MACRO_PATTERNS.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
```

Optional only if it stays concise:

```text
Docs/Architecture/SIMULATION_RULE_INVENTORY.md
```

Update:

```text
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
```

The docs must describe current implemented systems, not future fantasy systems.

## Documentation Requirements

### ARCHITECTURE_MAP.md

Document current layers:

```text
Core simulation layer
Map seed / map feature / POI layer
Macro analysis layer
Population evolution layer
Macro memory layer
Human lineage layer
Human polity / village / outpost layer
Semantic tag layer
Explore view layer
Place memory / sleep report layer
Export / recording / test hook layer
```

For each layer include:

```text
Purpose
Key state variables
Key functions
Inputs
Outputs
Whether it changes simulation rules
Dependencies
Safe future extension points
```

### OBJECT_SCHEMA.md

Document currently real objects only:

```text
Cell
MapSeed
MapFeature: river
POI
MacroWorld
MacroObject
PopulationShape
MacroMemory
HumanLineage
HumanOutpost
HumanPolity
HumanVillage
SemanticTag
PlaceMemory
PlaceMemoryAnchor
PlaceSnapshot
PlaceChange
PlayerObserver
RecordingFrame / MacroTimelineFrame, compact only
```

For each object:

```text
Where it lives
Who creates it
Who reads it
Whether it mutates simulation
Whether it is observer-only
Export shape / compact summary
Future extension notes
```

### SEMANTIC_TRAITS.md

Document every V0.14A trait:

```text
trait id
group
meaning
derivation signal
false-positive risk
allowed in player-facing text? yes/no
observer-only note
```

### PLACE_ARCHETYPES.md

Document:

```text
allowed archetypes
priority order
derivation rules
example trait combinations
player-facing label
future extension notes
```

### MACRO_PATTERNS.md

Document existing macro patterns from code, not new data-driven patterns.

Include at least:

```text
settlement
abandoned_settlement
beast_recovery_zone
human_beast_frontier
migration_route
spirit_outbreak
spirit_scar
former_settlement memory
```

For each:

```text
rough detector function / source
input signals
state values
confidence / visibility notes
export path
semantic tag relation
future extension notes
```

Do not convert macro detectors to data-driven tables in this task.

### HUMAN_IDENTITY_STATES.md

Document current Human identity interpretation:

```text
lineage states
polity states
seat / old seat / pressured seat
outpost states
village states
remnant behavior
split / inheritance / ancestry fields
known observer-only simplifications
ownership invariants
```

## Code Changes

Edit `sim.js`.

Add compact vocabulary constants:

```js
const SEMANTIC_TRAITS = { ... };
const PLACE_ARCHETYPES = { ... };
```

Add pure deterministic functions:

```js
function deriveSemanticTraits(snapshot, anchorOrTarget = null) { ... }
function derivePlaceArchetype(snapshot, semanticTraits = [], anchorOrTarget = null) { ... }
function derivePlaceInterpretationHints(snapshot, semanticTraits = [], placeArchetype = "ordinary_place") { ... }
```

Expose test hooks near the existing `window.__triSpeciesSim` object:

```js
deriveSemanticTraitsForTest(snapshot, anchorOrTarget)
derivePlaceArchetypeForTest(snapshot, semanticTraits, anchorOrTarget)
derivePlaceInterpretationHintsForTest(snapshot, semanticTraits, placeArchetype)
```

## Semantic Traits

Keep the vocabulary compact.

### Geography traits

```text
river_adjacent
river_center
river_crossing
spring_fed
great_forest_nearby
rot_source_nearby
monument_shadowed
mountain_blocked
```

### Human identity traits

```text
human_settled
human_seat
human_old_seat
human_outpost
human_remnant
human_domain
polity_owned
lineage_continuity
split_polity
seatless_polity
pressured_polity
```

### Ecology traits

```text
beast_pressure
beast_habitat
wild_recovering
spirit_pressure
spirit_scarred
mark_corroded
field_declining
fertility_recovering
fertility_exhausted
mixed_pressure
```

### History / observation traits

```text
recently_changed
long_stable
recently_abandoned
inherited_memory
collapsed_memory
watched_by_player
```

Trait rules:

```text
deterministic
observer-only
derived from existing snapshot / anchor / target / mapFeature / POI / humanMemory / placeState data
stable enough not to flicker every tick
cap to 8-12 traits per place snapshot
do not use random numbers
do not mutate world state
prefer snapshot-local data
```

Important:

```text
recently_changed and long_stable may require history.
If needed, derive them in computePlaceChange llmContext or anchor-aware paths, not from a standalone snapshot alone.
```

## Place Archetypes

Add one primary `placeArchetype` per place snapshot.

Allowed values:

```text
river_village
river_crossing
forest_edge_settlement
beast_range
spirit_scar
haunted_remnant
pressured_seat
old_seat
seatless_polity_center
frontier_outpost
fertile_refuge
contested_poi
ordinary_place
```

Priority order:

```text
1. pressured_seat
2. haunted_remnant
3. old_seat
4. seatless_polity_center
5. river_village
6. forest_edge_settlement
7. frontier_outpost
8. contested_poi
9. spirit_scar
10. beast_range
11. river_crossing
12. fertile_refuge
13. ordinary_place
```

Suggested rules:

```text
pressured_seat:
  human_seat + (spirit_pressure OR mark_corroded OR pressured_polity OR beast_pressure)

haunted_remnant:
  (human_remnant OR human_old_seat OR collapsed_memory) + (spirit_scarred OR mark_corroded OR spirit_pressure)

old_seat:
  human_old_seat

seatless_polity_center:
  seatless_polity OR placeState indicates seatless / declining polity center

river_village:
  river_adjacent + (human_settled OR human_seat OR human_domain)

forest_edge_settlement:
  (human_settled OR human_seat OR human_domain) + (great_forest_nearby OR beast_habitat)

frontier_outpost:
  human_outpost + (beast_pressure OR spirit_pressure OR mixed_pressure)

contested_poi:
  POI target/snapshot + (mixed_pressure OR strong competing human/beast/spirit signals nearby)

spirit_scar:
  spirit_scarred OR mark_corroded

beast_range:
  beast_habitat OR anchor type beast_range

river_crossing:
  river_center OR river_crossing

fertile_refuge:
  fertility_recovering OR spring_fed, with low spirit_pressure and low beast_pressure

ordinary_place:
  fallback
```

## Interpretation Hints

Add compact deterministic `interpretationHints`.

Shape:

```js
interpretationHints: [
  "river stabilizes nearby fertility",
  "human identity persists through lineage memory",
  "spirit scar pressure remains visible"
]
```

Rules:

```text
max 3-5 hints
no long prose
no tarot language
no civilization language
no invented named characters
no hidden lore
no AI calls
summarize only existing traits / metrics
```

Suggested hints:

```text
river stabilizes nearby fertility
spring supports local recovery
great forest anchors wild habitat
rot source keeps local corruption pressure
monument preserves human field memory
human identity persists through lineage memory
polity ownership is visible but observer-only
seat is under pressure
outpost marks distant human domain
old seat remains as memory
spirit scar pressure remains visible
beast habitat is active nearby
field material is thinning
fertility is recovering
fertility is exhausted
place changed since last inspection
place is stable since last inspection
```

## Snapshot Integration

In `snapshotPlace(...)`, attach:

```js
snapshot.semanticTraits = deriveSemanticTraits(snapshot, anchorOrTarget);
snapshot.placeArchetype = derivePlaceArchetype(snapshot, snapshot.semanticTraits, anchorOrTarget);
snapshot.interpretationHints = derivePlaceInterpretationHints(
  snapshot,
  snapshot.semanticTraits,
  snapshot.placeArchetype
);
```

If immutable style is simpler, build these before returning.

If useful signals are missing, add compact local metrics to the snapshot:

```js
nearbyPOITypes: string[]
nearbyRiverCells or riverCells already present
nearbyBlockCells if needed for mountain_blocked
```

Do not add large cell arrays.

## Place Change Integration

Extend `computePlaceChange(...).llmContext` without removing existing fields.

Required fields:

```js
llmContext: {
  anchorId,
  type,
  displayName,
  position,
  category,
  subject,
  direction,
  metricsDelta,
  placeState,
  humanMemory,
  placeArchetype,
  semanticTraits,
  interpretationHints,
  visibleToPlayer
}
```

Keep compatibility:

```text
Do not remove existing llmContext fields.
Do not rename category / subject / direction / metricsDelta.
Do not make no-significant-change player text noisy.
Wake reports must stay sparse.
```

Optional:

```text
If safe, add archetype label to compact player-facing inspect text.
Do not write long literary text.
```

## Tests

Add:

```text
tests/v0_14a_semantic_place_layer.test.js
```

Required assertions:

1. `snapshotPlace(...)` includes:

```js
semanticTraits: []
placeArchetype: "..."
interpretationHints: []
```

2. A river-adjacent Human place derives:

```text
river_adjacent
human_settled or human_domain
placeArchetype = river_village
```

3. A MARK / Spirit-heavy place derives:

```text
spirit_pressure or mark_corroded
placeArchetype = spirit_scar or haunted_remnant when applicable
```

4. A Human village / seat snapshot derives Human identity traits:

```text
polity_owned
lineage_continuity when ancestry exists
human_seat or human_settled according to target type
```

5. `computePlaceChange(...).llmContext` includes:

```text
semanticTraits
placeArchetype
interpretationHints
visibleToPlayer
displayName
```

6. `no_significant_change` remains quiet:

```text
visibleToPlayer === false
playerText is []
wake report remains sparse
```

7. Export remains JSON serializable and includes semantic fields inside placeMemory snapshots after inspection.

8. Observer-only guard:

```text
deriving traits must not mutate world cells, H/B/S counts, terrain, units, POIs, rivers, or tick.
```

Run:

```text
node --check sim.js
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_13_1_map_seed_place_memory_wake_report.test.js
node tests/v0_13_1_2_place_memory_semantics_river_village_guard.test.js
node tests/v0_14a_semantic_place_layer.test.js
```

## Manual QA

If browser access is available, perform this smoke test. If not, report these steps for the user.

```text
1. Open index.html.
2. Confirm the demo loads without syntax errors.
3. Generate or paint a seed with at least one river and one POI.
4. Switch to Explore View.
5. Move near a semantic trace or POI.
6. Press Space to inspect.
7. Confirm the inspect panel opens.
8. Sleep/wake once.
9. Confirm wake report remains sparse.
10. Export Snapshot JSON.
11. Confirm inspected place memory snapshots include semanticTraits and placeArchetype.
```

## README / Rules Update

Add a short V0.14A section:

```text
V0.14A adds observer-only semanticTraits, placeArchetype, and interpretationHints to Place Memory snapshots.
These fields are deterministic interpretations for readability and future systems.
They do not change simulation rules or gameplay behavior.
```

Update version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.14A_SEMANTIC_PLACE_LAYER
```

## Acceptance Criteria

Done only if:

```text
All required docs are added under Docs/Architecture.
snapshotPlace exports semanticTraits, placeArchetype, interpretationHints.
computePlaceChange llmContext exports semantic fields and visibleToPlayer.
No-significant-change records still produce no player noise.
Wake reports remain sparse.
No bottom-layer simulation behavior changes.
No tarot / AI / civilization / story / resource systems are added.
All listed tests pass.
```

## Executor Report

Report:

```text
Summary
Files changed
Verification commands and results
Manual QA performed or recommended
Observer-only safety check
New fields and where attached
Docs added
Known limitations
Suggested next goal, but do not start it
```

Suggested next goal:

```text
V0.14B Proto-Culture Hints
```

