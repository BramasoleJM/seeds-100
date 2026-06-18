# CODEX V0.11.14 Collapsed Polity Seat Rebind Repair Task

## Summary

Implement V0.11.14 as a narrow repair pass after V0.11.13.

V0.11.13 restored some visible Human polity plurality, but a new bug remains: a stable Human lineage can establish a current seat while the polity layer binds that seat to a collapsed polity. The same tick then clears that collapsed polity again, producing repeated `polity_seat_established` events without a stable active polity on the map.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.11.14_COLLAPSED_POLITY_SEAT_REBIND_REPAIR
```

This task is observer/macro interpretation only. Do not change H/B/S movement, conflict, terrain rewrite, reproduction, POI effects, fertility, grid size, or species/terrain schemas.

## Observed Problem

Latest inspected exports:

```text
C:/Users/18262/Downloads/tri_species_recording_ticks_0000_0947.json
C:/Users/18262/Downloads/tri_species_macro_timeline_ticks_0000_0945.json
```

End-state evidence:

```text
endTick: 947
polities: 7
activePolities: 0
seatlessPolities: 3
collapsedPolities: 4
activeVillages: 6
activeOutposts: 12
activeLineages: 4
lineage currentSeatCount: 1
```

The lineage layer has an active seat:

```text
human_lineage_036
state: stable
currentSeat: { x: 5, y: 3, state: active, support: 36.2, pressure: 8 }
```

But the polity layer exports no active polity currentSeat.

Recent events repeatedly show:

```text
tick 940 polity_seat_established polityId human_polity_004 lineageId human_lineage_036 x 5 y 3
tick 945 polity_seat_established polityId human_polity_004 lineageId human_lineage_036 x 5 y 3
tick 945 polity_seat_established polityId human_polity_004 lineageId human_lineage_036 x 5 y 3
```

However `human_polity_004` is collapsed in the final summary.

This means the macro polity layer is temporarily writing a current seat onto a collapsed polity, then clearing it again during ownership cleanup. The user sees this as unstable / missing Human powers.

## Root Cause

In `sim.js`, `findHumanPolityForLineage(lineage)` returns `lineage.polityId` even if that polity is collapsed:

```js
function findHumanPolityForLineage(lineage) {
  if (!lineage) return null;
  if (lineage.polityId) {
    const owned = findHumanPolityById(lineage.polityId);
    if (owned) return owned;
  }
  ...
}
```

Then `syncPolitiesFromLineages()` uses that returned polity and writes the lineage currentSeat into it:

```js
let polity = findHumanPolityForLineage(lineage);
if (!polity) polity = createHumanPolity(lineage, { currentSeat: lineage.currentSeat });
assignLineageToPolity(lineage, polity);
polity.currentSeat = { ...lineage.currentSeat, ... };
```

If `findHumanPolityForLineage()` returns a collapsed polity, this creates an invalid transient state:

```text
collapsed polity receives currentSeat
-> event says polity_seat_established
-> cleanup clears currentSeat because polity is collapsed
-> no active polity remains
-> next macro update repeats the same event
```

## Design Goal

Collapsed polities are history. They may be referenced by ancestry, old seats, remnants, previousPolityId, and inheritedFromPolityId, but they must never be selected as the current owner for a newly active lineage seat.

When an active/stable lineage has a currentSeat and its stored `lineage.polityId` points to a collapsed polity, the system must rebind the lineage to a valid non-collapsed polity or create a successor polity.

## Required Behavior

### 1. Never return collapsed polity from lineage lookup

Update `findHumanPolityForLineage(lineage)` so it only returns non-collapsed polities.

Expected logic:

```js
function findHumanPolityForLineage(lineage) {
  if (!lineage) return null;

  if (lineage.polityId) {
    const owned = activePolityById(lineage.polityId);
    if (owned) return owned;
  }

  let cursor = lineage.parentId ? humanLineageMemory.lineages.find((item) => item.id === lineage.parentId) : null;
  while (cursor) {
    if (cursor.polityId) {
      const parentPolity = activePolityById(cursor.polityId);
      if (parentPolity) return parentPolity;
    }
    cursor = cursor.parentId ? humanLineageMemory.lineages.find((item) => item.id === cursor.parentId) : null;
  }

  return null;
}
```

If `activePolityById` is currently declared below `findHumanPolityForLineage`, either:

```text
move activePolityById above findHumanPolityForLineage
```

or use a local non-collapsed check without introducing duplicate behavior:

```js
const owned = findHumanPolityById(lineage.polityId);
if (owned && owned.state !== "collapsed") return owned;
```

Keep the code simple.

### 2. Rebind stale lineage.polityId when a collapsed owner is detected

When `syncPolitiesFromLineages()` finds a lineage currentSeat but no active polity through `findHumanPolityForLineage()`, it should not write into the collapsed polity.

It should:

```text
1. Try to find a spatially plausible non-collapsed polity near lineage.currentSeat.
2. If no plausible polity exists, create a new successor polity.
3. Assign lineage.polityId to that active/successor polity.
```

Recommended helper:

```js
function findSuccessorPolityForLineageSeat(lineage) {
  if (!lineage?.currentSeat) return null;
  const seat = lineage.currentSeat;
  let best = null;
  let bestScore = -Infinity;

  for (const polity of humanPolityMemory.polities || []) {
    if (polity.state === "collapsed") continue;
    let score = 0;
    if ((polity.lineageIds || []).includes(lineage.id)) score += 120;
    if (polity.rootLineageId === lineageRootAncestorId(lineage)) score += 60;
    if (polity.currentSeat) score += Math.max(0, 80 - distance(polity.currentSeat, seat) * 8);
    for (const outpostId of polity.outpostIds || []) {
      const outpost = (humanLineageMemory.humanOutposts || []).find((item) => item.id === outpostId);
      if (outpost) score += Math.max(0, 50 - distance(outpost, seat) * 6);
    }
    for (const village of humanPolityMemory.villages || []) {
      if (village.polityId === polity.id && village.state !== "fading" && village.state !== "remnant") {
        score += Math.max(0, 40 - distance(village, seat) * 5);
      }
    }
    if (score > bestScore) {
      best = polity;
      bestScore = score;
    }
  }

  return bestScore >= 40 ? best : null;
}
```

The exact weights may be adjusted, but the behavior must be deterministic and spatially conservative.

### 3. Create a successor polity rather than reviving a collapsed polity

If a lineage has an active currentSeat and only collapsed ancestry exists, create a new polity with ancestry reference to the collapsed polity.

Do not set the old collapsed polity back to active.

Suggested behavior:

```text
new polity state: forming or active after seat sync
splitFromPolityId: previous collapsed polity id if lineage.polityId pointed to one
rootLineageId: lineage root ancestor id
currentSeat: lineage currentSeat
seatSource: lineage
sourceId: lineage.id
lineageIds includes lineage.id
```

Add a compact event:

```text
polity_successor_founded
```

or reuse `polity_founded` if adding a new event type would create unnecessary UI work. If using `polity_founded`, include:

```text
splitFromPolityId: old collapsed polity id
lineageId: lineage.id
```

### 4. Stop repeated seat established spam

`polity_seat_established` should not repeat every macro update for the same polity/source/position.

Add a guard before emitting the event:

```js
const alreadySameSeat =
  oldSeat &&
  oldSeat.x === lineage.currentSeat.x &&
  oldSeat.y === lineage.currentSeat.y &&
  oldSeat.lineageId === lineage.id &&
  oldSeat.seatSource === "lineage" &&
  oldSeat.sourceId === lineage.id;

if (!oldSeat || !alreadySameSeat) {
  addHumanPolityEvent("polity_seat_established", polity, polity.currentSeat, { lineageId: lineage.id });
}
```

Do not emit `polity_seat_established` for a collapsed polity.

### 5. Keep collapsed tag invariant intact

Do not relax these V0.11.12/V0.11.13 invariants:

```text
collapsed polity currentSeat count = 0
current semantic tags owned by collapsed polity = 0
duplicate authoritative source owners = 0
```

The fix is to prevent collapsed polities from being selected, not to allow collapsed polities to own current seats.

## Tests

Add:

```text
tests/v0_11_14_collapsed_polity_seat_rebind_repair.test.js
```

Test 1: collapsed polity is not selected for active lineage seat.

Fixture:

```js
lineage.currentSeat = { x: 5, y: 3, state: "active", lineageId: "human_lineage_036" }
lineage.polityId = "human_polity_004"
human_polity_004.state = "collapsed"
```

Expected after `updateHumanPolityMemoryForTest(...)`:

```text
human_polity_004.currentSeat === null
lineage.polityId !== "human_polity_004"
some non-collapsed polity has currentSeat.sourceId === "human_lineage_036"
activePolities >= 1
```

Test 2: successor polity preserves ancestry reference.

Expected:

```text
new/rebound polity splitFromPolityId === "human_polity_004"
or polityAncestryIds includes "human_polity_004"
```

Do not require both if the existing ancestry implementation makes one of them cleaner.

Test 3: no repeated seat established spam.

Run two consecutive forced macro updates with the same fixture.

Expected:

```text
recentEvents.filter(e => e.type === "polity_seat_established" && e.lineageId === "human_lineage_036").length <= 1
```

If `polity_successor_founded` is added, also assert it appears at most once.

Test 4: collapsed current tag invariant remains true.

Expected:

```text
validateHumanPolityOwnershipForTest(source).collapsedWithCurrentSeat === 0
validateHumanPolityOwnershipForTest(source).collapsedCurrentTags === 0
```

Test 5: deterministic exported summary.

Expected:

```text
recording.humanPolitySummary.activePolities >= 1
recording.humanPolitySummary.polities.some(p => p.currentSeat?.sourceId === "human_lineage_036")
recording.humanPolitySummary.polities.find(p => p.id === "human_polity_004").currentSeat === null
```

Run regressions:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_11_12_polity_ownership_hardening_final.test.js
node tests/v0_11_13_polity_plurality_repair.test.js
node tests/v0_11_14_collapsed_polity_seat_rebind_repair.test.js
```

## Manual Export Review

After implementation, run/export one timeline and recording. The report must include:

```text
activePolities
seatlessPolities
collapsedPolities
lineage currentSeatCount
polity currentSeat count by state
recent polity_seat_established events
any polity_successor_founded events if added
visible H tags by polity
collapsed current tag count
```

Expected improvement:

```text
If a stable lineage has an active currentSeat, the polity layer should show a non-collapsed polity owning that seat.
Collapsed polities should remain historical only.
Repeated seat_established events for the same collapsed polity should disappear.
```

## Files To Touch

Expected:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
sim.js
tests/v0_11_14_collapsed_polity_seat_rebind_repair.test.js
```

Do not touch unrelated visual styling unless required by the test.

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

This is a targeted Human polity memory repair only.

