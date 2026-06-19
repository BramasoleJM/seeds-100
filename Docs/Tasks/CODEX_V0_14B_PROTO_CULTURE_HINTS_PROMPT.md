# CODEX V0.14B Observer-Only Proto-Culture Hints Task

## Executor instruction

Use this document as the full goal brief.

Work checkpoint by checkpoint. After each checkpoint, report:

```text
checkpoint completed
files changed
what changed
tests/checks run, if any
known simplifications or deviations
```

Before editing implementation code, read the required files listed below, especially `TRI_SPECIES_WORLD_SIM_RULES.md`.

Keep the implementation local and minimal. Do not add new gameplay systems, new lore, new terrain, new units, new dependencies, or broad refactors.

Main work ownership:

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
sim.js
tests/v0_14b_proto_culture_hints.test.js
```

You are not alone in the codebase. Do not revert unrelated changes made by others; adjust to the current files.

---

# Original Goal Brief: V0.14B Observer-Only Proto-Culture Hints

## Goal summary

Implement **V0.14B Observer-Only Proto-Culture Hints** plus **V0.14A.2 documentation hygiene**.

This stage should extend the existing V0.14A Semantic Place Layer with compact, deterministic, observer-only `protoCultureHints` and anchor-level `protoCultureMemory`.

This is **not** a civilization system.
This is **not** AI.
This is **not** tarot.
This is **not** a story-event system.
This is only an interpretation layer over existing Place Memory, Semantic Traits, Place Archetypes, Human Memory, and Remembered Human Identity.

The purpose is to let inspected Human-related places accumulate early candidate signals such as:

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

These signals should prepare the project for future civilization-candidate work, but V0.14B must not implement civilizations or change gameplay.

---

## Required first step

Before editing, read:

```text
AGENTS.md
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/ARCHITECTURE_MAP.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/MACRO_PATTERNS.md
sim.js
tests/v0_14a_semantic_place_layer.test.js
tests/v0_14a_1_semantic_place_tuning.test.js
```

Then output a short implementation plan listing the exact files you expect to touch.

Do not start coding until the plan is consistent with the constraints below.

---

## Hard constraints

Do **not** add or implement:

```text
tarot mechanics
AI calls
civilization modules
civilization gameplay
story events
myth events
resources
resource economy
buildings
village buildings
NPCs
quests
save/load
network calls
external libraries
new terrain types
new unit types
new bottom-layer species
multi-screen map
screen-to-screen propagation
```

Do **not** change:

```text
H/B/S movement
lifecycle
natural death
conflict
conversion
terrain rewrite
reproduction
fertility rules
POI effects
river blockers
Explore movement
terrain decay
tick order
terrain vocabulary
unit vocabulary
map seed behavior
bottom-layer simulation balance
```

Do **not** perform broad file splitting in this task. Keep the implementation local and minimal. The project currently keeps most runtime logic in `sim.js`; this task may add small helper functions there but should not restructure the application.

---

## Stage naming

Use these names in docs and README/rules updates:

```text
V0.14A.2 Docs Hygiene
V0.14B Observer-Only Proto-Culture Hints
TRI_SPECIES_WORLD_SIM_V0.14B_PROTO_CULTURE_HINTS
```

---

# Part A: V0.14A.2 documentation hygiene

## Problem

`Docs/README_DOCS.md` is outdated and still points to old V0.9.3 / V0.10 planning direction. The project is currently at V0.14A / V0.14A.1 and should now point to V0.14B.

## Required changes

### 1. Update `Docs/README_DOCS.md`

Update the current-stage and active-docs sections so they point to the current architecture docs and V0.14B direction.

The Active Docs section should include:

```text
Docs/Architecture/ARCHITECTURE_MAP.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/MACRO_PATTERNS.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
```

The current completed stage should be:

```text
TRI_SPECIES_WORLD_SIM_V0.14A.1_SEMANTIC_PLACE_TUNING
```

The recommended next/current stage should be:

```text
V0.14B Observer-Only Proto-Culture Hints
```

Make clear that V0.14B is observer-only and is not a civilization system.

### 2. Update `AGENTS.md`

Keep the existing rule-first constraints, but add a clear observer-only interpretation policy.

Add text equivalent to:

```text
Observer-only interpretation layers are allowed only when explicitly requested.

Observer-only fields may include semanticTraits, placeArchetype, interpretationHints,
rememberedHumanIdentity, protoCultureHints, and protoCultureMemory.

These fields must not change H/B/S ecology, tick order, movement, lifecycle,
conflict, conversion, terrain rewrite, reproduction, fertility, POI effects,
river blockers, terrain types, unit types, terrain decay, or Explore movement.

Proto-culture hints are not civilizations, factions, AI, resources, buildings,
NPCs, story events, myth events, quests, or tarot mechanics.
```

This is important because the term `protoCultureHints` might otherwise cause future tasks to drift into real civilization or story systems.

---

# Part B: V0.14B Observer-Only Proto-Culture Hints

## Concept

V0.14A allows inspected places to expose:

```text
semanticTraits
placeArchetype
interpretationHints
rememberedHumanIdentity, when applicable
```

V0.14B should derive one more compact layer:

```text
protoCultureHints
```

These hints describe **possible long-term cultural tendencies** of inspected Human-related places.

Examples:

```text
river_bound      A Human place is repeatedly tied to river adjacency or river-village identity.
memory_bound     A Human place is tied to lineage, old seats, remnants, or inherited memory.
scar_bound       A Human place is tied to Spirit/MARK/rot pressure.
forest_edge      A Human place sits at the edge of WILD, Great Forest, or Beast habitat.
```

Again: these are not civilizations. They are candidate signals for future interpretation.

---

## Data shape: `protoCultureHints`

Each `PlaceSnapshot` should include:

```js
protoCultureHints: []
```

For Human-related places with signals, each hint should have this compact shape:

```js
{
  id: "river_bound",
  score: 0.82,
  strength: "strong",
  sourceTraits: ["river_adjacent", "human_settled", "polity_owned"],
  sourceArchetype: "river_village",
  reason: "Human place is settled beside local river signals."
}
```

Field rules:

```text
id:
  Stable string id. Must be one of the V0.14B hint ids.

score:
  Number from 0 to 1. Round to two decimals.

strength:
  One of: weak, emerging, strong.

sourceTraits:
  Compact list of semantic trait ids that contributed to this hint.
  Cap length to avoid noisy exports.

sourceArchetype:
  The current snapshot placeArchetype.

reason:
  Short deterministic English explanation.
  Do not write lore or story prose.
```

Suggested strength thresholds:

```text
score < 0.35       weak
0.35 <= score < 0.65 emerging
score >= 0.65      strong
```

If there are no valid hints:

```js
protoCultureHints: []
```

---

## Human-related place gate

Do not generate proto-culture hints for every place.

Only Human-related snapshots may generate `protoCultureHints`.

A snapshot is Human-related if any of these are true:

```text
semanticTraits includes one or more of:
  human_settled
  human_seat
  human_old_seat
  human_outpost
  human_remnant
  human_domain
  polity_owned
  lineage_continuity

or snapshot has:
  humanMemory
  rememberedHumanIdentity
```

If the snapshot is not Human-related:

```js
protoCultureHints: []
```

This means ordinary Spring, Great Forest, Beast range, River, Rot Source, or Spirit scar places should not generate culture hints unless they are connected to a Human place through current `humanMemory`, `rememberedHumanIdentity`, or Human semantic traits.

This gate is critical. It prevents POIs and Beast/Spirit places from being accidentally treated as culture candidates.

---

# V0.14B hint ids

Use only the following hint ids in this task.

Do not invent additional hint ids unless a test failure shows that one of these cannot cover the current V0.14B scope.

---

## 1. `river_bound`

Meaning:

A Human-related place is tied to river adjacency, a river crossing, or river-village identity.

Signals:

```text
Human-related place
+
river_adjacent / river_center / river_crossing
or placeArchetype = river_village
```

Bonus signals:

```text
polity_owned
lineage_continuity
placeArchetype = settled_village
```

Does not imply:

```text
river civilization
trade
boats
water management
resource economy
```

Reason examples:

```text
Human place is settled beside local river signals.
Human identity is repeatedly observed near a river feature.
```

---

## 2. `forest_edge`

Meaning:

A Human-related place exists near Great Forest, WILD recovery, or Beast habitat pressure.

Signals:

```text
Human-related place
+
great_forest_nearby
or beast_habitat
or placeArchetype = forest_edge_settlement
```

Does not imply:

```text
forest civilization
beast totem
human-beast alliance
new Beast behavior
```

Reason examples:

```text
Human place is shaped by nearby forest or WILD habitat signals.
```

---

## 3. `memory_bound`

Meaning:

A Human-related place is strongly tied to old seats, remnants, lineage continuity, inherited memory, or remembered identity.

Signals:

```text
human_old_seat
human_remnant
lineage_continuity
inherited_memory
collapsed_memory
rememberedHumanIdentity
placeArchetype = old_seat
placeArchetype = haunted_remnant
```

Does not imply:

```text
ancestor civilization
resurrection
ritual system
story event
```

Reason examples:

```text
Human identity persists through lineage, old seat, or remnant memory.
```

Important:

`rememberedHumanIdentity` must not create false current ownership. It may contribute to `memory_bound`, but it must not create `polity_owned` unless current `humanMemory.polity.id` exists.

---

## 4. `scar_bound`

Meaning:

A Human-related place overlaps or neighbors Spirit/MARK/rot pressure.

Signals:

```text
Human-related place
+
spirit_pressure
spirit_scarred
mark_corroded
rot_source_nearby
placeArchetype = haunted_remnant
placeArchetype = spirit_scar
placeArchetype = pressured_seat
```

Does not imply:

```text
undead civilization
curse system
new Spirit rules
story event
```

Reason examples:

```text
Human place is repeatedly observed with Spirit, MARK, or rot pressure.
```

---

## 5. `frontier_adapted`

Meaning:

A Human-related place is interpreted as an outpost, frontier, pressure edge, or mixed-contact zone.

Signals:

```text
human_outpost
placeArchetype = frontier_outpost
mixed_pressure
beast_pressure
spirit_pressure
pressured_polity
```

Does not imply:

```text
military civilization
combat system
defense buildings
faction AI
```

Reason examples:

```text
Human place is repeatedly observed at a pressure frontier.
```

---

## 6. `monument_centered`

Meaning:

A Human-related place has identity signals near a Monument POI.

Signals:

```text
Human-related place
+
monument_shadowed
+
one or more of:
  human_settled
  human_seat
  lineage_continuity
  polity_owned
```

Does not imply:

```text
religion system
church
priesthood
quest
story event
```

Reason examples:

```text
Human place is observed with monument memory context.
```

---

## 7. `spring_refuge`

Meaning:

A Human-related place appears supported by Spring or fertility recovery context.

Signals:

```text
Human-related place
+
spring_fed
or fertility_recovering
or placeArchetype = fertile_refuge
```

Does not imply:

```text
agriculture civilization
resource economy
water building
```

Reason examples:

```text
Human place is observed near fertility recovery or spring support.
```

---

## 8. `split_lineage`

Meaning:

A Human-related place shows split, inherited, branch, or prior identity signals.

Signals:

```text
split_polity
lineage_continuity
polity ancestry depth > 1
lineage ancestry depth > 1
rememberedHumanIdentity with prior polity or lineage
```

Does not imply:

```text
civil war
politics system
faction AI
story event
```

Reason examples:

```text
Human identity shows split or inherited polity/lineage signals.
```

---

## 9. `seatless_drift`

Meaning:

A Human-related place shows loss of center, seatless polity state, old seat drift, or recent abandonment.

Signals:

```text
seatless_polity
human_old_seat
recently_abandoned
placeArchetype = seatless_polity_center
placeArchetype = old_seat
```

Does not imply:

```text
nomadic civilization
exile story
questline
```

Reason examples:

```text
Human identity is observed without a stable current seat.
```

---

# Scoring guidance

Keep scoring deterministic and simple.

Suggested approach:

```text
Base score per hint starts at 0.
Add 0.35 for the core signal.
Add 0.15-0.25 for strong supporting traits.
Add 0.10 for matching placeArchetype.
Clamp to 1.
Round to two decimals.
```

Examples:

```text
river_bound:
  +0.45 if placeArchetype is river_village
  +0.25 if river_adjacent / river_center / river_crossing
  +0.15 if polity_owned
  +0.15 if lineage_continuity

memory_bound:
  +0.35 if human_old_seat / human_remnant
  +0.30 if rememberedHumanIdentity exists
  +0.20 if collapsed_memory / inherited_memory
  +0.15 if lineage_continuity

scar_bound:
  +0.35 if mark_corroded / spirit_scarred
  +0.25 if spirit_pressure / rot_source_nearby
  +0.15 if placeArchetype is haunted_remnant / pressured_seat
```

These exact numbers can be adjusted if tests need better stability, but keep them compact and explain any simplification in docs.

---

# Data shape: `protoCultureMemory`

Each `PlaceMemoryAnchor` may include:

```js
protoCultureMemory: {
  version: "0.14B",
  primaryHint: "river_bound",
  stableHints: ["river_bound"],
  activeHints: ["river_bound", "spring_refuge"],
  signals: {
    river_bound: {
      score: 0.78,
      samples: 3,
      firstSeenTick: 120,
      lastSeenTick: 210,
      sourceTraits: ["river_adjacent", "human_settled", "polity_owned"]
    }
  }
}
```

If an anchor has never had proto-culture signals, either omit `protoCultureMemory` or set it to an empty normalized structure. Prefer compact export shape.

## Memory update rules

Update `protoCultureMemory` only when a PlaceMemory anchor is updated through:

```text
inspectPlaceTarget
completeSleepObservation / wake observation path
```

Do not update it every tick.

Suggested memory algorithm:

```text
1. Before applying current hints, existing signal score *= 0.85.
2. For each current hint, signal score += hint.score * 0.35.
3. Clamp signal score to 0..1.
4. Round score to two decimals.
5. Increment samples when a hint appears.
6. firstSeenTick is set only once.
7. lastSeenTick updates whenever the hint appears.
8. Keep sourceTraits compact and deduplicated.
9. Drop signals with score < 0.15.
10. Keep at most 8 signals, sorted by score descending.
11. activeHints = signals with score >= 0.35.
12. stableHints = signals with score >= 0.65 and samples >= 2.
13. primaryHint = highest-score stableHint if any; otherwise highest-score activeHint; otherwise null.
```

Memory must remain observer-only. It must not change simulation, Human identity detection, semantic trait derivation, archetype priority, POI effects, or player movement.

---

# Integration points

## 1. `snapshotPlace`

Add `protoCultureHints` to the PlaceSnapshot output.

Expected flow:

```text
snapshotPlace
  -> deriveSemanticTraits
  -> derivePlaceArchetype
  -> derivePlaceInterpretationHints
  -> deriveProtoCultureHints
```

`deriveProtoCultureHints` must only read snapshot/traits/archetype/target/rememberedHumanIdentity and return data.

It must not mutate world, map features, POIs, Human memory, or PlaceMemory anchors.

## 2. `inspectPlaceTarget`

When an anchor is inspected and receives a new current snapshot:

```text
anchor.currentSnapshot = snapshot
anchor.protoCultureMemory = updateProtoCultureMemory(anchor.protoCultureMemory, snapshot.protoCultureHints, tick)
```

Do not add player-facing text solely because protoCultureMemory changed.

## 3. `completeSleepObservation`

When sleep/wake updates watched anchors, also update anchor-level protoCultureMemory using the new current snapshot.

Wake report behavior must remain sparse:

```text
If there is no meaningful visible place change, do not show a wake report entry just because protoCultureMemory updated.
```

## 4. `computePlaceChange`

Add to `llmContext`:

```js
protoCultureHints
protoCultureMemory
```

Keep existing fields:

```js
semanticTraits
placeArchetype
interpretationHints
displayName
visibleToPlayer
```

Do not force playerText to mention proto-culture hints. V0.14B is mainly export/context data.

## 5. Export

Snapshot / Recording export should include:

```text
placeMemory.anchors[n].currentSnapshot.protoCultureHints
placeMemory.anchors[n].protoCultureMemory
change.llmContext.protoCultureHints
change.llmContext.protoCultureMemory
```

Avoid large raw arrays.

---

# Suggested code helpers

Add compact pure helpers near the existing semantic place helpers in `sim.js`.

Suggested names:

```js
function isHumanRelatedPlaceSnapshot(snapshot) {}
function deriveProtoCultureHints(snapshot, semanticTraits, placeArchetype, target) {}
function normalizeProtoCultureHint(hint) {}
function updateProtoCultureMemory(memory, protoCultureHints, tick) {}
function summarizeProtoCultureMemory(memory) {}
```

Optional helper:

```js
function protoCultureStrengthForScore(score) {}
```

Test hooks should expose at least:

```js
deriveProtoCultureHintsForTest
updateProtoCultureMemoryForTest
```

If the test hook export is already crowded, still expose both if possible. The memory updater needs direct testing.

---

# Tests

Add:

```text
tests/v0_14b_proto_culture_hints.test.js
```

Use the same style as the V0.14A tests: fake DOM + `vm` load of `sim.js`.

## Test 1: river village derives `river_bound`

Create or reuse a fixture with:

```text
Human village or seat
river_adjacent
human_settled
polity_owned
lineage_continuity
placeArchetype = river_village
```

Assertions:

```js
Array.isArray(snapshot.protoCultureHints)
snapshot.protoCultureHints includes id "river_bound"
river_bound.score >= 0.6
river_bound.strength is "emerging" or "strong"
JSON.stringify(snapshot) works
```

Also assert that world counts do not change before/after deriving hints.

## Test 2: non-human places do not derive hints

Use a Beast range, Spring, Great Forest, Rot Source, or Spirit scar without Human memory / remembered identity / Human traits.

Assertions:

```js
snapshot.protoCultureHints is []
```

This is a critical gate test.

## Test 3: haunted old seat/remnant derives `memory_bound` and `scar_bound`

Create a Human old seat or remnant with:

```text
human_old_seat or human_remnant
collapsed_memory or rememberedHumanIdentity
spirit_scarred / mark_corroded / spirit_pressure
placeArchetype = haunted_remnant or old_seat
```

Assertions:

```js
protoCultureHints includes "memory_bound"
protoCultureHints includes "scar_bound"
```

Also assert:

```js
rememberedHumanIdentity must not create false current polity ownership.
```

If the snapshot only has remembered identity and no current `humanMemory.polity.id`, then `semanticTraits` must not include `polity_owned`.

## Test 4: protoCultureMemory accumulates

Inspect/update the same anchor twice with `river_bound` present.

Assertions:

```js
anchor.protoCultureMemory exists
anchor.protoCultureMemory.signals.river_bound.samples >= 2
anchor.protoCultureMemory.activeHints includes "river_bound"
anchor.protoCultureMemory.primaryHint === "river_bound"
```

If score reaches stable threshold:

```js
anchor.protoCultureMemory.stableHints includes "river_bound"
```

## Test 5: wake report remains sparse

Use unchanged snapshots in `completeSleepObservationForTest`.

Assertions:

```js
report.entries.length === 0
```

Even if protoCultureMemory internally updates, unchanged places must not produce player-visible wake report entries.

## Test 6: export contains fields

After inspecting a Human-related place, export a recording or snapshot.

Assertions:

```js
exportedAnchor.currentSnapshot.protoCultureHints exists
exportedAnchor.protoCultureMemory exists when hints exist
JSON.stringify(recording) does not throw
```

---

# Documentation updates

## 1. Add `Docs/Architecture/PROTO_CULTURE_HINTS.md`

Required sections:

```md
# Proto-Culture Hints

## Scope
Explain observer-only, not civilizations.

## Data Shape
Document protoCultureHints and protoCultureMemory.

## Human-Related Place Gate
Document which snapshots may produce hints.

## Hint IDs
Document the 9 ids and derivation signals.

## Scoring
Document deterministic score/strength rules.

## Memory
Document anchor-level accumulation rules.

## Integration
Document snapshotPlace, inspectPlaceTarget, completeSleepObservation, computePlaceChange, exports.

## Future Use
Future civilization modules may read these hints as candidate signals, but V0.14B does not implement civilization modules.
```

## 2. Update `Docs/Architecture/OBJECT_SCHEMA.md`

Add:

```text
PlaceMemoryAnchor:
  V0.14B optional field protoCultureMemory.
  Observer-only, compact, does not change simulation.

PlaceSnapshot:
  V0.14B field protoCultureHints.
  Derived from semanticTraits, placeArchetype, humanMemory, rememberedHumanIdentity.

PlaceChange:
  llmContext may include protoCultureHints and protoCultureMemory.
```

## 3. Update `Docs/Architecture/SEMANTIC_TRAITS.md`

Add note:

```text
V0.14B protoCultureHints consume semanticTraits as input but must not feed back into semanticTraits derivation.
```

Do not add many new semantic traits for V0.14B unless absolutely necessary.

## 4. Update `Docs/Architecture/PLACE_ARCHETYPES.md`

Add note:

```text
V0.14B protoCultureHints may read placeArchetype as one input signal, but V0.14B must not change archetype priority or derivation.
```

## 5. Update `Docs/Architecture/HUMAN_IDENTITY_STATES.md`

Add note:

```text
V0.14B protoCultureHints may read Human identity snapshots as interpretation input, but they must not affect lineage, polity, village, outpost, seat, old seat, remnant, or ownership detection.
```

## 6. Update `README.md`

Add V0.14B to the version split:

```text
Proto-culture hints: TRI_SPECIES_WORLD_SIM_V0.14B_PROTO_CULTURE_HINTS
```

Add a short section:

```text
V0.14B Proto-Culture Hints:

Place Memory snapshots for Human-related places can include protoCultureHints.
Place Memory anchors can accumulate protoCultureMemory.
These are deterministic observer-only candidate signals for future interpretation.
They are not civilizations, factions, AI, resources, buildings, NPCs, story events, myth events, quests, tarot mechanics, or gameplay rules.
They do not change ecology, movement, fertility, POI behavior, terrain, units, tick order, river blockers, or Explore movement.
```

## 7. Update `TRI_SPECIES_WORLD_SIM_RULES.md`

Add a V0.14B section with the same constraints:

```text
Observer-only.
PlaceMemory only.
No bottom-layer rule changes.
No civilization implementation.
```

---

# Expected files changed

Likely files:

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
sim.js
tests/v0_14b_proto_culture_hints.test.js
```

Do not touch unrelated docs or archive files unless needed for consistency.

---

# Execution checkpoints

Work in these checkpoints and report after each one.

## Checkpoint 1: Docs hygiene only

Files:

```text
Docs/README_DOCS.md
AGENTS.md
```

Do not edit `sim.js` in this checkpoint.

Report:

```text
files changed
what was updated
confirmation that no simulation code changed
```

## Checkpoint 2: Design docs

Files:

```text
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
```

Report:

```text
new doc added
existing docs updated
scope constraints captured
```

## Checkpoint 3: Code scaffold

Files:

```text
sim.js
```

Add pure helper functions and test hooks.

Do not integrate with PlaceMemory yet.

Report:

```text
helper names added
test hooks added
confirmation no world mutation occurs
```

## Checkpoint 4: PlaceSnapshot and llmContext integration

Files:

```text
sim.js
```

Add:

```text
PlaceSnapshot.protoCultureHints
PlaceChange.llmContext.protoCultureHints
PlaceChange.llmContext.protoCultureMemory, if anchor memory is available in that path
```

Report:

```text
where fields are added
how non-human gate is enforced
```

## Checkpoint 5: Anchor memory integration

Files:

```text
sim.js
```

Add:

```text
PlaceMemoryAnchor.protoCultureMemory
memory update on inspect
memory update on sleep observation
```

Ensure wake reports remain sparse.

Report:

```text
where memory is updated
why it does not affect playerText or simulation
```

## Checkpoint 6: Tests and final docs

Files:

```text
tests/v0_14b_proto_culture_hints.test.js
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
```

Run checks.

Report:

```text
tests run
node checks run
any known simplifications
```

---

# Verification commands

At minimum run:

```bash
node --check sim.js
node tests/v0_14a_semantic_place_layer.test.js
node tests/v0_14a_1_semantic_place_tuning.test.js
node tests/v0_14b_proto_culture_hints.test.js
```

If there is an existing project-wide test pattern, run the relevant subset. Do not add external dependencies.

---

# Acceptance criteria

The task is complete only if all are true:

```text
1. Docs/README_DOCS.md no longer points to V0.9.3/V0.10 as the current direction.
2. AGENTS.md clearly explains observer-only interpretation layers and protoCultureHints.
3. Docs/Architecture/PROTO_CULTURE_HINTS.md exists and documents scope, data shape, gate, hints, scoring, memory, and future use.
4. PlaceSnapshot includes protoCultureHints.
5. Human-related places can derive appropriate protoCultureHints.
6. Non-human places without Human memory/identity derive no protoCultureHints.
7. PlaceMemoryAnchor can accumulate protoCultureMemory.
8. computePlaceChange llmContext includes protoCultureHints and protoCultureMemory when available.
9. Wake reports remain sparse and do not show entries for unchanged places solely because protoCultureMemory changed.
10. Exports include protoCultureHints and protoCultureMemory compactly.
11. Existing V0.14A / V0.14A.1 tests still pass.
12. New V0.14B tests pass.
13. node --check sim.js passes.
14. No bottom-layer simulation rules changed.
15. No tarot, AI, civilization modules, story events, resources, buildings, NPCs, quests, new terrain, or new units were added.
```

---

# Final report format

When done, report:

```text
Summary:
- What V0.14B added.

Files changed:
- list files.

Observer-only confirmation:
- Confirm no H/B/S simulation rules changed.

Tests:
- list commands run and results.

Known simplifications:
- mention compact deterministic scoring, capped signals, and Human-related gate.

Next recommended stage:
- V0.14C Culture Candidate Rollup / export-only aggregation, not civilization gameplay.
```

---

# Future note, not part of this task

Do not implement this now, but V0.14B prepares for future stages:

```text
V0.14C: Roll up anchor-level protoCultureMemory into compact Human polity cultureCandidateSignals.
V0.15: Track proto-culture signal timeline: stable, rising, fading.
V0.16: Civilization candidate gates, still observer-only.
V0.17+: Carefully introduce actual civilization modules or light behavior bias.
```

V0.14B should stop at observer-only place-level proto-culture hints.
