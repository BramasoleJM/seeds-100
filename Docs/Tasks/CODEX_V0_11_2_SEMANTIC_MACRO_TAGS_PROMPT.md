# CODEX V0.11.2 Semantic Macro Tags Task

## Summary

Implement V0.11.2 as a semantic tag overlay pass for Macro View.

Recent Human Lineage visibility work proved that color blocks alone are not enough for memory / lineage readability. The user still cannot clearly perceive lineage history or important macro meanings from color alone.

This task should replace the current weak / partially mismatched Macro Debug Icons with a more reliable `Semantic Tags` overlay.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.2_SEMANTIC_MACRO_TAGS
```

## Problem

The existing Macro Debug Icons have two issues:

1. They are based on old `macroWorld.visibleIcons` object centers.
2. The visible macro color regions now mostly come from newer population shape / memory / POI layers.

As a result, tags such as `H core` may not appear in the center of the visible yellow Human region. This makes the overlay feel unreliable.

Human lineage also remains too hard to read through color patches alone.

## Goal

Create a semantic tag overlay that clearly tells the user what important macro features are:

```text
H origin
H now
H path
H old
H descendant
H core
B range
S scar
Monument
Rot Source
Spring
Great Forest
```

Tags should be sparse, readable, and anchored to actual visible regions.

The overlay should help the user understand:

```text
What am I looking at?
Where is the important lineage history?
Which macro region or POI does this tag describe?
```

## Scope

This is an observer-only display pass.

Do:

- rename or reposition the current `Show Macro Debug Icons` concept as `Show Semantic Tags`;
- build semantic tags from current reliable sources;
- make Human Lineage readable through text tags;
- fix tag placement so labels anchor to actual represented cells;
- keep tag count sparse;
- update tests and docs.

Do not:

- change species rules;
- change terrain rules;
- change POI effects;
- change lineage matching rules except for tiny display-related fixes;
- add new terrain, units, POIs, NPCs, quests, story systems, save/load, network, or external libraries;
- implement multi-screen / Zelda-style maps.

## Data Sources

Prefer these sources for semantic tags:

1. `populationEvolutionFrame.shapes`
2. `humanLineageMemory`
3. `worldPOIs`
4. existing `macroMemory.poiStates`

Avoid using old `macroWorld.visibleIcons` as the primary source for population / lineage tags.

The old macro objects may remain as internal analysis if still needed, but the visible tag overlay should be driven by the current visual layers.

## Tag Types

### Population Shape Tags

Create sparse tags for the most important visible population shapes:

```text
H core
B range
S scar
```

Use shape type:

```text
human -> H core
beast -> B range
spirit -> S scar
```

Only show high-confidence / dominant shapes. Do not label every small shape.

Recommended cap:

```text
max 1-2 tags per species
```

### Human Lineage Tags

When Human Lineage is enabled, show semantic tags for the selected/dominant lineage:

```text
H origin
H now
H path
H old
H descendant
```

Recommended behavior:

- `H origin`: lineage origin.
- `H now`: current centroid / active settlement representative cell.
- `H path`: 1-3 sparse points from recent centroid path, not every point.
- `H old`: old memory site representative cell if active/current area has moved away.
- `H descendant`: if current lineage has `parentId`, or if selected lineage has a direct descendant.

Avoid flooding the map. The goal is a few readable landmarks.

### POI Tags

Show compact POI tags:

```text
Monument
Rot Source
Spring
Great Forest
```

These should anchor to the POI center and must respect POI visual priority.

If labels become too long, use short versions:

```text
Monument
Rot
Spring
Forest
```

## Tag Placement Rules

Do not place tags at raw mathematical centroids if that point is not inside the represented visible area.

Implement a helper similar to:

```js
representativeCellForTag({ center, preferredCells, fallbackCells })
```

Placement rule:

1. If there are core cells, choose the core cell nearest to the shape center.
2. Else use body cells nearest to center.
3. Else use edge cells nearest to center.
4. Else use a rounded centroid only if it is in bounds and not blocked.
5. Else skip the tag.

For lineage:

- `H origin`: use the nearest valid origin / memory cell.
- `H now`: use active cells nearest current centroid.
- `H path`: use valid path points near actual path / memory cells.
- `H old`: use memory cells, preferably far enough from current active cells.

For POI:

- use POI center, but if center is invalid for any reason, skip rather than drifting.

## Visual Design

Tags should be readable but not huge.

Recommended style:

```text
small pill / label
dark translucent background
light text
thin colored border by category
slight shadow
pointer/caret optional
```

Suggested categories:

```text
Human lineage: warm gold border
Population shape: species-colored border
POI: pale neutral border
Spirit / rot: purple border
Beast: green border
```

Tags should not cover too many cells. If multiple tags collide or are too close, either offset slightly or hide the lower-priority tag.

Priority:

```text
H now
H origin
H descendant
POI tags
H old
H path
population shape tags
legacy macro tags if retained
```

## UI Changes

Rename the control:

```text
Show Macro Debug Icons
```

to:

```text
Show Semantic Tags
```

or:

```text
Show Map Tags
```

Preferred wording:

```text
Show Semantic Tags
```

Place it near the Macro / Lineage controls rather than hiding it in Advanced / Debug.

If retaining the old debug toggle id for compatibility, update visible text and docs.

## Export / Timeline

This is primarily visual. Do not bloat JSON exports.

Optional compact addition if useful:

```text
macroSummary.semanticTags
```

Only include:

```js
[
  { type, label, x, y, sourceId }
]
```

Cap exported tags, for example max 24.

If adding this field risks churn, keep it test-only / internal and do not export.

Do not change existing required top-level frame keys.

## Tests

Add:

```text
tests/v0_11_2_semantic_macro_tags.test.js
```

Cover:

1. The visible UI label says `Show Semantic Tags` or `Show Map Tags`.
2. Semantic tags are generated from `populationEvolutionFrame.shapes`, `humanLineageMemory`, and `worldPOIs`, not only old `macroWorld.visibleIcons`.
3. `H core` tag anchors inside a Human population shape core/body/edge cell.
4. `H now` anchors inside or nearest to the selected lineage active cells.
5. `H origin` anchors to the lineage origin / memory area.
6. `H path` emits only sparse path tags and is capped.
7. POI tags anchor at POI centers.
8. Tag count is capped.
9. Tags are not emitted on invalid / blocked cells unless the tag is explicitly for a blocked POI center.
10. Existing V0.11 and V0.11.1 tests still pass.

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
```

## Manual Verification

After implementation:

1. Run in Macro View for 500-700 ticks.
2. Enable Human Lineage.
3. Enable Semantic Tags.
4. Confirm:
   - `H core` appears inside a visible Human region.
   - `H now` is readable and matches the selected/dominant lineage current area.
   - `H origin` marks the lineage start.
   - `H path` appears as sparse route hints, not full-map clutter.
   - POI tags identify important anchors.
   - Tags do not flood the map.
5. Export Recording / Macro Timeline if semantic tag summaries are included.
6. Report sample tags and whether tag placement matched visible regions.

## Expected Visual Difference

Before:

```text
Color blocks and faint lineage marks are hard to interpret.
Old debug labels can appear away from the visible region they supposedly describe.
```

After:

```text
The user can turn on Semantic Tags and immediately understand important macro features:
Human lineage origin/current/path, major population regions, and POIs.
Tags are anchored to the actual visible areas they describe.
```

## Known Simplifications

Document in `README.md`:

- V0.11.2 is a visual/semantic overlay pass.
- Tags are observer-only and do not affect simulation.
- Tags are sparse and selective, not a full annotation of every region.
- Human lineage tags show the selected/dominant lineage only.
- Tag placement uses representative cells rather than raw centroid placement.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect the current macro overlay rendering around `renderMacroOverlay`.
3. Inspect population shape data from `populationEvolutionFrame`.
4. Inspect Human lineage data from `humanLineageMemory`.
5. Avoid dead duplicate toggles or obsolete labels.
6. Keep implementation plain HTML/CSS/JS.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample semantic tags from a run or fixture.
