# CODEX V0.11.3 Human Seat / Domain Anchors Task

## Summary

Implement V0.11.3 as a conceptual cleanup and continuity pass for Human lineage readability.

The current `H core` tag is confusing because it behaves like a moving shape-center label, while the user expects it to mean something more stable: a Human group's capital / seat / central settlement anchor.

This task should separate:

```text
H domain = the current Human-controlled / Human-shaped area.
H seat = a stable observer-only center of that Human lineage/domain.
H old seat = an abandoned previous seat.
```

This is an observer-only macro interpretation layer.

Do not add buildings, villages, NPCs, quests, economy, save/load, new terrain, new units, or gameplay effects.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.3_HUMAN_SEAT_DOMAIN_ANCHORS
```

## Problem

In V0.11.2, Semantic Tags improved label readability, but the user still cannot infer continuity.

Observed issues:

1. `H core` appears as if it should be a stable center, but it is actually derived from current population shape geometry.
2. A current shape center can move every few macro updates, making it feel unreliable.
3. The user cannot tell the full range of the Human group from a single `H core` tag.
4. Human lineage creates many short-lived descendant fragments, which do not read as a stable historical thread.
5. `H path` can collapse into repeated points instead of forming a readable route.

The deeper issue:

```text
We are tracking drifting shape centers, but the desired experience is tracking stable civilization anchors inside domains.
```

## Goal

Make Human continuity readable by introducing stable Human seats inside Human domains.

The user should be able to understand:

```text
This yellow region is the Human domain.
This tag marks the stable Human seat.
The old seat was abandoned.
The lineage continued by establishing a new seat elsewhere.
```

This should support later memory/POI work by giving Human history stronger macro anchor points.

## Concept Definitions

### Human Domain

A Human domain is the current macro population shape / FIELD-supported area associated with a Human lineage.

It is not a new terrain type.

It should derive from existing Human population shapes:

```text
populationEvolutionFrame.shapes where type === "human"
```

Human domain display can reuse existing Human population shape colors/classes. Add tags or outlines only if needed.

### Human Seat

A Human seat is a stable observer-only anchor inside a Human domain.

It represents the current center of continuity for a Human lineage.

It is not a building.
It is not a unit.
It is not terrain.
It must not affect simulation rules.

Seat should not move every macro frame.

### Old Seat

An old seat is a previous Human seat that was abandoned because it was no longer supported by its domain.

It should be remembered as a macro memory point and optionally displayed as:

```text
H old seat
```

## Data Model

Extend Human lineage memory with compact seat/domain fields.

Recommended internal shape:

```js
lineage = {
  ...
  domainId,
  domainCells,
  currentSeat: {
    x,
    y,
    establishedTick,
    lastStableTick,
    state,
    support,
    pressure
  },
  seatHistory: [
    {
      x,
      y,
      establishedTick,
      abandonedTick,
      reason
    }
  ],
  pendingSeatCandidate: {
    x,
    y,
    firstSeenTick,
    supportSamples
  }
}
```

Keep exported summary compact.

Do not export full `domainCells` in timeline frames.

Suggested compact export:

```js
humanLineage: {
  ...
  domainArea,
  currentSeat,
  oldSeatCount,
  recentSeatEvents
}
```

## Seat Establishment

Do not create or move a seat from one frame of data.

Use a candidate / promotion process.

Suggested candidate conditions:

```text
Human shape area >= meaningful area threshold.
Human shape confidence >= threshold.
Candidate point is inside core/body cells.
Nearby FIELD / Human support is high.
Nearby MARK / Spirit pressure is not high.
Candidate remains near the same location for several macro samples.
```

Recommended first-pass values:

```text
minimum domain area: 20 cells
minimum confidence: 0.55
candidate stability: 3 macro updates
same candidate distance: <= 3 cells
```

Choose simple deterministic values and document them.

## Seat Placement

Seat placement should use representative cells, not raw centroid placement.

Preferred seat point:

1. A Human shape core cell near the shape center.
2. Else a body cell near the shape center.
3. Else a FIELD-supported active cell near the shape center.
4. Else skip candidate creation.

Scoring should prefer:

```text
inside domain
near Human shape center
high FIELD support
high Human support
high fertility if available
low MARK / Spirit pressure
not BLOCK
not POI blocked center
```

Do not allow a seat on `BLOCK`, spring blocked center, rot core, or outside the Human domain.

## Seat Stability

Once established, a seat should remain fixed unless it becomes unsupported.

Seat remains valid if:

```text
it is still inside or near the lineage's Human domain,
and nearby FIELD / Human support remains above a small threshold,
and MARK / Spirit pressure is not overwhelming.
```

Use a grace window so seats do not flicker.

Suggested first-pass values:

```text
unsupported warning after 2 missed macro updates
abandon after 5 missed macro updates
```

## Seat Abandonment

Abandon current seat when one or more conditions persist across the grace window:

```text
seat is no longer inside / near the Human domain
nearby Human + FIELD support is too low
nearby MARK / Spirit pressure is high
the associated lineage collapses
```

Record an event:

```text
seat_abandoned
```

Reason examples:

```text
lost_domain
rot_pressure
low_support
lineage_collapsed
```

Keep reasons technical and compact.

## Seat Relocation

Do not move the seat directly.

If old seat is abandoned and the same lineage, or a descendant lineage, establishes a stable candidate elsewhere:

1. Keep old seat in `seatHistory`.
2. Promote new candidate to `currentSeat`.
3. Emit:

```text
seat_established
seat_relocated
```

This should create a readable historical chain:

```text
H seat -> H old seat -> H seat
```

## Rename / Retire `H core`

`H core` currently implies a stable capital-like meaning, but it is only a shape-center tag.

Update semantic tags:

```text
H domain = population/domain shape label
H seat = stable lineage seat
H old seat = abandoned seat
H origin = lineage origin
H path = seat-to-seat / origin-to-seat continuity hint
H descendant = descendant relationship where meaningful
```

Avoid showing `H core` unless it is explicitly documented as a shape/debug label.

Preferred:

```text
replace H core with H domain
add H seat
add H old seat
```

## Path / Continuity Display

Lineage continuity should use seat anchors before centroid paths.

Preferred path sources:

1. lineage origin;
2. old seats;
3. current seat;
4. descendant seat if applicable.

Only use centroidPath as a fallback.

Avoid repeated `H path` tags at the same coordinate.

Path tags should be sparse and unique:

```text
max 3 H path tags for selected lineage
minimum distance between path tags: 3 cells
```

The user should see a simple chain, not many duplicate points.

## Visual / Tag Requirements

Semantic Tags should communicate:

```text
H domain
H seat
H old seat
H origin
H path
H descendant
```

Visual priority:

```text
H seat / H old seat tags
POI tags
H origin / H path / H descendant
H domain tag
other population tags
```

`H seat` should look more important than `H domain`.

`H old seat` should look faded but still readable.

Do not flood the map.

## Export Requirements

Snapshot / Recording:

```text
humanLineageMemorySummary should include compact currentSeat / seatHistory summaries.
```

Macro Timeline:

```text
macroSummary.humanLineage should include seat counts and recent seat events.
```

If `macroSummary.semanticTags` exists, include `H seat`, `H old seat`, and `H domain` tags where applicable.

Do not change existing required top-level frame keys.

## Tests

Add:

```text
tests/v0_11_3_human_seat_domain_anchors.test.js
```

Cover:

1. A Human domain can establish a seat only after enough stable macro samples.
2. Seat stays fixed while the Human domain shifts slightly.
3. Seat is not placed on BLOCK, spring blocked center, rot core, or outside the Human domain.
4. Seat is abandoned after sustained loss of Human/FIELD support.
5. A new stable domain can establish a new seat after old seat abandonment.
6. `seatHistory` records old seats with abandonment reason.
7. Semantic tags include `H domain`, `H seat`, and `H old seat`.
8. `H core` is removed or clearly no longer used as the primary Human capital-like tag.
9. Path tags are unique/capped and prefer origin/old-seat/current-seat anchors over duplicate centroid points.
10. Snapshot / Recording / Macro Timeline exports include compact seat summary fields.
11. Existing V0.11, V0.11.1, and V0.11.2 tests still pass.

Regression run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_9_macro_memory_slow_trace.test.js
node tests/v0_10_9_1_macro_memory_tuning.test.js
node tests/v0_11_human_lineage_memory.test.js
node tests/v0_11_1_human_lineage_visibility.test.js
node tests/v0_11_2_semantic_macro_tags.test.js
node tests/v0_11_3_human_seat_domain_anchors.test.js
```

## Manual Verification

After implementation:

1. Run in Macro View for at least 700 ticks.
2. Enable Human Lineage and Semantic Tags.
3. Confirm:
   - `H domain` explains the Human-controlled region.
   - `H seat` is stable and does not drift every few macro updates.
   - `H old seat` appears after sustained collapse / corruption / loss of support.
   - `H path` connects origin / old seat / current seat instead of repeating one coordinate.
   - the user can tell why a seat exists at its location.
4. Export Recording and Macro Timeline.
5. Report:
   - number of lineages;
   - current seat count;
   - old seat count;
   - recent seat events;
   - sample semantic tags.

## Expected Visual Difference

Before:

```text
H core feels like a capital but moves like a shape-center.
The user cannot tell the Human group's range or continuity.
```

After:

```text
H domain marks the Human range.
H seat marks a stable center.
H old seat preserves abandoned centers.
H path connects meaningful anchors.
The user can read Human continuity as domain + seat history.
```

## Known Simplifications

Document in `README.md`:

- Human seat is observer-only, not a building.
- Human domain is derived from macro population shapes, not a new terrain layer.
- Seat establishment and abandonment are heuristic.
- Only Human seats are implemented in V0.11.3.
- Seat-to-seat continuity is preferred over raw centroid paths.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current Human lineage memory code.
3. Inspect Semantic Tags generation.
4. Inspect population shape core/body/edge cell data.
5. Keep this observer-only.
6. Avoid dead duplicate labels such as `H core` if it no longer matches the concept.
7. Keep implementation plain HTML/CSS/JS.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample seat/domain/semantic tag output from a run or fixture.
