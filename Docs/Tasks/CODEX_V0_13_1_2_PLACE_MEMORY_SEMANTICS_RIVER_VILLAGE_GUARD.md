# CODEX V0.13.1.2 Place Memory Semantics + River Village Guard

## Summary

Implement a focused V0.13.1.2 patch for the player-facing place memory layer.

Observed problems from playtest:

```text
Human villages can appear on river cells.
Place / POI inspection text often reports low-value "changed little" information.
Human village / seat / polity memory is not yet structured enough for the player to remember lineage continuity.
Wake reports and repeated interactions should prioritize meaningful changes, not unchanged status.
```

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.13.1.2_PLACE_MEMORY_SEMANTICS_RIVER_VILLAGE_GUARD
```

This patch is observer / memory / validation focused. Do not change H/B/S movement, lifecycle, conflict, conversion, reproduction, terrain rewrite, fertility balance, POI ecology effects, grid size, terrain types, unit types, Explore movement, or map seed editor behavior except where needed to prevent Human village anchors from living on rivers.

## Hard Scope

Do implement:

```text
Human village anchors must not spawn, drift, reuse, or remain active on river cells.
Place memory snapshots gain structured placeState and humanMemory data.
Place changes gain structured category / subject / direction / intensity / visibleToPlayer data.
Human village / seat / outpost / remnant inspection prioritizes polity and lineage continuity.
Repeated interactions and wake reports suppress "no significant change" player text.
Numeric deltas remain exported for future LLM narration.
Tests for river village guard, structured human memory, structured place changes, and suppressed unchanged text.
```

Do not implement:

```text
new POI types
dynamic POIs
new story content
specific race names
quests
NPCs
resource economy
new map size
multi-screen Zelda map
LLM calls
external dependencies
large UI redesign
```

## Problem 1: Human Village Can Appear On River

Root cause:

```js
function isValidHumanVillageCell(source, x, y) {
  if (isBlockedForHumanSeat(source, x, y)) return false;
  return source[y][x].terrain === TERRAIN.FIELD;
}
```

This excludes BLOCK / hard seat blockers but does not exclude `isRiverCell(x, y)`.

Required behavior:

```text
Human village anchors cannot be created on river cells.
Human village anchors cannot drift onto river cells during reuse.
Existing active villages found on river cells must be invalidated rather than preserved by village grace logic.
River cells may still visually pass through Human FIELD underneath, but they cannot host a current Human village.
```

Implementation guidance:

```js
function isValidHumanVillageCell(source, x, y) {
  if (!inBounds(x, y)) return false;
  if (isRiverCell(x, y)) return false;
  if (isBlockedForHumanSeat(source, x, y)) return false;
  return source[y][x].terrain === TERRAIN.FIELD;
}
```

Also audit `updateHumanVillages()` and any village reuse / grace / carry-forward paths:

```text
If a previous village is now on a river, do not keep it active.
If a candidate best cell is on a river, discard it.
If a reused village would drift to a river, keep searching or fade/remove it.
```

Do not block Human FIELD itself on river because river is a map feature, not a terrain type. The restriction is about village anchors only.

## Problem 2: Place State Needs A Stable Structure

Add a structured `placeState` object to place snapshots.

Shape:

```js
placeState: {
  status,
  trend,
  dominantPressure,
  intensity,
  confidence,
  visible
}
```

Allowed values:

```js
status =
  "emerging"
| "active"
| "expanding"
| "shrinking"
| "contested"
| "corrupted"
| "recovering"
| "abandoned"
| "remnant"
| "stable";

trend =
  "growing"
| "declining"
| "holding"
| "unstable"
| "silent";

dominantPressure =
  "human"
| "beast"
| "spirit"
| "rot"
| "water"
| "forest"
| "mixed"
| "none";

intensity =
  "low"
| "medium"
| "high";
```

Implementation guidance:

Use existing local snapshot metrics only:

```text
terrain.FIELD / WILD / MARK counts
H / B / S unit counts
fertility average
river cell count
POI type
Human settlement metadata when available
```

Keep the heuristic simple:

```text
High MARK or rot_source nearby -> corrupted / rot or spirit pressure.
Human settlement with FIELD and Human units -> active / human pressure.
Human settlement with falling area/support -> shrinking / declining.
Human settlement with growing area/support -> expanding / growing.
Mixed FIELD + MARK or Human + Spirit -> contested / mixed.
Spring / river with fertility recovery -> recovering / water.
Great Forest / WILD + Beast -> active or expanding / forest or beast.
No meaningful signal -> stable / silent / none.
```

This is an interpretation layer only. It must not feed back into simulation rules.

## Problem 3: Human Memory Must Be First-Class

Add a compact `humanMemory` object to place snapshots for Human-related anchors.

Shape:

```js
humanMemory: {
  settlement: {
    id,
    kind,
    state,
    foundedTick,
    lastActiveTick,
    support,
    area,
    connectedToSeat,
    distanceToSeat
  },
  polity: {
    id,
    displayName,
    state,
    rootPolityId,
    parentPolityId,
    ancestryIds,
    branchDepth,
    foundedTick,
    collapsedTick
  },
  lineage: {
    id,
    rootLineageId,
    parentLineageId,
    ancestryIds,
    branchDepth,
    firstSeenTick,
    lastSeenTick
  },
  continuity: {
    previousPlaceId,
    successorPlaceId,
    transferReason
  }
}
```

Allowed settlement kinds:

```js
"seat" | "village" | "outpost" | "old_seat" | "remnant" | "domain"
```

Allowed settlement states:

```js
"active" | "lost" | "abandoned" | "absorbed" | "remnant" | "fading"
```

Allowed continuity transfer reasons:

```js
"migration"
| "seat_moved"
| "polity_split"
| "collapse"
| "absorbed"
| "recovered"
| "unknown";
```

Implementation guidance:

Source this from existing Human polity / lineage / village / outpost objects. Do not invent new ancestry mechanics.

At minimum:

```text
Human village inspection must include polityId, lineageId, polity ancestry, lineage ancestry, firstSeenTick, lastSeenTick, area, support, and state.
Human seat inspection must include polityId, lineageId or sourceId when available, rootPolityId, ancestryIds, current / old seat state, and continuity reason when available.
Human outpost / remnant inspection must include current owner or previous owner when available.
```

Keep raw ids visible for now. Do not create fantasy names yet.

## Problem 4: Structured Change Records

Replace purely text-first change reporting with structured change records.

Shape:

```js
placeChange: {
  visibleToPlayer,
  category,
  subject,
  direction,
  intensity,
  fromTick,
  toTick,
  metricsDelta,
  playerText,
  llmContext
}
```

Allowed categories:

```js
"human_expanded"
| "human_shrank"
| "village_emerged"
| "village_lost"
| "seat_moved"
| "polity_split"
| "polity_collapsed"
| "polity_recovered"
| "ownership_changed"
| "rot_spread"
| "rot_receded"
| "forest_expanded"
| "forest_thinned"
| "water_recovered_land"
| "poi_contested"
| "no_significant_change";
```

Allowed subjects:

```js
"human" | "polity" | "lineage" | "village" | "seat" | "poi" | "rot" | "forest" | "water" | "mixed";
```

Allowed directions:

```js
"growing" | "declining" | "holding" | "unstable" | "moved" | "split" | "collapsed" | "recovered" | "none";
```

Required rule:

```js
if (category === "no_significant_change") {
  visibleToPlayer = false;
  playerText = [];
}
```

Use thresholds so tiny noise does not produce player text:

```text
terrain cell delta must be at least 2 cells to matter.
unit delta must be at least 1 unit to matter.
fertility average delta must be at least 0.25 to matter.
settlement area/support deltas should use existing village/polity support values when available.
ownership, state, lineage, polity, or seat changes are always meaningful.
```

Metrics must remain numeric:

```js
metricsDelta: {
  fieldCellsDelta,
  wildCellsDelta,
  markCellsDelta,
  humanUnitsDelta,
  beastUnitsDelta,
  spiritUnitsDelta,
  fertilityAverageDelta,
  settlementAreaDelta,
  settlementSupportDelta,
  polityAreaDelta,
  distanceToSeatDelta,
  connectedToSeatChanged
}
```

`llmContext` should include the structured category, subject, direction, metricsDelta, placeState, and humanMemory. It must not call an LLM.

## Problem 5: Player Text Should Say What Matters

Update `formatPlaceMemoryInfo()` and clickable tag info where place memory is available.

Player-facing priority:

```text
1. What this place is.
2. For Human places: which polity / lineage it belongs to.
3. For Human places: whether that polity / lineage continues from an older branch.
4. Meaningful change since last inspection or sleep.
5. Current pressure / risk if obvious.
```

Examples:

```text
H Village
Belongs to human_polity_002.
Lineage: human_lineage_002, rooted in human_lineage_001.
This village has expanded since your last visit.

H Seat
Seat of human_polity_003.
This polity split from human_polity_001.
Its local field has shrunk under mark pressure.

Rot Source
The source remains corrupted.
Rot pressure has spread around this place.
```

Do not display:

```text
This place changed little while you were away.
No significant change.
Unchanged.
```

If there is no meaningful change, show only current identity / ownership / state.

## Problem 6: Wake Report Should Suppress Unchanged Places

Current behavior may include unchanged / low-value entries.

Required behavior:

```text
Wake report only lists inspected places with visibleToPlayer meaningful changes.
If inspected places had no meaningful changes, use one concise fallback:
  "No watched place showed a meaningful change while you slept."
```

Do not list every unchanged place.

Keep unchanged records internally for export / future LLM context.

## JSON / Export Requirements

Snapshot and recording exports should include compact structured place memory:

```text
placeMemory anchors include currentSnapshot.placeState.
placeMemory anchors include currentSnapshot.humanMemory when relevant.
changeSinceLastInspect and changeSinceLastSleep include structured placeChange fields.
metricsDelta remains numeric.
llmContext remains compact and deterministic.
```

Macro timeline frame top-level keys must remain stable.

If macroSummary already includes place memory summaries, add only compact fields:

```js
{
  placeState: { status, trend, dominantPressure, intensity },
  humanMemory: {
    settlementKind,
    settlementState,
    polityId,
    lineageId,
    rootPolityId,
    rootLineageId,
    polityAncestryIds,
    lineageAncestryIds
  }
}
```

Do not export large cell arrays.

## Tests

Add:

```text
tests/v0_13_1_2_place_memory_semantics_river_village_guard.test.js
```

Required tests:

1. Human village cannot be valid on river.

Expected:

```text
FIELD + river cell returns false from isValidHumanVillageCell or exported test helper.
```

2. Human village reuse / grace does not keep active village on river.

Expected:

```text
an existing village at a river cell is not active after updateHumanVillages.
```

3. Place snapshot includes structured placeState.

Expected:

```text
snapshotPlace(...).placeState.status is one of the allowed values.
snapshotPlace(...).placeState.dominantPressure is one of the allowed values.
```

4. Human village snapshot includes structured humanMemory.

Expected:

```text
humanMemory.settlement.kind === "village"
humanMemory.polity.id is present when village has polityId
humanMemory.lineage.id is present when village has lineageId
ancestry arrays are arrays
```

5. Meaningless change is suppressed.

Expected:

```text
computePlaceChange(anchor, sameSnapshot, sameSnapshot).category === "no_significant_change"
visibleToPlayer === false
playerText.length === 0
```

6. Meaningful Human expansion produces structured visible change.

Expected:

```text
fieldCellsDelta >= threshold or settlementAreaDelta >= threshold
category is human_expanded or equivalent Human category
visibleToPlayer === true
playerText has at least one line
```

7. Wake report omits unchanged watched places.

Expected:

```text
unchanged anchor is not listed individually
fallback appears only if no watched place changed meaningfully
```

8. JSON export includes compact structured memory and does not break existing keys.

Expected:

```text
recording placeMemory anchors include placeState.
Human anchors include compact humanMemory.
Existing recording / macro timeline top-level frame keys remain stable.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_13_1_map_seed_place_memory_wake_report.test.js
node tests/v0_13_1_1_map_seed_editor_usability_patch.test.js
node tests/v0_13_1_2_place_memory_semantics_river_village_guard.test.js
```

## Manual QA

Run the app and verify:

```text
1. Generate or paint a river through FIELD.
2. Run the world long enough for Human village tags to appear.
3. Human village tags do not appear on river cells.
4. Inspect a Human village in Explore View.
5. The panel tells which polity / lineage owns it.
6. Inspect the same unchanged place twice.
7. The panel does not say "changed little", "unchanged", or "no significant change".
8. Sleep after watching a place.
9. Wake report lists only meaningful watched changes.
10. Export recording JSON and confirm placeMemory has placeState and humanMemory.
```

## Files To Touch

Expected:

```text
sim.js
tests/v0_13_1_2_place_memory_semantics_river_village_guard.test.js
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
```

Touch `index.html` or `style.css` only if existing info panel rendering cannot display the updated text without a tiny adjustment.

## Documentation

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with a concise V0.13.1.2 section:

```text
Human village anchors cannot occupy river cells.
Place memory now stores structured placeState.
Human-related place memory stores compact polity / lineage continuity.
No-significant-change records are retained internally but hidden from player-facing text.
```

Update the version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.13.1.2_PLACE_MEMORY_SEMANTICS_RIVER_VILLAGE_GUARD
```

Update `README.md` with any simplification:

```text
Place state and Human memory are deterministic heuristics for readability.
They do not change simulation rules.
```

## Executor Report

After implementation, report:

```text
files changed
how to run
which rule sections are implemented
known simplifications or deviations
test results
```

