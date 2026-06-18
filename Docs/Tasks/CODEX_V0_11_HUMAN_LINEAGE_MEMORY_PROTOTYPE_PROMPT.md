# CODEX V0.11 Human Lineage Memory Prototype Task

## Summary

Implement V0.11 as the first population-perspective memory system.

The goal is to let the user discover that a current Human settlement may be the continuation or descendant of an earlier Human settlement. This should create readable historical continuity on top of the existing emergent simulation, without changing the core tri-species rules.

This task is observer-only:

- Do not add new species.
- Do not add new terrain.
- Do not add NPCs, quests, buildings, resource economy, save/load, or Zelda-style multi-screen maps.
- Do not make lineage affect movement, reproduction, combat, terrain rewrite, fertility, POIs, or decay.
- Do not add external dependencies.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11_HUMAN_LINEAGE_MEMORY_PROTOTYPE
```

## Current Context

V0.10.9.1 established a more restrained `macroMemory` layer:

- slow traces are useful but should remain subtle;
- conflict/rot memory is now less noisy;
- POI states derive from current world + memory;
- macro timeline and recording exports already include compact memory summaries.

The next layer should not be another full-map wash. It should be a selective, explainable memory layer from the perspective of a Human population shape.

The intended user experience:

```text
I can see that this Human settlement grew here,
moved or re-formed elsewhere,
and the later settlement is probably descended from the earlier one.
```

## Design Goal

Create a Human lineage tracker based on macro population shapes, not individual units.

The system should track Human settlement shapes across macro updates and produce compact lineage records:

- origin point;
- current core area;
- centroid path over time;
- old/faded settlement memory;
- collapse or decline;
- likely descendant / continuation relationship.

This should make the world feel like it has history without making the current Macro View harder to read.

## Scope

Implement only Human lineage in this version.

Do not implement Beast lineage or Spirit lineage yet.

Do not implement individual genealogy.

Do not create story text or lore names. Use neutral technical labels such as:

```text
Human Lineage 1
Human Lineage 2
descendant
collapsed
migrating
```

## Data Model

Add an observer-only `humanLineageMemory` state.

Recommended compact shape:

```js
humanLineageMemory = {
  version: "0.11",
  tick,
  nextId,
  lineages: [
    {
      id,
      parentId,
      generation,
      originTick,
      lastSeenTick,
      state,
      confidence,
      origin,
      centroid,
      centroidPath,
      areaHistory,
      activeCells,
      memoryCells,
      descendantIds,
      eventIds
    }
  ],
  events: [
    {
      id,
      tick,
      type,
      lineageId,
      parentId,
      confidence,
      x,
      y
    }
  ]
}
```

Keep exported records compact. Do not export full trace grids.

Suggested limits:

- `centroidPath`: last 24 sampled points per lineage.
- `areaHistory`: last 24 sampled area values per lineage.
- `activeCells`: cap at 80 cells per lineage.
- `memoryCells`: cap at 120 cells per lineage.
- `events`: cap exported event history to recent / meaningful events, for example 80.

## Lineage Detection

Use the existing macro population shape system as the signal source.

For each macro update:

1. Read current Human population shapes from `populationEvolutionFrame`.
2. Match current Human shapes to existing Human lineages.
3. Update matched lineages.
4. Decay or mark unmatched lineages as declining / collapsed.
5. Detect possible descendant relationships when a new Human shape appears near a previous collapsed or fading lineage.

### Matching Heuristic

Use a simple scoring model. Keep it readable and deterministic.

Recommended score inputs:

- centroid distance;
- overlap with previous active cells;
- overlap with previous memory cells;
- similar area;
- direction continuity from the previous centroid path;
- presence of connecting FIELD or Human memory trace.

Example intent:

```text
same lineage if the current shape overlaps or stays near the previous shape.
descendant if the current shape appears near the old memory/path after the previous shape collapsed or declined.
new lineage if no reasonable match exists.
```

Do not overfit. This is a prototype.

### States

Each lineage should expose one of:

```text
forming
expanding
stable
migrating
declining
collapsed
descendant
```

Suggested rules:

- `forming`: young lineage with low age.
- `expanding`: area is rising over recent samples.
- `stable`: area and centroid movement are modest.
- `migrating`: centroid moves meaningfully while shape continuity remains.
- `declining`: active area drops but memory still exists.
- `collapsed`: no active shape remains for a grace window.
- `descendant`: lineage was created as a likely continuation of an older lineage.

Use a grace window so a lineage does not collapse from one bad macro frame.

## Visualization

Use a hybrid visualization.

The normal Macro View should remain focused on current ecological evolution. Lineage should be optional and selective.

Add a lightweight UI control:

```text
Show Human Lineage
```

or add a view mode:

```text
Lineage
```

Preferred behavior:

- Default off or subtle.
- When enabled, show only the dominant/current selected Human lineage by default.
- Allow cycling/selecting a lineage if a simple control already fits the UI.
- Do not display every lineage path at full strength at the same time.

### Visual Priority

Lineage should not overpower current population shapes or POIs.

Priority:

```text
current active Human shape
selected lineage origin/current centroid/path
selected lineage old memory cells
ordinary macro memory
regional substrate
```

Recommended classes:

```text
lineage-human-origin
lineage-human-current
lineage-human-path
lineage-human-memory
lineage-human-descendant-link
```

Visual intent:

- origin: small readable marker;
- current centroid: stronger marker;
- path: thin route/trace line or sparse connected cell hints;
- memory cells: faint warm outline/fill;
- descendant link: visible but not loud.

Avoid letter clutter in the grid. Prefer color, outline, small dot/line, or corner marker.

Update Legend with a small Human Lineage section.

## Export Requirements

Add compact lineage summaries to Snapshot / Recording / Macro Timeline exports.

### Snapshot / Recording

Top-level compact field:

```js
humanLineageMemorySummary
```

Suggested shape:

```js
{
  version: "0.11",
  tick,
  lineages,
  activeLineages,
  collapsedLineages,
  descendantLinks,
  dominantLineageId,
  events
}
```

### Macro Timeline

Keep existing frame keys stable.

Add compact lineage information inside `macroSummary`:

```js
macroSummary: {
  ...
  humanLineage: {
    lineages,
    activeLineages,
    collapsedLineages,
    descendantLinks,
    dominantLineageId,
    recentEvents
  }
}
```

Do not export full lineage cell arrays inside every timeline frame unless capped and necessary.

## Event Types

Emit compact lineage events for analysis:

```text
founded
expanded
migrated
declined
collapsed
descended_from
reappeared
```

Events should be generated only when state meaningfully changes. Avoid emitting noisy repeated events every frame.

## Tests

Add:

```text
tests/v0_11_human_lineage_memory.test.js
```

Cover:

1. Human lineage memory state initializes with version `0.11`.
2. A stable Human macro shape keeps the same lineage id across updates.
3. Moving/re-forming a nearby Human shape preserves lineage or becomes a descendant according to the matching heuristic.
4. A disappeared Human shape becomes `declining` before `collapsed`.
5. A new Human shape far away becomes a new lineage, not a descendant.
6. `centroidPath` and `areaHistory` are capped.
7. Snapshot / Recording export includes compact `humanLineageMemorySummary`.
8. Macro Timeline frame `macroSummary.humanLineage` exists and remains compact.
9. Macro / Lineage visualization emits the expected CSS classes.
10. Existing macro memory and POI exports remain compatible.

Regression run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_9_macro_memory_slow_trace.test.js
node tests/v0_10_9_1_macro_memory_tuning.test.js
node tests/v0_11_human_lineage_memory.test.js
```

## Manual Verification

After implementation:

1. Run a simulation for at least 700 ticks.
2. Export Recording and Macro Timeline.
3. Report:
   - number of Human lineages;
   - active / collapsed lineage counts;
   - descendant link count;
   - dominant lineage id;
   - recent lineage events.
4. Confirm the visual layer can show a selected Human lineage without drowning out the current Macro View.
5. Confirm the export has enough information for later analysis of migration / descent.

## Expected Visual Difference

The user should be able to see:

```text
This Human population started here.
It expanded or moved along this path.
This older place faded.
This later settlement is likely connected to that older one.
```

The map should still primarily show the current ecological state. Lineage should feel like a readable historical overlay, not a new full-map color wash.

## Known Simplifications

Document these in `README.md` if implemented this way:

- Lineage is based on macro shapes, not individual Human units.
- Descendant detection is heuristic, not biological genealogy.
- Lineage does not affect simulation rules.
- Only Human lineage is implemented in V0.11.
- Lineage visibility is selective to avoid visual noise.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Review existing population evolution and macro memory code.
3. Keep code simple and readable.
4. Prefer small helper functions over a large tangled block.
5. Do not leave unused controls, dead options, or obsolete visual classes.
6. If a rule is ambiguous, choose the simplest observer-only option and document the simplification in `README.md`.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- exported lineage summary from a sample run.
