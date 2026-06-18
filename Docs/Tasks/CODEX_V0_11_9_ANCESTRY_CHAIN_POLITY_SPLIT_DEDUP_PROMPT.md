# CODEX V0.11.9 Ancestry Chain + Polity Split Dedup Task

## Summary

Implement V0.11.9 as a data integrity and future-memory foundation pass.

V0.11.8 made semantic tags inspectable. The current data supports clicked tag panels, but exported results revealed two deeper issues:

1. Human polity split can repeat and create many near-duplicate polities from the same lineage / seat.
2. Ancestry can be inferred from `parentId`, but it is not explicitly saved on polity / village records for future memory features.

This task should:

- prevent repeated duplicate polity splits;
- add compact explicit ancestry chains for lineage / polity / village summaries;
- preserve enough future-facing memory data for later features like "a village awakens ancestral memory."

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.9_ANCESTRY_CHAIN_POLITY_SPLIT_DEDUP
```

## Scope

Observer-only data / interpretation layer.

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

Do not implement actual ancestral-memory events yet. Only store compact data to support them later.

## Problems To Fix

### 1. Repeated Polity Splits

Observed exported pattern:

```text
human_polity_008 -> human_polity_009 -> human_polity_010 -> ... -> human_polity_015
```

Many had:

```text
same rootLineageId
same currentSeat
same outpost / lineage source
splitFrom previous duplicate polity
```

This reads like fake polity inflation, not real political history.

### 2. Ancestry Is Only Implicit

Current lineage summaries contain:

```text
parentId
generation
descendantIds
```

So ancestry can be reconstructed only if all ancestor lineages remain exported.

Villages have:

```text
polityId
lineageId
```

But not explicit ancestry.

For future features such as:

```text
village awakens ancestral memory
```

each village/polity should carry a compact ancestry snapshot.

## Goals

After V0.11.9:

```text
Polity split creates one meaningful polity, not repeated clones.
Lineage / polity / village summaries include compact ancestry chains.
Future systems can read ancestry without reconstructing everything from raw full history.
```

## Part A: Polity Split Dedup

### Split Identity

Define a stable split identity for a polity split candidate.

Recommended:

```js
splitKey = `${parentPolityId}|${rootLineageId}|${seatOrOutpostId}`
```

If seat/outpost id is unavailable, use a coarse location key:

```js
`${parentPolityId}|${rootLineageId}|${Math.round(x/3)},${Math.round(y/3)}`
```

Store the split key on new polities:

```js
splitKey
```

### Reuse Existing Split

Before creating a new split polity, check:

```text
Does an active / non-collapsed polity already have the same splitKey?
Does a polity already own this outpostId?
Does a polity with the same rootLineageId and nearby currentSeat already exist?
```

If yes:

```text
reuse that polity
assign lineage/outpost/village to it
do not create another polity
do not emit another polity_split event
```

### Split Cooldown

Add a simple cooldown to avoid repeated split events from jitter.

Suggested:

```text
same parentPolityId + rootLineageId cannot split again within 100 ticks
unless seat/outpost id is clearly different and far away
```

Keep deterministic.

### Split Event Dedup

Avoid repeated:

```text
polity_split
```

events for the same splitKey.

Use recent events or polity field:

```js
createdBySplitKey
```

## Part B: Explicit Lineage Ancestry

Add compact ancestry fields to lineage summary.

Recommended:

```js
lineageAncestryIds: [selfId, parentId, grandparentId, ...]
rootAncestorId
ancestorDepth
```

Cap:

```text
max lineage ancestry ids: 8
```

Use current `parentId` chain to compute and store in compact summaries.

Do not export full ancestor objects.

## Part C: Explicit Polity Ancestry

Add compact ancestry fields to polity summary.

Recommended:

```js
polityAncestryIds: [selfId, splitFromPolityId, ...]
rootPolityId
splitDepth
splitKey
```

Cap:

```text
max polity ancestry ids: 8
```

If a polity is not split from another polity:

```text
polityAncestryIds = [selfId]
rootPolityId = selfId
splitDepth = 0
```

## Part D: Village Ancestry Snapshot

Add compact ancestry snapshot to village summary.

Recommended:

```js
village = {
  ...
  polityId,
  lineageId,
  lineageAncestryIds,
  polityAncestryIds,
  rootLineageId,
  rootPolityId,
  memorySeed
}
```

### Memory Seed

Add a deterministic compact seed for future memory features:

```js
memorySeed = `${village.id}|${polityId}|${lineageId}|${firstSeenTick}`
```

Or a stable numeric hash if a local helper exists.

Do not implement memory awakening now.

### Village Panel / Tag Data

If semantic tag data can include ancestry compactly, add:

```text
lineageAncestryIds
polityAncestryIds
rootLineageId
rootPolityId
```

Keep it capped.

## Part E: Seat Ancestry Summary

For polity / lineage summaries, preserve compact seat ancestry:

```js
seatAncestry: [
  { x, y, establishedTick, abandonedTick, reason, polityId, lineageId }
]
```

Cap:

```text
max seatAncestry entries: 6
```

Prefer:

- current mainline old seats;
- recent old seats;
- seats tied to current/root lineage chain.

Do not export every old seat forever.

## Info Panel Support

Clickable tag panel should be able to show ancestry later.

For now, if fields exist, panel can include compact rows:

```text
Lineage chain: human_lineage_021 <- human_lineage_013 <- human_lineage_007
Polity chain: human_polity_016 <- human_polity_015
Root lineage: human_lineage_007
Root polity: human_polity_001
```

If adding to panel is too much, at minimum ensure fields are present in tag data and exports.

## Export Requirements

Snapshot / Recording:

```text
humanLineageMemorySummary.lineages[*].lineageAncestryIds
humanPolitySummary.polities[*].polityAncestryIds
humanPolitySummary.villages[*].lineageAncestryIds
humanPolitySummary.villages[*].polityAncestryIds
humanPolitySummary.villages[*].memorySeed
```

Macro Timeline:

```text
macroSummary.humanLineage lineages include compact lineage ancestry.
macroSummary.humanPolity polities/villages include compact polity/lineage ancestry.
macroSummary.semanticTags may include compact ancestry for visible Human tags.
```

Do not change frame top-level keys.

Do not export full history objects.

## Tests

Add:

```text
tests/v0_11_9_ancestry_chain_polity_split_dedup.test.js
```

Cover:

1. Repeated split candidate with same parent/root/outpost reuses existing polity.
2. Same lineage/current seat does not create a chain of duplicate split polities.
3. `polity_split` event is not emitted repeatedly for the same splitKey.
4. Lineage summaries include capped `lineageAncestryIds`, `rootAncestorId`, and `ancestorDepth`.
5. Polity summaries include capped `polityAncestryIds`, `rootPolityId`, and `splitDepth`.
6. Village summaries include lineage/polity ancestry snapshots.
7. Village `memorySeed` is stable for same village identity.
8. Semantic Human tag data includes ancestry fields where available.
9. Exports remain compact and do not include full ancestor objects.
10. Existing V0.11.8 clickable panel tests still pass.

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
```

## Manual Verification

After implementation:

1. Run Macro View for 800-1000 ticks.
2. Export Recording and Macro Timeline.
3. Confirm:
   - no long chain of duplicate polities with same root lineage and same seat;
   - active polity count is plausible;
   - villages include lineage/polity ancestry chains;
   - clickable village panel or exported tag can show ancestry fields;
   - memorySeed exists for villages.
4. Report:
   - polity count;
   - duplicate split prevention evidence;
   - sample village ancestry;
   - sample polity ancestry;
   - sample lineage ancestry.

## Expected Result

Before:

```text
Polity splits can duplicate into many clone polities.
Village ancestry can only be inferred by walking parentId manually.
```

After:

```text
Polity splits are deduplicated.
Villages, polities, and lineages export compact ancestry chains.
Future ancestral-memory features have stable data to read.
```

## Known Simplifications

Document in `README.md`:

- Ancestry chains are compact snapshots, not full historical biographies.
- Village memorySeed is only stored; no memory awakening behavior exists yet.
- Split dedup uses deterministic heuristics.
- Polity ancestry is observer-only.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current Human polity split creation logic.
3. Inspect current lineage parent/descendant summary logic.
4. Inspect village summary/export logic.
5. Keep exports compact.
6. Do not change simulation rules.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample ancestry output for one polity, one lineage, and one village.
