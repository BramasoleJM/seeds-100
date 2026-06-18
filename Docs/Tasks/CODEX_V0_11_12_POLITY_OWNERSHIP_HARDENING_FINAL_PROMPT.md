# CODEX V0.11.12 Polity Ownership Hardening Final Task

## Summary

Implement V0.11.12 as a final hardening pass for Human polity ownership consistency.

V0.11.11 improved polity lifecycle but did not fully close the critical ownership bugs:

1. Collapsed polities can still retain `currentSeat`.
2. Collapsed polities can still emit visible `H seat` tags.
3. The same lineage current seat can still be owned by multiple active/non-collapsed polities.

This task must close those issues. Do not add new conceptual systems in this iteration.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.12_POLITY_OWNERSHIP_HARDENING_FINAL
```

## Non-Negotiable Acceptance Criteria

On a representative 900-1100 tick run/export:

```text
collapsed polity with currentSeat count = 0
visible H seat / H pressured seat tags owned by collapsed polity = 0
same lineage currentSeat owned by multiple active/non-collapsed polities = 0
```

If these are not zero, the task is not complete.

## Scope

Strict bugfix / consistency pass.

Do not change:

- movement;
- lifecycle;
- conflict;
- conversion;
- terrain rewrite;
- reproduction;
- fertility;
- POI effects;
- terrain decay;
- counter-cycle rules.

Do not add:

- new species;
- new terrain;
- new POIs;
- NPCs;
- quests;
- economy;
- save/load;
- external dependencies;
- multi-screen maps.

Do not add new macro concepts unless absolutely required to fix these bugs.

## Problem Evidence

Recent export showed:

```text
human_polity_007 state: collapsed
currentSeat: { x:37, y:13, state:active }
```

and visible timeline tags:

```text
H seat @ human_polity_007 from tick 965-1050
```

Also:

```text
human_lineage_026 currentSeat owned by both human_polity_006 and human_polity_002
```

for many frames.

## Part A: Collapse Must Clear Current Seat

Any transition into:

```text
collapsed
```

must force:

```js
polity.currentSeat = null
```

Before clearing, preserve the old seat compactly if it is not already in `oldSeats`:

```js
oldSeats.push({
  ...currentSeat,
  abandonedTick: tick,
  reason: "polity_collapsed"
})
```

Then:

```js
currentSeat = null
```

This must happen in the lifecycle update itself, not only at render time.

Also add a final invariant cleanup at the end of polity update:

```js
for every collapsed polity:
  clear currentSeat
  clear/ignore active current ownership fields
```

## Part B: Collapsed Polities Cannot Emit Current Tags

Semantic tag generation must never emit these for collapsed polity:

```text
H seat
H pressured seat
H village
H outpost
H domain
```

Allowed:

```text
H old seat
H remnant
ancestry references
previousPolityId / inheritedFromPolityId in panels/export
```

Add a final tag filter:

```js
if tag.polityId belongs to collapsed polity and tag.label is current tag:
  drop tag
```

This is a guardrail, not the only fix.

## Part C: Unique Current Seat Owner

After all polity updates and before summaries/tags are created, enforce:

```text
same currentSeat lineageId -> one active/non-collapsed polity owner
```

Build an owner map:

```js
lineageId -> [polities with currentSeat.lineageId === lineageId and state !== collapsed]
```

For conflicts, choose the winner deterministically.

Winner priority:

1. `lineage.polityId === polity.id`
2. polity `lineageIds` includes the lineage and no other competing polity has direct lineage assignment
3. currentSeat coordinate matches authoritative lineage.currentSeat
4. lower `splitDepth`
5. active state over pressured/split/seatless
6. more active villages/outposts nearby
7. older polity createdTick as final tie-breaker

Losers:

```js
move currentSeat to oldSeats if needed with reason "ownership_conflict"
currentSeat = null
state = seatless or declining
emit polity_seat_lost once
```

Do not delete lineage/polity ancestry.

## Part D: Synchronize With Authoritative Lineage Seats

If a polity currentSeat references a lineageId:

```text
that lineage must currently have matching currentSeat
```

Matching:

```text
same lineageId
distance(current polity seat, lineage.currentSeat) <= 1
lineage.state not collapsed
```

If no match:

```text
clear polity currentSeat as stale
reason: "stale_lineage_seat"
```

Exception:

If currentSeat is explicitly a promoted outpost seat and not a lineage seat, it must have a valid current outpost record with matching id/state. If this is not reliably represented yet, prefer clearing stale seat over keeping bad current state.

## Part E: Validation Helper

Add an internal validation helper available in tests:

```js
validateHumanPolityOwnershipForTest()
```

or equivalent exported test helper returning:

```js
{
  collapsedWithCurrentSeat,
  collapsedCurrentTags,
  duplicateSeatOwners,
  staleLineageSeats
}
```

Counts should be zero in tests.

If exporting a helper is awkward, implement the same checks in the test file using existing exported summaries/tags.

## Export / Summary Requirements

Snapshot / Recording:

- no collapsed polity should export `currentSeat`;
- old seat can record `reason: "polity_collapsed"` / `"ownership_conflict"` / `"stale_lineage_seat"`;
- active/collapsed counts should remain compact.

Macro Timeline:

- no visible current tag should belong to collapsed polity;
- no duplicate active current seat owner by lineageId.

Do not change top-level frame keys.

## Tests

Add:

```text
tests/v0_11_12_polity_ownership_hardening_final.test.js
```

Cover:

1. Collapsed polity clears currentSeat immediately.
2. Collapsed polity currentSeat is preserved as oldSeat with reason `polity_collapsed`.
3. Collapsed polity cannot emit `H seat` / `H pressured seat`.
4. Collapsed polity cannot emit normal `H village` / `H outpost` / `H domain`.
5. Duplicate active polity owners for same lineage currentSeat are resolved to one winner.
6. Losing polity records oldSeat reason `ownership_conflict` and clears currentSeat.
7. Stale polity currentSeat without matching lineage currentSeat is cleared.
8. Exported recording has zero collapsed polities with currentSeat.
9. Macro timeline semanticTags have zero collapsed current tags.
10. Existing V0.11.11 tests still pass.

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
node tests/v0_11_6_human_polity_village_layer.test.js
node tests/v0_11_7_polity_visual_identity.test.js
node tests/v0_11_8_clickable_tag_info_panel.test.js
node tests/v0_11_9_ancestry_chain_polity_split_dedup.test.js
node tests/v0_11_10_polity_lifecycle_domain_ownership.test.js
node tests/v0_11_11_polity_ownership_consistency_remnants.test.js
node tests/v0_11_12_polity_ownership_hardening_final.test.js
```

## Manual Verification

After implementation:

1. Run Macro View for 900-1100 ticks.
2. Export Recording and Macro Timeline.
3. Run/check:

```text
collapsed polity with currentSeat count
collapsed polity current visible tags count
duplicate seat owner count
stale lineage seat count
```

All must be `0`.

Report those four counts explicitly.

## Expected Result

Before:

```text
Collapsed polity may still have active currentSeat and H seat tag.
Same lineage currentSeat may be owned by multiple polities.
```

After:

```text
Collapsed polities are historical only.
Current seats have unique active polity owners.
Semantic tags do not show impossible ownership states.
```

## Known Simplifications

Document in `README.md`:

- Ownership conflict resolution is deterministic but heuristic.
- Losing polities retain ancestry and old seat history.
- This pass does not add new gameplay behavior.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect humanPolity lifecycle update.
3. Inspect semantic tag generation.
4. Inspect current V0.11.11 tests and exported summaries.
5. Keep this as a hardening pass only.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- the four manual verification counts, all zero.
