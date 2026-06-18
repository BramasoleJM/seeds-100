# CODEX V0.11.5 Human Outpost / Seat Promotion Task

## Summary

Implement V0.11.5 as a Human seat hardening and outpost promotion pass.

Current Human seats are still too permissive:

- a seat can briefly appear on / remain active over MARK-like purple corrosion;
- far-away bright Human regions can feel like they suddenly become seats;
- old seats and current seats do not always read as one continuous mainline.

This task introduces an observer-only `H outpost` concept for far Human domains that are not yet stable enough to become a seat.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.5_HUMAN_OUTPOST_SEAT_PROMOTION
```

## Scope

Observer-only macro interpretation.

Do not change:

- movement;
- lifecycle;
- conflict;
- terrain rewrite;
- reproduction;
- fertility;
- POI effects;
- core counter-cycle rules.

Do not add:

- new species;
- new terrain;
- buildings;
- NPCs;
- quests;
- resource economy;
- save/load;
- external dependencies;
- multi-screen maps.

`H outpost` and `H seat` are labels / memory anchors, not gameplay objects.

## Problems To Fix

### 1. Seat On Corruption

Current seat selection mostly checks support versus pressure. It does not hard-ban the seat cell itself from being MARK.

This creates counter-intuitive cases:

```text
H seat appears inside purple MARK / corrosion.
```

### 2. Direct Far-Shape Seat Creation

Current Human shape -> lineage -> seat candidate flow can allow far Human regions to become seats too quickly.

The user needs a middle concept:

```text
This is a distant Human outpost, not a capital yet.
```

### 3. Mainline Continuity

Visible old seats should connect to the current dominant Human mainline, not random side branches.

## Concept Definitions

### H Seat

Stable Human center / capital-like observer anchor.

Should be conservative.

It should not sit on corruption.

It should not be created from a brief far-away Human patch.

### H Outpost

A distant Human domain that is visible and meaningful but not yet a stable seat.

It represents:

```text
far Human settlement / frontier / colony-like region
```

It is not a building or new terrain.

It can later be promoted to `H seat` only after stronger stability checks.

### H Old Seat

An abandoned previous seat on the current mainline / ancestor chain.

Do not show side-branch old seats by default.

## Seat Hard Constraints

Update seat candidate and seat support validation.

Candidate seat cell must not be:

```text
MARK
BLOCK
BORDER if BORDER is conflict/stalemate
spring blocked center
rot source core / inner ring
any POI hard blocker
outside current Human domain
```

Recommended first-pass rule:

```js
if (cell.terrain !== FIELD) reject candidate
```

If that is too strict for early simulation, use:

```js
cell.terrain must be FIELD or high-fertility EMPTY inside Human domain,
but never MARK / BLOCK / BORDER.
```

Prefer strict FIELD first unless tests show it prevents all seats.

Current active seat validation:

```text
If current seat cell becomes MARK, immediately mark unsupported.
If it remains MARK for the warning / abandon window, abandon it.
If MARK pressure nearby is high, abandon faster.
```

Recommended:

```text
seat cell MARK -> warned immediately
seat cell MARK for 2 macro updates -> abandoned with reason rot_pressure
```

Use the simplest implementation that avoids flicker.

## Outpost Detection

Detect outposts from Human population shapes.

Candidate outpost conditions:

```text
shape.type === human
shape area >= medium threshold
shape confidence >= threshold
shape is far from current dominant seat
shape is not the current seated main domain
shape has enough FIELD / Human support
shape is not dominated by MARK / Spirit pressure
```

Suggested first-pass values:

```text
min outpost area: 15 cells
min confidence: 0.50
far from current seat: distance >= 8 cells
minimum stable samples before visible: 2 macro updates
```

Outposts should have compact state:

```text
forming
active
fading
promotable
```

Keep state simple.

## Outpost Data Model

Add observer-only outpost memory, preferably under Human lineage memory:

```js
humanOutposts: [
  {
    id,
    lineageId,
    x,
    y,
    firstSeenTick,
    lastSeenTick,
    state,
    confidence,
    area,
    support,
    pressure,
    stableSamples,
    promotedToSeat
  }
]
```

Keep capped:

```text
max active/recent outposts: 12
```

Do not export full cell arrays.

## Outpost Promotion To Seat

Outpost can become a seat only if:

```text
outpost stableSamples >= promotion threshold
area and confidence remain high
support remains high
pressure remains low
candidate seat cell is FIELD and not corrupted
current lineage has no valid current seat
or current seat has been abandoned
or this is a descendant/mainline relocation case
```

Suggested first-pass values:

```text
promotion stable samples: 5 macro updates
min promotion area: 24 cells
min promotion confidence: 0.60
```

Important:

```text
Far Human shapes should not directly create H seat.
They should become H outpost first.
Only mature outposts can promote.
```

If implementation complexity is high, first version may:

- detect and display H outpost;
- block direct far-seat promotion;
- leave actual outpost -> seat promotion conservative.

Document simplification if chosen.

## Mainline Old Seat Display

Visible `H old seat` should come from the current dominant lineage mainline.

Build mainline chain:

```text
dominant lineage
-> parent lineage
-> parent lineage
...
```

Visible old seats:

```text
only old seats from this chain
max 1-2 visible old seats
prefer most recent and spatially meaningful old seats
```

Do not show side-branch old seats by default.

## Semantic Tags

Default visible tags should include:

```text
H seat
H old seat
H outpost
H domain
major POIs
optional B range / S scar
```

Rules:

- `H seat` only for valid current mainline / selected seat.
- `H outpost` for far Human domains that are not seats.
- `H old seat` only from mainline seat history.
- Suppress `H domain` near `H seat` or `H outpost`.
- Keep collision suppression from V0.11.4.

Suggested caps:

```text
H seat: max 1 visible dominant/mainline seat unless multi-seat display is explicitly needed
H old seat: max 2
H outpost: max 2
H domain: max 1-2
B range: max 1
S scar: max 1
```

## Export Requirements

Snapshot / Recording:

```text
humanLineageMemorySummary includes compact outpost summary.
```

Suggested:

```js
outposts: [
  { id, lineageId, x, y, state, area, confidence, stableSamples, promotedToSeat }
],
activeOutposts,
promotableOutposts,
recentOutpostEvents
```

Macro Timeline:

```text
macroSummary.humanLineage includes compact outpost counts.
macroSummary.semanticTags may include H outpost.
```

Do not change required top-level frame keys.

## Events

Add compact events if helpful:

```text
outpost_found
outpost_stabilized
outpost_faded
outpost_promoted_to_seat
```

Emit only on meaningful transitions.

Avoid repeated event spam every frame.

## Tests

Add:

```text
tests/v0_11_5_human_outpost_seat_promotion.test.js
```

Cover:

1. Seat candidate is rejected on MARK.
2. Existing seat on MARK becomes warned / unsupported and then abandoned.
3. Seat candidate is rejected on BLOCK / hard POI blockers / rot inner ring.
4. Far Human shape becomes `H outpost` instead of directly becoming `H seat`.
5. Outpost requires stable samples before visible/active.
6. Mature outpost can promote to seat only when current seat is absent/abandoned or relocation conditions are satisfied.
7. Outpost under high MARK / Spirit pressure does not promote.
8. Visible old seats come from dominant lineage ancestor chain, not side branches.
9. Semantic tags include capped `H outpost` and no reintroduced hidden helper tags.
10. Exports include compact outpost counts and do not export full cell arrays.

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
node tests/v0_11_4_semantic_tag_declutter.test.js
node tests/v0_11_5_human_outpost_seat_promotion.test.js
```

## Manual Verification

After implementation:

1. Run Macro View for 700-900 ticks.
2. Enable Semantic Tags.
3. Confirm:
   - `H seat` does not appear on purple MARK cells.
   - corrupted seats become warned/old seat instead of staying active.
   - far bright Human regions show as `H outpost`, not immediate seats.
   - only mature outposts can become seats.
   - visible old seats connect to dominant/mainline ancestry.
   - tag count remains sparse and no overlaps return.
4. Export Recording and Macro Timeline.
5. Report:
   - current seat;
   - old seat count;
   - active outpost count;
   - promotable outpost count;
   - recent outpost/seat events;
   - final visible semantic tags.

## Expected Visual Difference

Before:

```text
Remote Human shapes can feel like sudden seats.
Seats can briefly sit in corruption.
Old seats can feel unrelated to current seat.
```

After:

```text
H seat is conservative and not corrupted.
Remote Human regions first read as H outpost.
Only stable outposts can become seats.
Old seats describe the current mainline, not random side branches.
```

## Known Simplifications

Document in `README.md`:

- `H outpost` is observer-only.
- Outpost promotion is heuristic, not a full colonization system.
- Only Human outposts are implemented.
- Seat corruption checks are intentionally stricter than ordinary Human domain checks.
- Visible old seats are filtered to mainline continuity.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current seat candidate / validation code.
3. Inspect semantic tag declutter logic.
4. Inspect Human lineage summary/export code.
5. Keep changes observer-only.
6. Avoid reintroducing hidden tags such as `H now`, `H origin`, `H path`, `H descendant` into default map tags.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample outpost/seat summary from a run or fixture.
