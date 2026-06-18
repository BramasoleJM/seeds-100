# CODEX V0.14A.1 Semantic Place Tuning Task

## Summary

Implement a narrow V0.14A.1 tuning patch for the observer-only Semantic Place Layer.

Recent export review showed V0.14A is working, but three readability issues remain:

```text
1. POIs are too easily classified as contested_poi.
2. Human place memory can lose polity / lineage identity after the live anchor changes.
3. Ordinary Human villages often remain placeArchetype = ordinary_place, which is too weak for player memory.
```

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.14A.1_SEMANTIC_PLACE_TUNING
```

This patch is observer-only. It must not change H/B/S ecology, movement, reproduction, conflict, terrain rewrite, fertility, POI effects, river blocking, tick order, grid size, terrain types, unit types, or player movement.

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
new gameplay buildings
save/load
new terrain types
new unit types
multi-screen map propagation
external dependencies
large refactor or file split
```

Do not make semantic traits, archetypes, or remembered identity affect simulation behavior.

## Problem 1: contested_poi Is Too Broad

Observed issue:

```text
Spring with spring_fed + beast_habitat + fertility_recovering becomes contested_poi.
Great Forest with great_forest_nearby + beast_habitat + wild_recovering becomes contested_poi.
```

This is too aggressive. Beast pressure around Spring / Great Forest can be normal ecology, not necessarily contest.

Required behavior:

```text
contested_poi should require real conflict/corruption signals.
Normal beast habitat near Spring or Great Forest should prefer fertile_refuge, beast_range, or forest-associated interpretation instead of contested_poi.
```

Implementation guidance:

Change `derivePlaceArchetype(...)` so `contested_poi` requires at least one strong contest signal:

```text
mixed_pressure
mark_corroded
spirit_pressure
spirit_scarred
pressured_polity
field_declining around Human/Monument context
placeState.status === "contested" or "corrupted"
```

Do not let `beast_pressure` alone make a POI contested.

Recommended priority adjustment:

```text
For POI:
  if strong corruption/conflict -> contested_poi
  else if spring_fed + fertility_recovering and not spirit/beast conflict -> fertile_refuge
  else if great_forest_nearby + beast_habitat -> beast_range or forest_edge-style interpretation
```

Do not add new POI mechanics.

## Problem 2: Human Place Memory Loses Previous Identity

Observed issue:

Some inspected Human anchors later show:

```js
humanMemory.polity.id === null
humanMemory.lineage.id === null
```

even though the anchor previously belonged to a polity / lineage.

This may be valid for current ownership, but place memory should retain what the player already learned.

Required behavior:

```text
PlaceMemoryAnchor should retain compact last-known Human identity for Human-related places.
If currentSnapshot.humanMemory has polity / lineage identity, store it on the anchor.
If a later snapshot loses current identity, expose remembered identity in the snapshot / llmContext without pretending it is current ownership.
```

Add a compact observer-only field:

```js
rememberedHumanIdentity: {
  polityId,
  polityState,
  lineageId,
  rootPolityId,
  rootLineageId,
  polityAncestryIds,
  lineageAncestryIds,
  rememberedAtTick,
  source
}
```

Where to attach:

```text
PlaceMemoryAnchor.rememberedHumanIdentity
PlaceSnapshot.rememberedHumanIdentity, only when available
computePlaceChange(...).llmContext.rememberedHumanIdentity
recording placeMemory export through existing anchor export
```

Rules:

```text
Do not overwrite remembered identity with null.
Do not use remembered identity to mutate Human polity / lineage systems.
Do not call remembered identity current ownership.
If current identity exists, traits can use current identity.
If only remembered identity exists, traits may include inherited_memory or collapsed_memory, but should not imply current polity_owned unless current ownership exists.
```

Player-facing text:

```text
Keep compact.
Example: "Remembered polity: human_polity_002."
Only add this if it is easy and does not make the panel noisy.
```

## Problem 3: Ordinary Human Villages Need A Stronger Archetype

Observed issue:

Many `H village` snapshots are:

```js
placeArchetype: "ordinary_place"
semanticTraits: ["human_settled", "polity_owned", "lineage_continuity", ...]
```

This makes common Human settlements less memorable than they should be.

Required behavior:

Add one new archetype:

```text
settled_village
```

Use it for:

```text
human_settled + (polity_owned OR lineage_continuity)
```

when a higher priority archetype does not apply.

Priority should be below:

```text
pressured_seat
haunted_remnant
old_seat
seatless_polity_center
river_village
forest_edge_settlement
frontier_outpost
contested_poi
spirit_scar
```

but above:

```text
beast_range
river_crossing
fertile_refuge
ordinary_place
```

Update:

```text
PLACE_ARCHETYPES
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/SEMANTIC_TRAITS.md if needed
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
tests
```

## Tests

Add or update:

```text
tests/v0_14a_semantic_place_layer.test.js
```

or add a new focused test:

```text
tests/v0_14a_1_semantic_place_tuning.test.js
```

Required assertions:

1. Spring with `spring_fed`, `fertility_recovering`, `beast_habitat`, but no `mixed_pressure`, `mark_corroded`, or `spirit_pressure` is not `contested_poi`.

Expected:

```text
placeArchetype should be fertile_refuge or beast_range, but not contested_poi.
```

2. Great Forest with `great_forest_nearby` + `beast_habitat` + `wild_recovering`, without corruption/conflict, is not `contested_poi`.

Expected:

```text
placeArchetype should be beast_range or another non-contested ecology archetype.
```

3. POI with `mark_corroded` or `spirit_pressure` can still become `contested_poi`.

4. Human village with `human_settled` + `polity_owned` / `lineage_continuity` becomes:

```text
settled_village
```

unless a higher priority archetype applies.

5. PlaceMemoryAnchor preserves remembered Human identity:

```text
Inspect Human village with polity/lineage.
Resample same anchor with current identity absent.
Anchor still has rememberedHumanIdentity.
Snapshot / llmContext can expose rememberedHumanIdentity.
```

6. rememberedHumanIdentity does not create false current ownership:

```text
If current humanMemory.polity.id is null but rememberedHumanIdentity exists,
semanticTraits should not add polity_owned solely from remembered identity.
```

7. Export remains JSON serializable.

Run:

```text
node --check sim.js
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_13_1_map_seed_place_memory_wake_report.test.js
node tests/v0_13_1_2_place_memory_semantics_river_village_guard.test.js
node tests/v0_14a_semantic_place_layer.test.js
node tests/v0_14a_1_semantic_place_tuning.test.js
```

If no new test file is added, explain why and ensure V0.14A tests cover all above assertions.

## Manual QA

Recommended manual check:

```text
1. Inspect Spring and Great Forest in Explore View.
2. Confirm normal beast/wild influence does not label them contested unless mark/spirit/mixed conflict is present.
3. Inspect a Human village and check archetype is settled_village unless a stronger archetype applies.
4. Sleep/wake once and export recording JSON.
5. Confirm rememberedHumanIdentity exists when a Human place loses current identity.
```

## Documentation

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with a V0.14A.1 note:

```text
V0.14A.1 tunes observer-only semantic archetypes.
contested_poi now requires stronger conflict/corruption signals.
Human places can retain rememberedHumanIdentity without claiming current ownership.
settled_village is added as a common Human place archetype.
```

Update `README.md` and `Docs/Architecture/PLACE_ARCHETYPES.md`.

## Acceptance Criteria

Done only if:

```text
Normal Spring / Great Forest ecology is not overclassified as contested_poi.
Corrupted / mixed / spirit-pressured POIs can still be contested_poi.
Common Human villages can become settled_village.
rememberedHumanIdentity persists compactly and does not affect simulation.
No bottom-layer simulation behavior changes.
All required tests pass.
```

## Executor Report

Report:

```text
Summary
Files changed
Verification commands and results
Observer-only safety check
New / changed fields
Known limitations
Manual QA performed or recommended
```

