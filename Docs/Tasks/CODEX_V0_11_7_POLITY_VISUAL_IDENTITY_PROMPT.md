# CODEX V0.11.7 Polity Visual Identity Task

## Summary

Implement V0.11.7 as a Human polity visual identity pass.

V0.11.6 added observer-only Human polities and villages. The data exists, but the map does not visually communicate polity identity:

- `humanPolitySummary` exists.
- `macroSummary.humanPolity` exists.
- villages know `polityId` in summary/export.
- but visible Human semantic tags do not carry `polityId`.
- all Human tags look like the same Human group.
- hover text is too shallow to explain ownership/state.

This task should make polity identity visible and inspectable.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.7_POLITY_VISUAL_IDENTITY
```

## Scope

Observer-only UI / display / export refinement.

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
- actual buildings;
- NPCs;
- quests;
- resource economy;
- save/load;
- external dependencies;
- multi-screen maps.

Human polity identity is a visualization and analysis layer only.

## Problems To Fix

### 1. Tags Do Not Carry Polity Identity

Current exported `macroSummary.semanticTags` has Human tags such as:

```text
H seat
H pressured seat
H village
H outpost
H old seat
H domain
```

But they do not include:

```text
polityId
polityState
colorIndex
lineageId
```

The user cannot see which polity a tag belongs to.

### 2. No Visual Difference Between Human Polities

Different Human polities should be visually distinguishable at the tag level.

Do not recolor the entire terrain/domain yet. Start with tag fill / border / accent color.

### 3. Hover Text Is Too Sparse

Current tag title only says something like:

```text
H village: polity
```

The user needs hover detail:

```text
H village
Polity: human_polity_003
Polity state: active
Lineage: human_lineage_034
State: active
Support: 48.25
Pressure: 2
Split from: human_polity_001
```

## Goals

The user should be able to inspect the map and understand:

```text
These H villages belong to the same polity as this H seat.
This pressured seat belongs to another polity.
This polity split from an earlier one.
This village is active / pressured / fading.
```

## Semantic Tag Data Contract

Extend semantic tag objects for Human tags.

Recommended fields:

```js
{
  type,
  label,
  x,
  y,
  source,
  sourceId,
  polityId,
  polityState,
  polityColorIndex,
  lineageId,
  state,
  support,
  pressure,
  splitFromPolityId,
  title
}
```

Do not add these fields to non-Human POI tags unless useful.

Human tag coverage:

```text
H seat -> polityId, lineageId, state, support, pressure
H pressured seat -> polityId, lineageId, state, support, pressure
H old seat -> polityId, lineageId, state/reason, abandonedTick if compact
H outpost -> polityId, lineageId, state, support, pressure
H village -> polityId, lineageId, state, support, pressure
H domain -> polityId if assignable, lineageId if known
```

If `H domain` cannot be reliably assigned, either:

- omit `polityId`, or
- assign by nearest/current lineage only when confidence is high.

Do not invent IDs.

## Visual Design

Add a stable palette for Human polity tags.

Example:

```text
polity color 0: warm gold
polity color 1: amber
polity color 2: teal
polity color 3: rose
polity color 4: sky blue
polity color 5: lime
polity color 6: lavender
polity color 7: coral
```

Use color on:

```text
tag fill
tag border
small left accent strip
or text shadow/accent
```

Recommended:

```text
dark translucent base + polity-colored border/accent
```

Avoid turning the map into a rainbow. Keep tags readable against current macro view.

Polity color should be stable:

```text
same polityId -> same colorIndex across run
```

Use existing `polity.colorIndex` if already available.

## CSS / DOM Requirements

Rendered macro tag elements should expose polity identity:

```html
data-polity-id="human_polity_003"
data-polity-color="4"
data-lineage-id="human_lineage_034"
data-tag-state="active"
```

Apply class or CSS variable:

```text
polity-color-0 ... polity-color-7
```

or:

```js
el.style.setProperty("--tag-polity-color", color)
```

Choose the simplest style consistent with existing code.

## Hover / Tooltip

Use native `title` at minimum.

Build human-readable multi-line title text:

```text
H village
Polity: human_polity_003
Polity state: active
Lineage: human_lineage_034
State: active
Support: 48.25
Pressure: 2
Split from: human_polity_001
```

For seat:

```text
H pressured seat
Polity: human_polity_006
Polity state: pressured
Lineage: human_lineage_014
Seat state: corrupted
Support: 40.65
Pressure: 10
```

For POI tags, current title can remain simple.

## Status Readout

Optionally enhance existing Human Polity status with a compact color/key list.

Suggested if simple:

```text
Dominant human_polity_003
Active 2
Pressured 4
Villages 3
```

Do not make the side panel much longer.

If adding a mini legend:

```text
colored dot + polity id + state
```

Cap to top 4 polities.

## Village Stability Note

Do not fully solve village flicker in this task unless trivial.

However, if hover/status work touches village rendering, ensure:

- village ids remain in summaries;
- village title includes firstSeen/lastSeen if useful;
- village state is visible.

A later task can address village persistence if needed.

## Export Requirements

Keep:

```text
humanPolitySummary
macroSummary.humanPolity
macroSummary.semanticTags
```

Ensure `macroSummary.semanticTags` includes polity fields for visible Human tags.

Do not export full cell arrays.

Do not change required top-level frame keys.

## Tests

Add:

```text
tests/v0_11_7_polity_visual_identity.test.js
```

Cover:

1. Human semantic tags include `polityId` when they come from polity-owned seats/villages/outposts.
2. `H village` tags include `polityId`, `lineageId`, `state`, `support`, and `pressure`.
3. `H seat` / `H pressured seat` tags include `polityId`, `polityState`, `lineageId`, `support`, and `pressure`.
4. `macroSummary.semanticTags` preserves compact polity identity fields.
5. Rendered macro tag DOM includes `data-polity-id` / color class or CSS variable.
6. Rendered tag `title` includes polity and state details.
7. Same `polityId` uses stable `colorIndex`.
8. Non-Human POI tags are not required to have polity fields.
9. Existing V0.11.6 polity/village tests still pass.

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
```

## Manual Verification

After implementation:

1. Run Macro View for 700-900 ticks.
2. Enable Semantic Tags.
3. Confirm:
   - Human tags from the same polity share a visible color/accent.
   - different polities have distinguishable tag accents.
   - hover over `H village` shows polity id and state.
   - hover over `H seat` / `H pressured seat` shows polity, lineage, support, pressure.
   - exported `macroSummary.semanticTags` contains polity fields.
4. Export Recording and Macro Timeline.
5. Report:
   - active polity count;
   - dominant polity id;
   - sample Human semantic tags with polity fields;
   - sample hover title text;
   - whether polity color identity is visually readable.

## Expected Visual Difference

Before:

```text
All Human tags look alike.
The user cannot tell which seat/village/outpost belongs to which polity.
Hover gives too little information.
```

After:

```text
Human tags carry polity identity.
Same-polity tags share a color accent.
Hover reveals polity, lineage, state, support, and pressure.
The user can inspect polity changes directly from the map.
```

## Known Simplifications

Document in `README.md`:

- Polity color applies to tags only, not full terrain/domain fill.
- Hover uses native title unless a custom tooltip already exists.
- Village flicker is not solved in V0.11.7.
- Polity identity remains observer-only.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect V0.11.6 polity/village implementation.
3. Inspect `createSemanticTags` and macro tag rendering.
4. Keep the tag data compact.
5. Avoid reintroducing hidden noisy tags.
6. Keep implementation plain HTML/CSS/JS.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample semantic tag output with polity fields.
