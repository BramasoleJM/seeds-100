# CODEX V0.11.13 Polity Plurality Repair Task

## Summary

Implement V0.11.13 as a focused repair pass after V0.11.12.

V0.11.12 successfully removed impossible ownership states, but it over-hardened Human polity cleanup and made the visible Human political layer collapse into almost one polity. The next pass must preserve the V0.11.12 consistency invariants while restoring readable multiple Human polities when the world actually has distant Human domains, villages, or promoted outposts.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.11.13_POLITY_PLURALITY_REPAIR
```

## Observed Problem

Latest inspected exports:

```text
C:/Users/18262/Downloads/tri_species_recording_ticks_0000_0873.json
C:/Users/18262/Downloads/tri_species_macro_timeline_ticks_0000_0870.json
```

End-state evidence:

```text
endTick: 873
polities: 4
activePolities: 0
seatlessPolities: 1
collapsedPolities: 3
activeVillages: 3
currentSeatCount: 0
activeOutposts: 9
activeLineages: 1
```

All active villages at the end belong to `human_polity_001`.

The old-seat reason counts include:

```text
stale_lineage_seat: 4
polity_collapsed: 2
lost_domain: 4
rot_pressure: 2
```

Timeline evidence:

```text
tick 215:
  polities 4
  active 1
  seatless 3
  visible H outposts/villages belong to multiple polities

tick 435 onward:
  collapsed 3
  almost all current visible Human tags belong to human_polity_001

tick 870:
  active 0
  seatless 1
  collapsed 3
  no H remnant
  no inherited village
```

This matches the user's visual impression: the previous pass appears to have removed other readable Human powers.

## Suspected Root Cause

The key suspicious path is in `sim.js`:

```text
syncPolityAuthoritativeSeat()
cleanupStaleLineageSeats()
finalizeHumanPolityOwnershipInvariants()
updateHumanPolityStates()
```

`syncPolityAuthoritativeSeat()` tries to allow either:

```text
active lineage currentSeat
or promoted / promotable outpost seat
```

But `cleanupStaleLineageSeats()` later only checks:

```text
polity.currentSeat must match an active lineage.currentSeat
```

It does not accept a promoted outpost seat as a valid current polity seat. Therefore a split polity that was founded from a mature outpost can be preserved by one function and then cleared by the final hardening pass.

This creates a bad interaction:

```text
outpost-derived polity seat
-> not matching lineage.currentSeat
-> moved to oldSeats as stale_lineage_seat
-> polity becomes seatless / declining
-> collapses
-> active outposts remain in data but no longer produce a readable polity
```

This is probably why the export still has many active outposts, while most non-root polities are collapsed.

## Design Goal

Keep these V0.11.12 invariants:

```text
collapsed polity with currentSeat count = 0
visible current H tags owned by collapsed polity = 0
same lineage currentSeat owned by multiple active/non-collapsed polities = 0
```

But revise this invariant:

```text
stale polity currentSeat without matching lineage currentSeat = 0
```

Into:

```text
stale polity currentSeat without a valid authoritative source = 0
```

Where valid authoritative sources are:

```text
1. active lineage currentSeat
2. promoted / promotable outpost owned by this polity
```

Do not require every polity currentSeat to be backed by `lineage.currentSeat`.

## Required Changes

### 1. Introduce explicit polity seat source

Polity `currentSeat` should carry a compact source marker:

```text
seatSource: "lineage" | "outpost"
sourceId: lineageId or outpostId
```

Existing exports may include these compact fields, but do not export full source objects.

When syncing from lineage:

```text
seatSource = "lineage"
sourceId = lineage.id
lineageId = lineage.id
```

When creating or syncing from promoted outpost:

```text
seatSource = "outpost"
sourceId = outpost.id
lineageId = outpost.lineageId
outpostId = outpost.id
```

### 2. Replace stale lineage cleanup with authoritative seat cleanup

Rename or replace `cleanupStaleLineageSeats()` with logic equivalent to:

```text
if polity has no currentSeat:
  skip

if polity.state is collapsed:
  clear as polity_collapsed

if currentSeat.seatSource is lineage:
  valid only when matching active lineage.currentSeat

if currentSeat.seatSource is outpost:
  valid only when matching current humanOutpost:
    same outpost id
    same polity id
    state is promotable or promotedToSeat
    not fading
    location within distance <= 1

if no explicit source exists:
  infer source conservatively:
    first try lineage match
    then try promoted outpost match
  if inferred, write seatSource/sourceId

otherwise:
  move to oldSeats with reason stale_authoritative_seat
  make polity seatless or declining
```

Important: do not use `stale_lineage_seat` for outpost-source failures. Use `stale_authoritative_seat` or `stale_outpost_seat` so future debugging can distinguish cases.

### 3. Unique ownership must be source-aware

Keep uniqueness for:

```text
same lineage currentSeat
```

Also add uniqueness for:

```text
same promoted outpost sourceId
```

But do not group all polities by `lineageId` alone. A parent polity and a distant outpost-derived split polity may share lineage ancestry and still be separate readable polities if their seat sources are different.

Bad:

```text
key = currentSeat.lineageId
```

Better:

```text
key = `${seatSource}:${sourceId}`
```

Only use lineageId fallback when no sourceId can be inferred.

### 4. Keep supported seatless polities alive longer

A polity with no valid currentSeat but with active support should not collapse too quickly.

Support can be:

```text
active villages
active / promotable outposts
owned H domain tag or nearby Human shape
```

Rules:

```text
seatless + active support -> stay seatless for a longer grace window
seatless + active support should still emit limited readable tags:
  H outpost
  H village
  H domain if ownership is clear

seatless + no support -> declining -> collapsed
```

Do not create a fake `H seat` for seatless polities.

### 5. Preserve multi-polity village assignment

`updateHumanVillages()` currently tends to resolve villages through:

```text
findHumanPolityForLineage(lineage) || nearestPolityForPoint(shape.center)
```

After V0.11.12 this can pull far-separated villages back into the root polity because only the root polity remains non-collapsed.

Adjust village polity selection so distant Human shapes can attach to a supported seatless/outpost-derived polity before falling back to root lineage polity.

Suggested priority:

```text
1. nearest non-collapsed polity currentSeat within range
2. nearest active/promotable outpost-owned polity within range
3. previous village owner if still non-collapsed and still nearby
4. lineage.polityId only if spatially plausible
5. dominant/root polity fallback
```

This is observer-only. It must not affect H/B/S movement, terrain rewrite, conflict, reproduction, fertility, POI effects, or terrain decay.

## Visual / Export Expectations

After this pass, a run does not need to always keep many polities alive, but it must not erase them just because their seat came from an outpost.

Expected visible improvement:

```text
distant Human clusters may show distinct H outpost / H village / H domain ownership colors
collapsed polities still do not emit current tags
seatless polities can remain visible as outpost/village/domain ownership
the map should no longer look like all Human settlements belong to one polity by default
```

Export expectations:

```text
humanPolitySummary.polities[].currentSeat may include seatSource/sourceId
humanPolitySummary keeps active/seatless/collapsed counts
macro timeline frame top-level keys remain stable
semantic tags may include seatSource/sourceId when applicable
```

## Tests

Add:

```text
tests/v0_11_13_polity_plurality_repair.test.js
```

Required test cases:

1. A split polity with an outpost-derived currentSeat is not cleared merely because `lineage.currentSeat` is null or elsewhere.

2. Two polities with the same lineage ancestry but different authoritative seat sources can coexist:

```text
polity A: seatSource lineage, sourceId human_lineage_001
polity B: seatSource outpost, sourceId human_outpost_010
```

3. Two polities cannot own the same authoritative source:

```text
same seatSource + same sourceId -> deterministic winner, loser clears currentSeat
```

4. Collapsed polities still:

```text
export currentSeat null
emit no current H seat / H pressured seat / H village / H outpost / H domain tags
```

5. Supported seatless polity does not collapse while it still has active/promotable outposts or active villages.

6. Village assignment prefers spatially plausible outpost-derived polity over root/dominant polity.

7. Regression snapshot should include a simulated run where:

```text
activeOutposts > 0
and at least two non-collapsed polities are possible when spatially separated Human support exists
```

Do not make this test depend on randomness. Build deterministic fixture worlds.

Run regressions:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_11_10_polity_lifecycle_domain_ownership.test.js
node tests/v0_11_11_polity_ownership_consistency_remnants.test.js
node tests/v0_11_12_polity_ownership_hardening_final.test.js
node tests/v0_11_13_polity_plurality_repair.test.js
```

## Acceptance Criteria

The executor must report:

```text
collapsedWithCurrentSeat = 0
collapsedCurrentTags = 0
duplicate authoritative source owners = 0
outpost-derived valid seats incorrectly cleared = 0
```

And must inspect one exported recording/timeline after implementation.

The report should include:

```text
activePolities
seatlessPolities
collapsedPolities
activeOutposts
activeVillages by polity
oldSeat reason counts
visible H tag counts by polity
```

A successful pass should not require every run to have multiple active polities, but the deterministic fixture must prove the code can preserve multiple Human polities when valid separated supports exist.

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

This is still an observer/macro interpretation repair only.

