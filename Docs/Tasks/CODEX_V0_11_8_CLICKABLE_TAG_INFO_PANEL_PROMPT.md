# CODEX V0.11.8 Clickable Tag Info Panel Task

## Summary

Implement V0.11.8 as a clickable semantic tag info panel.

V0.11.7 added polity visual identity and richer `title` hover text, but hover is unreliable / not useful enough in practice. The user wants all map tags to be clickable and show a small popup/panel with key information.

This task should make semantic tags inspectable.

Update the rules/version label to:

```text
TRI_SPECIES_WORLD_SIM_V0.11.8_CLICKABLE_TAG_INFO_PANEL
```

## Scope

UI / display only.

Do not change:

- simulation rules;
- movement;
- lifecycle;
- conflict;
- terrain rewrite;
- reproduction;
- fertility;
- POI effects;
- seat/outpost/polity detection rules unless a tiny data plumbing bug is found;
- macro timeline frame top-level keys.

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

Keep implementation plain HTML/CSS/JS.

## Problem

Current semantic tags already carry useful fields:

```js
label
type
x
y
source
sourceId
polityId
polityState
polityColorIndex
lineageId
state
support
pressure
splitFromPolityId
abandonedTick
reason
title
```

But native hover is not sufficient. The user needs a readable click panel.

## Goal

Clicking any visible semantic tag should open a compact info panel showing:

```text
Identity
Ownership / relation
State
Metrics
Interpretation
```

The panel should help the user understand:

```text
What is this tag?
Which polity / lineage does it belong to?
Is it active, pressured, corrupted, old, promotable?
Why should I care about it?
```

## UI Behavior

### Opening

When the user clicks a semantic tag:

```text
open a small info panel
```

Preferred placement:

- near the clicked tag if simple and does not overflow; or
- fixed in the side panel / top-right of the simulation shell.

Choose the simpler, robust option.

Recommendation:

```text
Use a fixed compact panel over the simulation shell or in the side panel.
```

### Closing

Panel should close when:

```text
user clicks Close / X
user presses Escape
user clicks another tag, replacing panel content
simulation reset clears selected tag
```

Do not require hover.

### Persistence During Simulation

If simulation continues running:

- selected tag can remain visible until closed;
- if the exact tag disappears, panel may show a stale notice:

```text
This tag is no longer visible in the latest macro frame.
```

First version may simply keep last clicked data static.

Document the simplification.

## Panel Content Model

Use one formatter function:

```js
formatSemanticTagInfo(tag)
```

Return sections:

```js
{
  title,
  subtitle,
  rows,
  interpretation
}
```

Render rows as label/value pairs.

Avoid dumping raw JSON.

## Required Panel Fields By Tag Type

### H Seat / H Pressured Seat

For:

```text
H seat
H pressured seat
```

Show:

```text
Title: H seat / H pressured seat
Subtitle: Human polity center at (x, y)
Polity
Polity state
Lineage
Seat state
Support
Pressure
Split from, if present
Position
Interpretation
```

Interpretation examples:

```text
stable capital
capital under pressure
corrupted / unstable capital
```

### H Village

Show:

```text
Title: H village
Subtitle: Local settlement at (x, y)
Polity
Polity state
Lineage
Village state
Support
Pressure
Position
Interpretation
```

If available later:

```text
First seen
Last seen
```

Interpretation:

```text
local settlement inside polity domain
```

### H Outpost

Show:

```text
Title: H outpost
Subtitle: Distant Human settlement at (x, y)
Polity
Polity state
Lineage
Outpost state
Support
Pressure
Split from, if present
Position
Interpretation
```

Interpretation examples:

```text
distant Human outpost
possible future seat
split-polity frontier
```

### H Old Seat

Show:

```text
Title: H old seat
Subtitle: Abandoned Human seat at (x, y)
Polity
Polity state
Lineage
Reason abandoned
Abandoned tick
Split from, if present
Position
Interpretation
```

Interpretation:

```text
abandoned former capital
```

### H Domain

Current `H domain` may not always have reliable polity ownership.

Show:

```text
Title: H domain
Subtitle: Human population domain at (x, y)
Source shape id
Polity, if present
Lineage, if present
Position
Interpretation
```

Interpretation:

```text
current Human-controlled macro region
```

If polity is missing:

```text
Polity: not assigned
```

### POI Tags

For:

```text
Rot Source
Spring
Great Forest
Monument
```

Show:

```text
Title
Subtitle: Point of Interest at (x, y)
Id
Type
Role
Position
Interpretation
```

Interpretation / Role:

```text
Rot Source: persistent rot / corruption anchor
Spring: fertility support, blocked center
Great Forest: Beast / WILD habitat and origin
Monument: Human / FIELD memory support
```

### B Range / S Scar

Show:

```text
Title: B range / S scar
Subtitle: Population macro shape at (x, y)
Source shape id
Position
Interpretation
```

Interpretation:

```text
B range: Beast activity range
S scar: persistent Spirit / MARK scar
```

## Styling

Panel should be compact and readable.

Recommended:

```text
dark translucent background
1px border
small title
rows in two-column label/value layout
interpretation sentence at bottom
close button
```

If tag has `polityColorIndex`, use the same polity accent color:

```text
left border / top border / title accent
```

Do not cover too much of the map.

Do not make the side panel much longer.

## Accessibility / Interaction

Use a real button for close.

Make tag elements keyboard-focusable if practical:

```html
tabindex="0"
role="button"
```

Enter / Space on focused tag may open panel if simple.

Escape closes panel.

Keep native `title` as fallback if already present.

## Data Plumbing

Rendered macro tag elements should store enough data to open the panel.

Recommended:

```js
el.dataset.tagIndex = String(index)
```

Keep latest rendered semantic tag list in memory:

```js
currentSemanticTags
```

On click:

```js
const tag = currentSemanticTags[index]
showSemanticTagInfo(tag)
```

Avoid serializing large JSON into DOM attributes.

## Tests

Add:

```text
tests/v0_11_8_clickable_tag_info_panel.test.js
```

Cover:

1. Macro tag elements are clickable / have `role="button"` or event handler.
2. Clicking `H village` opens panel with polity id, lineage id, state, support, pressure.
3. Clicking `H seat` / `H pressured seat` opens panel with polity state, seat state, support, pressure.
4. Clicking `H old seat` shows abandoned reason and tick when available.
5. Clicking POI tag shows role / interpretation.
6. Panel uses polity accent when `polityColorIndex` exists.
7. Close button hides panel.
8. Escape closes panel if keyboard handling is implemented.
9. Existing semantic tag exports remain compact.
10. Existing V0.11.7 tests still pass.

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
```

## Manual Verification

After implementation:

1. Run Macro View.
2. Enable Semantic Tags.
3. Click:
   - `H seat`
   - `H pressured seat`
   - `H village`
   - `H outpost`
   - `H old seat`
   - one POI tag
4. Confirm each panel shows useful information and interpretation.
5. Confirm close works.
6. Confirm panel does not block too much of the map.
7. Export Recording / Macro Timeline and confirm semantic tag fields remain compact.

## Expected Visual Difference

Before:

```text
Tags are colored by polity, but hover is not enough to inspect details.
```

After:

```text
Clicking a tag opens a readable panel explaining identity, ownership, state, metrics, and interpretation.
```

## Known Simplifications

Document in `README.md`:

- The info panel shows the clicked tag snapshot; it may not live-update if the tag disappears while simulation runs.
- Native title remains as fallback.
- Panel uses existing semantic tag fields and does not query historical records deeply.

## Executor Notes

Before editing code:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Inspect current semantic tag generation and rendering.
3. Inspect existing polity visual identity fields.
4. Keep the implementation small and local.
5. Do not change simulation rules.

After changes, report:

- files changed;
- how to run;
- which rule/doc sections were updated;
- known simplifications or deviations;
- test results;
- sample panel contents for one Human tag and one POI tag.
