# CODEX V0.11.1 Human Lineage Visibility Pass Task

## Summary

Implement V0.11.1 as a focused visibility and usability pass for the Human Lineage Memory Prototype.

V0.11 appears to be implemented technically:

- `humanLineageMemory` exists.
- `humanLineageMemorySummary` is exported.
- `macroSummary.humanLineage` exists.
- `Show Human Lineage` exists.
- lineage CSS classes exist.
- `tests/v0_11_human_lineage_memory.test.js` passes.

However, the user cannot meaningfully see the feature in normal use. This task should make Human lineage visible enough to evaluate as a world-history layer.

Do not change the core lineage matching rules unless a small bug is discovered while wiring the display.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.1_HUMAN_LINEAGE_VISIBILITY_PASS
```

## Problem

The current V0.11 feature is too hidden and too subtle:

1. `Show Human Lineage` is inside `Advanced / Debug`.
2. The overlay is off by default.
3. The visual classes are very faint compared with current Macro View population, POI, terrain, and memory layers.
4. Only the dominant lineage is shown, but there is no visible summary explaining what is being shown.
5. Descendant links and old settlement memory are technically present but not readable as a “history path.”

The result feels like “nothing changed,” even if the data exists.

## Goal

Make the Human lineage system directly visible and testable in the UI.

The intended user experience:

```text
I can turn on Human Lineage and immediately see:
- where the dominant Human lineage began,
- where it is now,
- where it has been,
- whether it has descendants,
- and basic counts/events proving the memory system is alive.
```

This should remain an observer-only visual layer. It must not affect simulation behavior.

## Scope

This is a presentation and export-verification pass.

Do:

- improve the UI location / default behavior of the lineage toggle;
- make lineage marks visually stronger;
- add a compact lineage status readout;
- make descendant links more legible;
- keep the overlay selective enough to avoid full-map noise;
- update tests for visibility expectations.

Do not:

- add Beast or Spirit lineage;
- add individual genealogy;
- add new terrain, units, POIs, NPCs, quests, or story events;
- change movement, reproduction, combat, terrain rewrite, fertility, POIs, or decay;
- add external dependencies;
- add Zelda-style multi-screen maps.

## UI Changes

Move or duplicate the Human Lineage control out of `Advanced / Debug`.

Preferred location:

- near the view mode controls, or
- inside a visible Macro / Analysis control group.

The user should not need to open `Advanced / Debug` to discover the feature.

Recommended control:

```text
[checkbox] Show Human Lineage
```

Default behavior:

- If current view mode is `macro` or `substrateMacro`, lineage may default to visible.
- If default-on feels too noisy, keep it off but make the control visible and obvious.

Use the simpler implementation. Document the choice in `README.md`.

## Status Readout

Add a compact status readout near Macro Timeline / Legend / view controls.

Suggested fields:

```text
Human Lineages
Active
Collapsed
Descendants
Dominant
Recent Event
```

Example:

```text
Human Lineage
Lineages 3
Active 1
Collapsed 2
Descendants 1
Dominant human_lineage_002
Recent descended_from
```

This readout should update when the macro display refreshes and when the overlay is toggled.

Keep it compact. It should not make the side panel much longer than necessary.

## Visual Changes

Make selected/dominant Human lineage more legible in Macro View.

Recommended classes to strengthen:

```text
lineage-human-origin
lineage-human-current
lineage-human-path
lineage-human-memory
lineage-human-descendant-link
```

Visual intent:

- origin: clear warm marker, visually distinct from ordinary Human/FIELD.
- current: bright current-point marker.
- path: visible gold route, not just a faint 2px underline.
- memory: soft but readable old settlement trace.
- descendant link: obvious connection marker when present.

Avoid adding letters to every cell. Use marker shapes, borders, outlines, small dots, or route strokes.

Do not allow lineage styling to override:

- `terrain-block`
- POI center/core markers
- spring blocked center
- rot source core/inner ring

Visual priority should be:

```text
POI core / blocked cells
current active population shapes
selected Human lineage origin/current/path
selected Human lineage memory
ordinary macro memory
regional substrate
```

## Selective Display

Keep display selective.

V0.11.1 does not need full lineage selection UI if that would be too much.

Minimum acceptable behavior:

- show dominant active Human lineage;
- if no active lineage exists, show the most recent non-empty lineage;
- show its origin, current centroid, path, and memory cells;
- show descendant link only if the dominant lineage has `parentId` or if a direct descendant of the dominant lineage exists.

Optional if simple:

- add a small `Prev / Next Lineage` selector.

Do not implement this selector if it adds much complexity. The core goal is visibility.

## Export / Debug Verification

Keep existing compact exports.

Ensure Snapshot / Recording still include:

```text
humanLineageMemorySummary
```

Ensure Macro Timeline frames still include:

```text
macroSummary.humanLineage
```

The status readout should use the same summary data rather than duplicating logic.

## Tests

Update or add:

```text
tests/v0_11_1_human_lineage_visibility.test.js
```

Cover:

1. The Human Lineage control is visible outside `Advanced / Debug`, or there is a clearly visible duplicate control.
2. The lineage overlay can be enabled from the visible control.
3. Macro display emits visible lineage classes when lineage is enabled.
4. Origin/current/path classes are not so hidden that only one class appears in a normal stable fixture.
5. Status readout renders compact lineage counts.
6. Status readout uses `humanLineageMemorySummary` / `macroSummary.humanLineage` compatible fields.
7. Block/POI priority is preserved: lineage classes do not visually replace blocked/POI core classes.
8. Existing V0.11 lineage data/export tests still pass.

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
```

## Manual Verification

After implementation:

1. Run the simulation in Macro View for at least 500-700 ticks.
2. Enable Human Lineage from the visible UI control.
3. Confirm the dominant lineage origin/current/path are immediately visible.
4. Confirm the status readout shows nonzero lineage data once Human shapes exist.
5. Export Recording and Macro Timeline.
6. Report:
   - active lineage count;
   - collapsed lineage count;
   - descendant link count;
   - dominant lineage id;
   - recent event;
   - whether the overlay is readable without drowning out Macro View.

## Expected Visual Difference

Before:

```text
The feature exists in data, but the map looks almost unchanged.
```

After:

```text
Human Lineage is discoverable in the UI.
When enabled, the user can clearly see the dominant lineage origin, current point, recent path, old memory, and possible descendant relation.
```

## Known Simplifications

Document in `README.md`:

- V0.11.1 changes visibility/usability only.
- Human lineage remains observer-only.
- The overlay still shows one selected/dominant lineage by default.
- Descendant detection remains heuristic and macro-shape based.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current V0.11 implementation in `sim.js`, `index.html`, `style.css`, and `tests/v0_11_human_lineage_memory.test.js`.
3. Keep changes tightly scoped to lineage visibility and status presentation.
4. Remove or avoid redundant hidden controls if moving the toggle.
5. Do not leave obsolete CSS classes or unused DOM ids.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample lineage status values from a run/export.
