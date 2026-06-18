# CODEX V0.11.15 Human Village Stability Pass Task

## Summary

Implement V0.11.15 as a narrow stability pass for Human village markers.

The project should move forward after this pass. Do not keep expanding Human polity architecture. This task only reduces visible / exported village flicker so villages can become reliable memory anchors in later work.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.11.15_HUMAN_VILLAGE_STABILITY_PASS
```

## Observed Problem

Latest inspected exports:

```text
C:/Users/18262/Downloads/tri_species_recording_ticks_0000_0926.json
C:/Users/18262/Downloads/tri_species_macro_timeline_ticks_0000_0925.json
```

V0.11.14 fixed the critical collapsed-polity seat rebinding bug:

```text
lineage currentSeatCount: 1
polity currentSeat count: 1
collapsed currentSeat count: 0
collapsed current tags: 0
```

Remaining blocker before moving on:

```text
Human villages flicker too much.
recentEvents near the end are dominated by village_found / village_faded.
Village identity often looks like it is recomputed every few macro frames rather than persisting as a stable settlement.
```

This is harmful because later memory features need villages to be reliable anchors:

```text
village memorySeed
polity ownership
lineage ownership
future ancestral memory / local history hooks
```

If villages keep disappearing and being recreated, later memory features will feel fake.

## Goal

Make Human village markers stable enough to read as settlements.

Villages should:

```text
persist for a short minimum lifetime once created
snap to nearby candidate cells instead of being recreated
fade only after sustained loss of support
keep the same id and memorySeed when drifting locally
avoid repeated village_found / village_faded event spam
```

This is observer/macro interpretation only.

Do not change:

```text
H/B/S movement
conflict
terrain rewrite
reproduction
fertility
POI effects
grid size
terrain schema
unit schema
polity seat ownership rules
```

## Required Behavior

### 1. Add village stability constants

Add small constants near the existing Human polity / village constants.

Suggested defaults:

```js
const HUMAN_VILLAGE_MIN_LIFETIME_TICKS = 40;
const HUMAN_VILLAGE_MISSING_GRACE_SAMPLES = 3;
const HUMAN_VILLAGE_REUSE_DISTANCE = 4;
const HUMAN_VILLAGE_MOVE_SMOOTHING_DISTANCE = 2;
const HUMAN_VILLAGE_EVENT_COOLDOWN_TICKS = 25;
```

Keep values conservative. The village layer should become steadier, not frozen forever.

### 2. Reuse existing villages before creating new ones

In `updateHumanVillages(source, mode)`, when processing a candidate village cell, search previous villages before assigning a new id.

Match candidates in this order:

```text
1. Same polityId and same lineageId within HUMAN_VILLAGE_REUSE_DISTANCE.
2. Same polityId within HUMAN_VILLAGE_REUSE_DISTANCE.
3. Same lineageId within HUMAN_VILLAGE_MOVE_SMOOTHING_DISTANCE if previous village polity is still non-collapsed.
```

If a previous village matches:

```text
reuse id
reuse firstSeenTick
reuse memorySeed
preserve previousPolityId / inheritedFromPolityId if present
update x/y to candidate, but only if candidate is within reuse distance
reset missingSamples to 0
state becomes active / pressured based on current support
```

Do not create a new village if a previous one was reused.

### 3. Minimum lifetime before fading

When an old village is not matched this frame:

```text
age = tick - firstSeenTick
```

If:

```text
age < HUMAN_VILLAGE_MIN_LIFETIME_TICKS
and old polity is not collapsed
and the old cell / nearby cells still have Human FIELD support
```

then keep it as active or pressured with:

```text
missingSamples += 1
state: "active" or "pressured"
lastSeenTick remains previous or updates to current tick with a flag
```

Do not immediately create `village_faded`.

### 4. Grace window before fading

For villages older than the minimum lifetime:

```text
if missingSamples < HUMAN_VILLAGE_MISSING_GRACE_SAMPLES:
  keep village with state "fading"
  missingSamples += 1
else:
  remove it
```

This replaces the current one-sample fade behavior.

### 5. Event throttling

Avoid repeated `village_found` / `village_faded` spam.

For `village_found`:

```text
emit only when a truly new id is created
do not emit when reusing an old id
do not emit if an equivalent village_found for same polity + lineage + nearby position happened within HUMAN_VILLAGE_EVENT_COOLDOWN_TICKS
```

For `village_faded`:

```text
emit only when village first enters fading
do not emit every update while still fading
do not emit again if already fading
```

If there is already a generic `addHumanPolityEvent()` dedupe mechanism, use it. Do not add a large event system.

### 6. Keep village ownership conservative

Do not use this pass to invent new polity behavior.

If a previous village has a non-collapsed polity owner and remains near the candidate:

```text
prefer preserving previous polityId
```

If previous polity is collapsed:

```text
keep existing V0.11.11/V0.11.13 inheritance/remnant behavior
```

Do not revive collapsed polities.

### 7. Export compact stability fields

Village summaries may include compact stability fields:

```text
missingSamples
firstSeenTick
lastSeenTick
```

If these already exist, keep them stable.

Do not export full cell arrays.

Macro timeline frame top-level keys must remain unchanged.

## Tests

Add:

```text
tests/v0_11_15_human_village_stability_pass.test.js
```

Required deterministic tests:

1. Reuse same id when a village candidate moves locally.

Expected:

```text
same village id
same memorySeed
x/y may update within reuse distance
no second village_found event
```

2. New village id only when candidate is far away.

Expected:

```text
different id if distance > HUMAN_VILLAGE_REUSE_DISTANCE
```

3. Young village does not immediately fade.

Fixture:

```text
create village
next update has weak/missing candidate but nearby support remains
```

Expected:

```text
village remains exported
state is active / pressured / fading according to support
missingSamples increments
no immediate removal
```

4. Village fades only after grace samples.

Expected:

```text
after HUMAN_VILLAGE_MISSING_GRACE_SAMPLES missing updates, village is removed or becomes remnant according to existing collapsed-polity rules
```

5. `village_faded` event emits once.

Expected:

```text
same village id should not emit repeated village_faded events across consecutive fading frames
```

6. Collapsed polity invariants remain unchanged.

Expected:

```text
collapsed polity currentSeat count = 0
current collapsed-polity H tags = 0
duplicate authoritative source owners = 0
```

Run regressions:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_11_12_polity_ownership_hardening_final.test.js
node tests/v0_11_13_polity_plurality_repair.test.js
node tests/v0_11_14_collapsed_polity_seat_rebind_repair.test.js
node tests/v0_11_15_human_village_stability_pass.test.js
```

## Manual Export Review

After implementation, export one recording and one macro timeline.

Report:

```text
activePolities
seatlessPolities
collapsedPolities
activeVillages
village_found event count in last 100 ticks
village_faded event count in last 100 ticks
stable village ids that persist for 3+ macro frames
visible H tags by polity
collapsed current tag count
```

Expected improvement:

```text
The last 100 ticks should not be dominated by village_found / village_faded spam.
Several villages should keep the same id / memorySeed across nearby movement.
Village tags should feel more like settlements and less like recomputed labels.
```

## Files To Touch

Expected:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
sim.js
tests/v0_11_15_human_village_stability_pass.test.js
```

Do not touch unrelated UI unless a test requires it.

## Do Not Add

Do not add:

```text
new terrain
new species
new resources
buildings
NPCs
quests
story events
multi-screen map
save/load
external libraries
```

This should be the final small stability repair before continuing with the next design stage.

