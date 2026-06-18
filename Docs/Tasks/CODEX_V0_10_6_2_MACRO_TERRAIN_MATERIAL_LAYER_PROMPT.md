# CODEX V0.10.6.2 Macro Terrain Material Layer Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.6.2 as a focused visual structure correction:

```text
Macro View must make real FIELD / WILD / MARK terrain evolution visible.
Regional substrate must become a faint undertone.
Macro masks should enhance ecological terrain, not be the only source of ecological color.
```

This is a correction after V0.10.6 and V0.10.6.1.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_6_MACRO_VISUAL_COMMUNICATION_PROMPT.md
Docs/Tasks/CODEX_V0_10_6_1_VISUAL_WEIGHT_PANEL_USABILITY_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing display behavior.

---

## User Feedback

The user reports that V0.10.6.1 still looks almost the same as V0.10.6:

```text
Regional colors are still the most visible signal.
Human / Beast / Spirit evolution is dark and hard to read.
The user cannot clearly see the ecological changes.
```

Diagnosis:

```text
V0.10.6.1 adjusted color values but did not fix the display structure.
Macro/Substrate cells still use region-base as the main background.
terrain-field / terrain-wild / terrain-mark classes exist, but their normal terrain colors are effectively bypassed in Macro View.
Ecological color appears mainly when macro masks add macro-cell-settlement / macro-cell-wild / macro-cell-scar.
Many real FIELD / WILD / MARK cells are not covered by macro masks, so they fall back to region-base and look like dark substrate.
```

This patch must fix the layer structure, not merely tune rgba values again.

---

## Hard Scope

Do not change:

```text
simulation rules
grid size
4 x 3 screen-cell substrate layout
regional substrate generation
movement / conflict / reproduction / decay / fertility dynamics
macro timeline JSON shape
recording JSON shape
snapshot JSON shape except version/docs metadata if already present
panel grouping unless a tiny CSS conflict is found
```

Do not add:

```text
Zelda-style multi-screen map
screen-to-screen propagation
new terrain types
new species
map editor
brush painting
save/load
NPCs
quests
story events
resource economy
network calls
external libraries
canvas/WebGL rewrite
final art
```

Treat this as display-only.

---

## Root Cause To Fix

Current CSS structure resembles:

```css
.grid.macro-view .cell,
.grid.substrate-view .cell {
  --region-base: ...;
  --fertility-tint: ...;
  --eco-overlay: ...;
  background:
    linear-gradient(var(--eco-overlay), var(--eco-overlay)),
    linear-gradient(var(--fertility-tint), var(--fertility-tint)),
    var(--region-base);
}
```

The missing layer is:

```text
real terrain material
```

Macro View needs a layer that responds directly to current cell terrain:

```text
terrain-field -> Human/FIELD material color
terrain-wild  -> Beast/WILD material color
terrain-mark  -> Spirit/MARK material color
terrain-border -> conflict material color
terrain-empty -> fertility-modulated empty ground
terrain-block -> hard obstacle
```

This terrain material layer must be visible even when the cell is not part of a macro mask.

---

## Required Display Hierarchy

Use this hierarchy for Macro View:

```text
Layer 1: very faint regional substrate undertone
Layer 2: real terrain material from FIELD / WILD / MARK / EMPTY / BORDER
Layer 3: macro influence enhancement from settlement / wildRecovery / scar / abandoned masks
Layer 4: route / frontier / BLOCK / units / optional macro icons
```

Use this hierarchy for Substrate + Macro View:

```text
Layer 1: readable regional substrate and screen-cell structure
Layer 2: real terrain material, still visible enough to see ecology
Layer 3: macro influence enhancement
Layer 4: route / frontier / BLOCK / units / optional macro icons
```

Important:

```text
Macro masks enhance interpretation.
They must not be the only place ecological colors appear.
The user should see FIELD/WILD/MARK evolution even before a region qualifies as settlement/recovery/scar.
```

---

## Implementation Guidance

Introduce a terrain material CSS variable or equivalent:

```css
--terrain-material: rgba(...);
```

Then compose Macro/Substrate backgrounds like:

```css
background:
  linear-gradient(var(--eco-overlay), var(--eco-overlay)),
  linear-gradient(var(--terrain-material), var(--terrain-material)),
  linear-gradient(var(--fertility-tint), var(--fertility-tint)),
  var(--region-base);
```

Recommended Macro View semantics:

```text
region-base:
  very quiet, low contrast

terrain-field:
  clear warm yellow-green / cultivated material

terrain-wild:
  clear green / wild material

terrain-mark:
  clear violet / marked material

terrain-empty:
  mostly transparent terrain-material, relies on fertility + faint region undertone

terrain-border:
  visible conflict orange/brown material

terrain-block:
  hard dark obstacle, wins over everything
```

Recommended Substrate + Macro View semantics:

```text
region-base:
  more readable than Macro View

terrain-material:
  still visible, possibly slightly more transparent than Macro View

macro overlay:
  enhancement, not replacement
```

Do not use `background-blend-mode: soft-light` if it makes ecological material muddy or dark. Prefer explicit layered colors with predictable opacity.

Avoid global `filter: saturate(...) brightness(...)` on all Macro/Substrate cells if it darkens ecological colors. If you need tonal control, apply it only to undertone layers through color choices.

---

## Concrete Acceptance Criteria

In Macro View:

```text
FIELD cells are visibly FIELD-colored even when not macro-cell-settlement.
WILD cells are visibly WILD-colored even when not macro-cell-wild.
MARK cells are visibly MARK-colored even when not macro-cell-scar.
Regional basin/refuge/hollow is only a faint undertone beneath those terrain materials.
Macro settlement/wild/scar masks strengthen or soften the corresponding material.
EMPTY cells can still show fertility variation.
BLOCK remains dominant.
Routes/frontiers remain crisp.
```

In Substrate + Macro View:

```text
Regional areas remain readable.
FIELD/WILD/MARK terrain is still visible and not swallowed by substrate.
Screen-cell boundaries remain visible but secondary.
```

---

## Tests

Add or update a focused test:

```text
tests/v0_10_6_2_macro_terrain_material_layer.test.js
```

Test the structure, not only exact color literals.

Required test coverage:

```text
style.css defines a terrain material layer variable or equivalent.
Macro/Substrate cell background includes terrain material between eco overlay and region base.
Macro View has terrain-field / terrain-wild / terrain-mark selectors that set terrain material.
Substrate + Macro View has terrain-field / terrain-wild / terrain-mark selectors that keep terrain material visible.
Macro View region-base colors remain faint undertones.
Macro mask selectors still exist and set eco-overlay as enhancement.
BLOCK selectors still override background.
Macro Timeline export shape remains unchanged.
Recording export shape remains unchanged.
Existing V0.10.6.1 panel tests still pass.
```

Recommended DOM/render test:

```text
Create or load a world with at least one FIELD, WILD, and MARK cell that is not necessarily part of a macro mask.
Render Macro View.
Assert those cells receive terrain-field / terrain-wild / terrain-mark and the CSS has matching Macro View terrain material rules.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_regional_substrate.test.js
node tests/v0_10_1_screen_cell_substrate.test.js
node tests/v0_10_2_terrain_readability_occlusion.test.js
node tests/v0_10_3_performance_macro_throttling.test.js
node tests/v0_10_4_regression_repair.test.js
node tests/v0_10_5_macro_timeline_rule_audit.test.js
node tests/v0_10_6_macro_visual_communication.test.js
node tests/v0_10_6_1_visual_weight_panel_usability.test.js
node tests/v0_10_6_2_macro_terrain_material_layer.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing tests and report the difference.

---

## Rules And Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.6.2 Macro Terrain Material Layer
```

Document:

```text
This patch is display-only.
Macro View uses real terrain material as the primary ecological visual layer.
FIELD / WILD / MARK remain visible even when not part of a macro mask.
Regional substrate is a faint undertone in Macro View.
Substrate + Macro View keeps geography readable while preserving ecological terrain visibility.
Macro masks enhance ecological material but do not replace terrain visibility.
No simulation rules, map size, substrate generation, timeline shape, recording shape, or snapshot shape are changed.
```

Update the rules version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.6.2_MACRO_TERRAIN_MATERIAL_LAYER
```

Update `README.md` with a short note explaining:

```text
Macro View now prioritizes real FIELD/WILD/MARK terrain material.
Substrate + Macro View is for reading geography plus ecology together.
V0.10.6.2 does not change rules or map generation.
```

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Run 200-400 ticks.
4. Confirm FIELD / WILD / MARK areas are visibly bright enough to follow as they change.
5. Confirm the regions are still faintly present but not visually dominant.
6. Confirm non-macro-mask FIELD/WILD/MARK cells are still readable.
7. Select Substrate + Macro View.
8. Confirm geography is readable without swallowing ecological terrain.
9. Confirm BLOCK, route, frontier, and units remain readable.
10. Export Recording JSON and Macro Timeline JSON once to confirm export shapes still work.
```

Expected result:

```text
Macro View should no longer feel like a region map with dim ecology.
It should feel like an ecology-evolution map with faint geographic substrate underneath.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.6.2 rule sections are implemented
tests run
whether timeline export shape was preserved
whether recording export shape was preserved
whether snapshot export shape was preserved
known simplifications or deviations
expected Macro View visual difference
expected Substrate + Macro View visual difference
```

