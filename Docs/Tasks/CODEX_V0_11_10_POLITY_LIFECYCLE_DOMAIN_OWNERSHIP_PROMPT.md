# CODEX V0.11.10 Polity Lifecycle + Domain Ownership Task

## Summary

Implement V0.11.10 as a Human polity lifecycle cleanup and domain ownership pass.

V0.11.9 successfully added compact ancestry chains and deduplicated repeated polity splits. However, exported results show that polities can persist too long as pressured/corrupted states and may keep stale `currentSeat` records even when lineage-level seat data has moved on.

This task should make Human polities lifecycle-clean:

```text
founded -> active / pressured -> seatless -> declining -> collapsed
```

It should also assign `H domain` tags to a polity when confidence is high enough.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.10_POLITY_LIFECYCLE_DOMAIN_OWNERSHIP
```

## Scope

Observer-only interpretation layer.

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
- core counter-cycle rules.

Do not add:

- new species;
- new terrain;
- NPCs;
- quests;
- resource economy;
- save/load;
- external dependencies;
- multi-screen maps.

## Problems To Fix

### 1. Stale Polity Seats

Observed after V0.11.9:

```text
humanLineage currentSeatCount: 1
humanPolity polities: 10
many polities still have currentSeat
many currentSeat states are corrupted / pressured
```

This suggests polity-level `currentSeat` can outlive the corresponding lineage/outpost seat.

Polity currentSeat should be synchronized with authoritative lineage / outpost seat state.

### 2. Polities Rarely Collapse

Observed:

```text
activePolities: 2
pressuredPolities: 8
collapsedPolities: 0
```

This makes the world accumulate too many "half-alive" polities.

Polities need stronger lifecycle exits.

### 3. H Domain Has No Polity Ownership

Human tags such as:

```text
H seat
H village
H outpost
```

now carry polity identity, but:

```text
H domain
```

often remains unassigned.

This prevents the user from understanding which polity controls a visible Human region.

## Goals

After V0.11.10:

```text
Polity currentSeat matches real current lineage/outpost state.
Corrupted/pressured polities eventually become seatless/declining/collapsed if not recovered.
Collapsed polities stay in compact history but no longer dominate visible tags.
H domain tags carry polityId when ownership can be inferred confidently.
```

## Part A: Authoritative Seat Sync

Define authoritative seat sources:

1. Current lineage seats from `humanLineageMemory.lineages[*].currentSeat`.
2. Mature outpost-promoted seats if they are intentionally represented as current seat.

On each polity update:

```text
If polity.currentSeat.lineageId no longer has a matching active currentSeat,
and no current promoted outpost matches,
then polity.currentSeat must be cleared or moved to oldSeats with reason stale_seat / lineage_lost_seat.
```

Do not keep a polity currentSeat simply because it existed in previous polity memory.

Recommended matching:

```text
same lineageId
same x/y, or distance <= 1
source seat state not abandoned/collapsed
```

If mismatch persists:

```text
emit polity_seat_lost
state -> seatless
```

## Part B: Pressured / Corrupted Seat Lifecycle

Add counters for polity pressure.

Suggested fields:

```js
polity.pressuredSamples
polity.seatlessSamples
polity.decliningSamples
```

Rules:

```text
If currentSeat.state is pressured/corrupted:
  pressuredSamples += 1
Else:
  pressuredSamples = 0

If pressuredSamples >= threshold:
  state = pressured

If currentSeat.state is corrupted and pressure remains high / seat not authoritative:
  eventually clear seat -> seatless
```

Suggested thresholds:

```text
pressured visible immediately
corrupted seat max persistence: 8 macro samples
seatless -> declining after 4 macro samples
declining -> collapsed after 8 macro samples without active villages/outposts
```

Keep deterministic and simple.

Important:

```text
A polity with no current seat but active villages/outposts may remain seatless/declining.
A polity with no current seat, no active villages, and no active outposts should collapse.
```

## Part C: Collapse And Visibility

Collapsed polities:

- remain in compact export history if already stored;
- should not produce visible `H seat`, `H village`, `H outpost`, or `H domain` tags;
- can still appear in ancestry chains.

Cap retained collapsed polities:

```text
max retained collapsed polities: 6
```

Prefer retaining:

- ancestors of active polities;
- recently collapsed polities;
- polities with old seats.

Do not allow collapsed polity list to grow forever.

## Part D: H Domain Ownership

Assign `H domain` tags to a polity when confidence is high.

Ownership heuristic:

1. If the population shape matches a lineage with `polityId`, use that polity.
2. Else if the shape center is near an active polity seat, use nearest polity.
3. Else if the shape overlaps / is near active villages of a polity, use that polity.
4. Else if the shape is near an active outpost with `polityId`, use that polity.
5. Else leave unassigned.

Suggested distance thresholds:

```text
near seat <= 8 cells
near village <= 5 cells
near outpost <= 6 cells
```

Only assign if one polity clearly wins.

Tie rule:

```text
If top two candidates are very close, leave unassigned.
```

Add to `H domain` semantic tag when assigned:

```js
polityId
polityState
polityColorIndex
lineageId if known
polityAncestryIds
rootPolityId
```

## Part E: Status / Panel

Update clicked tag info panel if needed:

For `H domain`, if polity exists:

```text
Polity
Polity state
Root polity
Interpretation: Human-controlled domain of this polity
```

For collapsed / stale polity records, avoid showing them as current map tags.

## Export Requirements

Snapshot / Recording:

```text
humanPolitySummary includes updated lifecycle counters if compact.
collapsed polities retained compactly.
H domain tags in semanticTags include polity fields when assigned.
```

Macro Timeline:

```text
macroSummary.humanPolity reflects active/pressured/seatless/declining/collapsed counts.
macroSummary.semanticTags H domain includes polity fields when assigned.
```

Do not change top-level frame keys.

Do not export full cell arrays.

## Tests

Add:

```text
tests/v0_11_10_polity_lifecycle_domain_ownership.test.js
```

Cover:

1. Polity currentSeat is cleared when lineage currentSeat is gone.
2. Stale seat emits/records `polity_seat_lost` once, not every frame.
3. Corrupted polity seat cannot persist forever without recovery.
4. Seatless polity becomes declining after grace window.
5. Declining polity collapses when it has no active seat/villages/outposts.
6. Collapsed polities do not emit visible current map tags.
7. Collapsed polity retention is capped.
8. H domain tag receives polityId when near a clear active polity seat.
9. H domain remains unassigned when ownership is ambiguous.
10. H domain tag carries ancestry fields when polity assigned.
11. Existing V0.11.9 ancestry/split-dedup tests still pass.

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
```

## Manual Verification

After implementation:

1. Run Macro View for 900-1100 ticks.
2. Export Recording and Macro Timeline.
3. Confirm:
   - polity count remains plausible;
   - pressured/corrupted polities do not accumulate forever;
   - collapsedPolities can become nonzero;
   - visible tags do not show collapsed polity seats;
   - H domain tags often carry polityId when clearly owned;
   - ancestry chains remain present.
4. Report:
   - active / pressured / seatless / collapsed polity counts;
   - number of H domain tags with polityId;
   - sample collapsed polity if present;
   - sample H domain tag with ownership.

## Expected Result

Before:

```text
Polities accumulate as pressured/corrupted states.
Polity currentSeat can become stale.
H domain ownership is unclear.
```

After:

```text
Polities have cleaner lifecycles.
Stale seats clear.
Collapsed polities can leave the active map while staying in ancestry.
H domains can be attributed to polities when confidence is high.
```

## Known Simplifications

Document in `README.md`:

- Polity lifecycle is heuristic.
- Collapsed polities are retained compactly only for ancestry/reference.
- H domain ownership is inferred and may remain unassigned when ambiguous.
- No gameplay rules are affected.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current humanPolityMemory update logic.
3. Inspect current lineage/outpost authoritative seat fields.
4. Inspect semantic tag generation for H domain.
5. Keep changes observer-only.
6. Keep exports compact.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample lifecycle/domain ownership output.
