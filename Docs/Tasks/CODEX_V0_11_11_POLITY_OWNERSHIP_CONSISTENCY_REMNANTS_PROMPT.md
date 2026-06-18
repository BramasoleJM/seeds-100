# CODEX V0.11.11 Polity Ownership Consistency + Remnants Task

## Summary

Implement V0.11.11 as a Human polity ownership consistency pass.

V0.11.10 improved polity lifecycle and H domain ownership, but exported results show two remaining consistency issues:

1. Collapsed polities can still own active `H village` / `H outpost` tags.
2. The same lineage / seat can appear as current seat source for multiple active polities.

This task should enforce ownership consistency and introduce a fallback `H remnant` concept for villages left behind by collapsed polities.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.11_POLITY_OWNERSHIP_CONSISTENCY_REMNANTS
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

`H remnant` is a macro marker, not a new unit/building/terrain.

## Problems To Fix

### 1. Collapsed Polity Still Owns Active Villages / Outposts

Observed:

```text
human_polity_005 state: collapsed
but visible tags still include:
H outpost@... human_polity_005
H village@... human_polity_005
```

Default map should not show normal current `H village` / `H outpost` for collapsed polities.

### 2. Same Lineage Seat Owned By Multiple Polities

Observed:

```text
human_polity_004 currentSeat lineageId: human_lineage_003
human_polity_002 currentSeat lineageId: human_lineage_003
```

One active lineage current seat should have one active polity owner.

### 3. Need Meaningful Fate For Leftover Villages

When a polity collapses, villages should not simply become invalid clutter.

Preferred rule:

```text
collapsed polity village
-> inherited by active descendant polity if conditions match
-> otherwise becomes H remnant
-> fades if support disappears
```

## Part A: Active Ownership Invariant

Enforce:

```text
One active lineage currentSeat -> at most one active/pressured/split polity owner.
```

If multiple polities claim the same lineage currentSeat:

1. Prefer polity whose id equals lineage.polityId.
2. Else prefer polity whose rootLineageId / lineageIds include that lineage directly.
3. Else prefer active non-collapsed polity with newest valid seat event.
4. Else prefer highest score:
   - has villages/outposts nearby,
   - lower splitDepth,
   - active over pressured.

Losers:

```text
clear currentSeat
state -> seatless / declining as appropriate
emit polity_seat_lost once
do not show H seat tag
```

Do not delete ancestry.

## Part B: Collapsed Polity Tag Suppression

Collapsed polity must not emit normal visible current tags:

```text
H seat
H pressured seat
H village
H outpost
H domain
```

Collapsed polity may still appear in:

```text
ancestry chains
old seat records
remnant tags
info panel as previousPolityId
exports
```

Semantic tag generation should filter:

```js
if (polity.state === "collapsed") suppress normal current tags
```

## Part C: Village Inheritance Rule

When a village belongs to a collapsed polity, try to transfer it to an active descendant polity.

### Find Candidate Descendant Polity

Candidates:

```text
active / split / pressured polity
whose polityAncestryIds include the collapsed polity id
or whose rootPolityId equals collapsed polity.rootPolityId
or whose lineage ancestry overlaps the village lineage ancestry
```

Score by:

```text
same ancestry chain match
distance to candidate currentSeat
distance to candidate active village/outpost
same rootPolityId
active state over pressured
```

Suggested thresholds:

```text
distance to seat <= 12
or distance to village/outpost <= 8
```

If clear winner exists:

```js
village.previousPolityId = oldPolity.id
village.polityId = newPolity.id
village.inheritedFromPolityId = oldPolity.id
village.state = "active" or "inherited"
```

Emit:

```text
village_inherited
```

### If No Candidate

Convert to remnant:

```js
village.previousPolityId = oldPolity.id
village.polityId = null
village.state = "remnant"
```

Emit:

```text
village_became_remnant
```

## Part D: H Remnant

`H remnant` means:

```text
a Human village / local settlement remnant left behind after its polity collapsed,
not currently absorbed by an active polity.
```

It is useful for future memory systems.

### Remnant Data

Village summary should preserve:

```js
state: "remnant"
previousPolityId
lineageId
lineageAncestryIds
polityAncestryIds
rootLineageId
rootPolityId
memorySeed
support
pressure
```

### Remnant Lifecycle

Remnant can persist briefly if support remains:

```text
support >= village minimum
cell remains FIELD / Human domain
not MARK / BLOCK / BORDER
```

If support disappears:

```text
remnant -> fading -> removed
```

Keep simple. Do not add gameplay effects.

### Remnant Tag

Visible semantic tag:

```text
H remnant
```

Cap:

```text
max 2 visible remnants
```

Style:

```text
muted / gray-warm accent
not same as active H village
```

Info panel should show:

```text
H remnant
Previous polity
Lineage
Root lineage
Root polity
Support
Pressure
Interpretation: remnant settlement left after polity collapse
```

## Part E: Inherited Village Display

If a village is inherited by an active descendant polity:

Default map tag can remain:

```text
H village
```

But tag/panel/export should include:

```js
previousPolityId
inheritedFromPolityId
```

Info panel interpretation:

```text
local settlement inherited from a collapsed polity
```

Do not add `H inherited village` tag unless simple. Prefer panel text first.

## Part F: Outpost Ownership Cleanup

If outpost belongs to collapsed polity:

1. Try to transfer to active descendant polity using same logic as villages.
2. If no owner:
   - suppress visible normal `H outpost` tag;
   - keep compact record as remnant/legacy outpost if useful, or mark fading.

First version may simply suppress collapsed-polity outpost tags and preserve export record.

Document simplification if chosen.

## Export Requirements

Snapshot / Recording:

```text
humanPolitySummary.villages may include state "remnant" or "inherited".
villages include previousPolityId / inheritedFromPolityId when applicable.
humanPolitySummary includes activeRemnants if useful.
```

Macro Timeline:

```text
macroSummary.humanPolity includes remnant count if useful.
macroSummary.semanticTags may include H remnant.
```

Do not change top-level frame keys.

Do not export full cell arrays.

## Tests

Add:

```text
tests/v0_11_11_polity_ownership_consistency_remnants.test.js
```

Cover:

1. Collapsed polity does not emit normal H village / H outpost / H domain tags.
2. Collapsed polity village transfers to active descendant polity when ancestry and distance match.
3. Inherited village keeps `previousPolityId` / `inheritedFromPolityId`.
4. If no descendant polity can inherit, village becomes `H remnant`.
5. Remnant tag exports compact ancestry and memorySeed.
6. Remnant tag is capped.
7. Remnant fades/removes when support disappears.
8. Same lineage currentSeat is not owned by multiple active polities.
9. Losing polity clears stale currentSeat and becomes seatless/declining.
10. Existing V0.11.10 lifecycle/domain tests still pass.

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
```

## Manual Verification

After implementation:

1. Run Macro View for 900-1100 ticks.
2. Export Recording and Macro Timeline.
3. Confirm:
   - no normal H village / H outpost tags belong to collapsed polity;
   - same lineage seat is not claimed by multiple active polities;
   - inherited villages show previousPolityId in panel/export;
   - remnants appear only when no active descendant can inherit;
   - remnant count is small and readable.
4. Report:
   - active / collapsed polity counts;
   - inherited village count;
   - remnant count;
   - sample inherited village;
   - sample remnant if present;
   - seat ownership conflict check.

## Expected Result

Before:

```text
Collapsed polities may still show active villages/outposts.
Same lineage seat may belong to multiple active polities.
```

After:

```text
Active tags belong to active polities.
Villages from collapsed polities are inherited by descendants or become H remnants.
Seat ownership is unique across active polities.
```

## Known Simplifications

Document in `README.md`:

- H remnant is observer-only.
- Inherited village behavior has no gameplay effect.
- Outpost transfer may be simplified to suppression/fading if full inheritance is too much.
- Ownership conflict resolution is heuristic.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current humanPolity lifecycle update.
3. Inspect village generation / assignment.
4. Inspect semantic tag generation and info panel formatting.
5. Keep exports compact.
6. Do not change simulation rules.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample ownership/remnant output.
