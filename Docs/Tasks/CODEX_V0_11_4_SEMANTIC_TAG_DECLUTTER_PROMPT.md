# CODEX V0.11.4 Semantic Tag Declutter Task

## Summary

Implement V0.11.4 as a semantic tag declutter and hierarchy pass.

V0.11.2 and V0.11.3 made macro tags more meaningful, but the map is still hard to read because too many Human lineage tags appear at once and many tags overlap.

This task should reduce visible tags to the ones that directly help the user understand the map.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.4_SEMANTIC_TAG_DECLUTTER
```

## Problem

Current tags include:

```text
H seat
H old seat
H origin
H now
H path
H old
H descendant
H domain
B range
S scar
Monument
Rot Source
Spring
Great Forest
```

This creates two issues:

1. Several Human tags describe similar ideas and compete visually.
2. Tags frequently overlap at the same or nearby cells.

Observed examples from exported timeline:

```text
H seat + H origin + H path on the same coordinate
H now + H domain on the same coordinate
Monument + H domain on the same coordinate
```

The user feels the map is still changing too much and cannot read stable continuity.

## Goal

Make map tags sparse and hierarchical.

The map should primarily show:

```text
H seat
H old seat
H domain
major POIs
B range / S scar only when useful
```

Hide or demote low-value Human lineage helper tags from the main map:

```text
H now
H origin
H path
H old
H descendant
```

These can remain in data exports or status readout, but should not appear by default on the map.

## Visible Tag Policy

### Default Visible Tags

Show by default:

```text
H seat
H old seat
H domain
Monument
Rot Source
Spring
Great Forest
```

Optional, capped and lower priority:

```text
B range
S scar
```

### Hidden By Default

Do not show these by default:

```text
H now
H origin
H path
H old
H descendant
```

Keep their underlying data.

If the code already emits them for export/debug, either:

- remove them from visible `semanticTags`, or
- mark them with `visible: false`, or
- move them to an internal/debug-only list.

Choose the simplest approach that keeps exports compact and tests clear.

## Human Tag Meaning

Use these meanings consistently:

```text
H domain = current Human-controlled macro region representative.
H seat = stable Human lineage center / capital-like anchor.
H old seat = abandoned previous Human seat.
```

Do not use `H now` as a primary visual tag. It drifts with current geometry and undermines the intended stable-seat concept.

Do not use `H path` as map text by default. If a path is needed, prefer a non-text visual hint later.

Do not use `H origin` as a map text tag by default. It often overlaps with `H seat`.

Do not use `H descendant` as a map text tag by default. Descendant relationships should be summarized in status/export until a clearer connection visualization exists.

## Tag Priority

When tags overlap or are too close, keep only the higher-priority tag.

Priority order:

```text
H seat
Rot Source
Spring
Great Forest
Monument
H old seat
H domain
S scar
B range
```

If two tags occupy the same cell or are within a small conflict radius, hide the lower-priority one.

Suggested conflict radius:

```text
same coordinate: always suppress lower priority
distance <= 1.25 cells: suppress lower priority unless both are major POIs
```

Do not offset tags randomly. Stable suppression is better than jitter.

## Domain Tag Rule

`H domain` should not appear when it collides with:

```text
H seat
H old seat
major POI tag
```

Also cap Human domain tags:

```text
max 1-2 H domain tags
```

Prefer domains without an active `H seat` tag nearby, because `H seat` already explains the primary Human center.

## Old Seat Rule

Show only the most relevant old seats.

Recommended default:

```text
max 1-2 H old seat tags
```

Prefer old seats that belong to:

- the dominant lineage;
- direct ancestors of the dominant lineage;
- recently abandoned seats;
- seats far enough from the current seat to show meaningful continuity.

Do not show all old seats.

## B / S Tag Rule

Keep `B range` and `S scar` optional but sparse.

Recommended cap:

```text
max 1 B range
max 1 S scar
```

Prefer the largest / strongest shape.

If these tags collide with POIs or Human seat tags, suppress them.

## Status Readout

Move hidden Human lineage details into status text if useful.

Status can mention:

```text
Origin
Descendant link count
Recent event
Old seat count
```

But the map itself should stay clean.

Suggested compact display:

```text
Human Lineage
Seat: active
Old seats: 2
Descendants: 4
Recent: seat_established
```

Do not make the side panel significantly longer.

## Export Requirements

Keep existing compact exports:

```text
humanLineageMemorySummary
macroSummary.humanLineage
macroSummary.semanticTags
```

If `macroSummary.semanticTags` represents visible map tags, it should contain only decluttered visible tags.

Optional internal/debug export:

```text
macroSummary.semanticTagCandidates
```

Do not add this unless needed for tests/debugging. Avoid export bloat.

## Tests

Add:

```text
tests/v0_11_4_semantic_tag_declutter.test.js
```

Cover:

1. Default semantic tags include `H seat` when a seat exists.
2. Default semantic tags do not include `H now`, `H origin`, `H path`, `H old`, or `H descendant`.
3. `H domain` remains available but is capped.
4. `H old seat` is capped to 1-2 visible tags.
5. Same-cell collisions suppress lower-priority tags.
6. Near-cell collisions suppress lower-priority tags deterministically.
7. Major POI tags remain visible unless explicitly suppressed by higher-priority rules.
8. `B range` and `S scar` are capped.
9. `macroSummary.semanticTags` remains compact and reflects decluttered visible tags.
10. Existing V0.11.2 and V0.11.3 tests are updated if they expected hidden tags.

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
```

## Manual Verification

After implementation:

1. Run in Macro View for at least 500-700 ticks.
2. Enable Semantic Tags.
3. Confirm visible tags are sparse.
4. Confirm no obvious same-cell label stacks remain.
5. Confirm `H seat` is the primary Human continuity label.
6. Confirm `H now / H origin / H path / H descendant` do not clutter the map by default.
7. Export Recording and Macro Timeline.
8. Report:
   - final visible semantic tag list;
   - number of suppressed candidate tags if tracked;
   - whether same-cell collisions remain;
   - current seat / old seat counts.

## Expected Visual Difference

Before:

```text
Many Human tags overlap and compete:
H seat, H now, H origin, H path, H domain, H descendant.
```

After:

```text
The map shows fewer, more meaningful labels:
H seat, H old seat, H domain, and major POIs.
Human history details remain in status/export instead of cluttering the grid.
```

## Known Simplifications

Document in `README.md`:

- V0.11.4 hides low-value lineage helper tags by default.
- Hidden tags do not mean the underlying lineage data was removed.
- Semantic tag output now represents visible map tags, not every possible annotation.
- Collision handling suppresses lower-priority tags rather than offsetting them.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current `createSemanticTags` and tag rendering code.
3. Inspect V0.11.2 and V0.11.3 tests before updating expectations.
4. Keep this observer-only.
5. Do not add new mechanics.
6. Avoid unused DOM ids, obsolete labels, or dead CSS.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample decluttered tag list from a run or fixture.
