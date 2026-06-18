# CODEX V0.10.6.3 Pale Base Macro Ecology Readability Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.6.3 as a focused Macro View readability correction:

```text
Use a pale, low-contrast base.
Make FIELD / WILD / MARK ecological evolution visually dominant.
Reduce transition / fringe blending so macro emergence shapes remain readable.
Keep regional substrate as a faint geographic hint, not a major color field.
```

This is a correction after V0.10.6, V0.10.6.1, and V0.10.6.2.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_6_MACRO_VISUAL_COMMUNICATION_PROMPT.md
Docs/Tasks/CODEX_V0_10_6_1_VISUAL_WEIGHT_PANEL_USABILITY_PROMPT.md
Docs/Tasks/CODEX_V0_10_6_2_MACRO_TERRAIN_MATERIAL_LAYER_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing display behavior.

---

## User Feedback

The user says V0.10.6.2 is somewhat better, but still not good enough:

```text
Human / Beast / Spirit emergent evolution traces are still hard to see.
Transitions and overlays may be too strong.
Regional color is still too noticeable.
The macro pattern recognition may have become visually blurred.
Maybe the base and region colors should become pale / whitish, while ecological evolution stays vivid.
```

Treat this as a visual language problem, not a simulation problem.

---

## Current Diagnosis

V0.10.6.2 added a real terrain material layer:

```css
background:
  linear-gradient(var(--eco-overlay), var(--eco-overlay)),
  linear-gradient(var(--terrain-material), var(--terrain-material)),
  linear-gradient(var(--fertility-tint), var(--fertility-tint)),
  var(--region-base);
```

But the current implementation still has problems:

```text
1. Macro View region-base values are dark.
   FIELD / WILD / MARK are semi-transparent over a dark base, so the result remains muddy.

2. Eco overlays, soft edges, and fringes all add color on top.
   This makes region boundaries and ecological boundaries blur together.

3. macro-fringe-* expands influence into neighboring cells.
   That softens edges but weakens the readable shape of settlement / wild / scar regions.

4. Substrate + Macro View still needs geography, but Macro View should prioritize ecological evolution.
```

The next fix should change the visual grammar:

```text
Macro View should feel like a pale map with clear ecological color on top.
It should not feel like a dark substrate map with transparent ecology.
```

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
panel layout unless a tiny CSS conflict is found
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

## Target Visual Grammar

### Macro View

Macro View's job:

```text
watch ecological emergence and evolution over time
```

Use this hierarchy:

```text
1. pale map-paper base
2. very faint region tint / hint
3. vivid real terrain material for FIELD / WILD / MARK / BORDER
4. crisp macro recognition aids for settlement / wild recovery / scar / abandoned
5. crisp route / frontier / BLOCK / units / optional macro icons
```

Required result:

```text
FIELD / WILD / MARK should read immediately.
Region bias should be visible only after looking more carefully.
Macro mask shapes should be readable, not blurred into a fog.
```

### Substrate + Macro View

Substrate + Macro View's job:

```text
read geography and ecology together
```

Use this hierarchy:

```text
1. pale but clearer region base than Macro View
2. visible terrain material
3. screen-cell structure and substrate pattern
4. macro aids
```

Substrate can show basin / refuge / hollow more clearly than Macro View, but it must not swallow FIELD / WILD / MARK.

---

## Required CSS Direction

### 1. Change Macro View region base to pale colors

Replace dark Macro View region bases with pale, close-value colors.

Suggested direction:

```text
region-none   = pale neutral gray / parchment
region-basin  = pale warm cream
region-refuge = pale cool green-gray
region-hollow = pale cool lavender-gray
```

These must be subtle. They should not look like colored territories.

Avoid:

```text
dark brown / dark green / dark purple region blocks
high-saturation region bases
strong substrate pattern in Macro View
```

### 2. Make terrain material more direct and less muddy

In Macro View:

```text
terrain-field should be a clearly visible cultivated yellow-green.
terrain-wild should be a clearly visible green.
terrain-mark should be a clearly visible violet.
terrain-border should remain visible.
terrain-empty should mostly show pale base + subtle fertility tint.
```

Prefer higher-opacity or near-solid terrain material over many transparent layers.

### 3. Reduce transition / fringe dominance

Macro View:

```text
macro-soft-edge may remain, but should not erase the core shape.
macro-fringe-* should be extremely subtle or disabled in Macro View.
Fringe should not create a second large fuzzy territory around every macro region.
```

Acceptable approaches:

```text
A. Keep generating fringe classes but set Macro View fringe opacity almost invisible.
B. Do not apply fringe classes in Macro View, but keep them for Substrate + Macro View.
C. Replace fringe fill with a tiny outline / border hint.
```

Prefer the simplest approach that preserves tests and readability.

### 4. Make macro masks identify, not repaint

Macro masks should enhance recognition:

```text
settlement = crisp border / small highlight / stronger core texture
wild recovery = crisp border / small highlight / light texture
scar = crisp border / small highlight / light texture
abandoned = muted hatch / outline
```

Avoid using macro masks as broad opaque fill layers in Macro View.

### 5. Preserve BLOCK, route, and frontier clarity

```text
BLOCK remains dark and obvious.
route remains readable.
frontier remains readable.
units remain readable when shown.
```

---

## Concrete Acceptance Criteria

In Macro View:

```text
The map background is overall pale rather than dark.
basin / refuge / hollow are faint undertones, not the strongest colors.
FIELD / WILD / MARK are the strongest area colors.
Non-macro-mask FIELD / WILD / MARK cells are readable.
macro-cell-settlement / macro-cell-wild / macro-cell-scar improve recognition without covering the whole shape in fog.
macro-fringe-* does not visibly dominate or blur the macro pattern.
Frontiers, routes, and BLOCK remain crisp.
```

In Substrate + Macro View:

```text
Regional geography is clearer than Macro View.
FIELD / WILD / MARK remain readable.
screen-cell boundaries are visible but secondary.
```

---

## Tests

Add or update:

```text
tests/v0_10_6_3_pale_base_macro_ecology_readability.test.js
```

Test structure and intent, not only exact pixel colors.

Required coverage:

```text
Macro View region-base colors are pale / high-luminance compared with previous dark bases.
Macro View terrain-field / terrain-wild / terrain-mark use stronger terrain material than region tint.
Macro View macro-fringe-* is absent, near-transparent, or explicitly constrained.
Macro View macro masks still exist for settlement / wild / scar.
Substrate + Macro View keeps region classes and terrain material.
BLOCK override still exists.
Timeline export shape remains unchanged.
Recording export shape remains unchanged.
Snapshot export shape remains unchanged except docs/version metadata if present.
Existing V0.10.6.1 and V0.10.6.2 tests still pass, updating only if they asserted the old dark-base color literals.
```

Recommended DOM / CSS check:

```text
Render Macro View with FIELD / WILD / MARK cells.
Confirm rendered cells include terrain-field / terrain-wild / terrain-mark classes.
Confirm CSS provides Macro View terrain material rules for those classes.
Confirm Macro View region classes do not use dark territory colors.
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
node tests/v0_10_6_3_pale_base_macro_ecology_readability.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing tests and report the difference.

---

## Rules And Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.6.3 Pale Base Macro Ecology Readability
```

Document:

```text
This patch is display-only.
Macro View uses a pale base so ecological terrain is not muddied by dark substrate.
FIELD / WILD / MARK are the primary visual colors for ecological evolution.
Regional substrate is only a faint undertone in Macro View.
Macro fringe / transition effects are reduced so emergent macro shapes remain readable.
Substrate + Macro View keeps stronger geography while preserving ecological terrain visibility.
No simulation rules, map size, substrate generation, timeline shape, recording shape, or snapshot shape are changed.
```

Update the rules version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.6.3_PALE_BASE_MACRO_ECOLOGY_READABILITY
```

Update `README.md` with a short note explaining:

```text
Macro View is now the ecology-evolution reading mode.
Substrate + Macro View is the geography-plus-ecology reading mode.
V0.10.6.3 changes display only.
```

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Confirm the overall map base is pale, not dark.
4. Run 200-400 ticks.
5. Confirm FIELD / WILD / MARK evolution is immediately visible.
6. Confirm basin / refuge / hollow are faint hints, not dominant regions.
7. Confirm settlement / wild recovery / scar macro shapes are readable rather than fuzzy.
8. Select Substrate + Macro View.
9. Confirm regional geography is clearer than Macro View while ecology remains visible.
10. Confirm BLOCK, route, frontier, and units remain readable.
11. Export Recording JSON and Macro Timeline JSON once to confirm export shapes still work.
```

Expected result:

```text
Macro View should finally read as an ecology-evolution map.
The user should see Human / Beast / Spirit spreading, shrinking, and colliding before noticing region substrate.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.6.3 rule sections are implemented
tests run
whether timeline export shape was preserved
whether recording export shape was preserved
whether snapshot export shape was preserved
known simplifications or deviations
expected Macro View visual difference
expected Substrate + Macro View visual difference
```

