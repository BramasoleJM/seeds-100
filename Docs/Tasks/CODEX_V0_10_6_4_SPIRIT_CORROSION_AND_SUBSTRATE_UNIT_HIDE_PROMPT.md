# CODEX V0.10.6.4 Spirit Corrosion And Substrate Unit Hide Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.6.4 as a small display-only visual semantics pass:

```text
1. Spirit MARK / scar should read as corrosion / abnormal space, not soft ecological blending.
2. Human FIELD and Beast WILD may keep soft transitions.
3. Substrate + Macro View should temporarily hide H / B / S unit letters so we can test pure color readability.
```

This follows V0.10.6.3 Pale Base Macro Ecology Readability.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_6_3_PALE_BASE_MACRO_ECOLOGY_READABILITY_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing display behavior.

---

## User Feedback

The user says V0.10.6.3 is broadly better, then requests a small experiment:

```text
Spirit purple MARK cells should not blend like other terrain.
MARK is more like corrosion / abnormal space.
Human and Beast terrain can have transitions because village / nature boundaries can blend.
Spirit purple should be obvious.
If Spirit has transition, it should not participate in the same overlay logic.
Also try removing H / B / S letters in Macro + Substrate mode and judge pure color readability.
```

Interpret "Macro + Substrate mode" as the existing `Substrate + Macro View` / `substrateMacro` mode.

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
panel layout
```

Do not add:

```text
new terrain types
new species
Zelda-style multi-screen map
screen-to-screen propagation
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

## Target Visual Semantics

Human and Beast:

```text
FIELD and WILD can remain ecological materials.
Their boundaries may use soft edge / fringe because village, field, and wild nature can transition.
```

Spirit:

```text
MARK should read as corrosion, scar, or abnormal space.
MARK should be clear, high-contrast, and less blended with region / fertility / eco overlays.
Spirit scar should not feel like a gentle purple biome.
```

View-specific unit display:

```text
Cell View keeps H / B / S letters.
Macro View may keep H / B / S letters unless current implementation already hides them.
Substrate + Macro View hides H / B / S letters so the user can judge pure color / terrain readability.
```

---

## Part 1: Make MARK A Corrosion Layer

Current problem:

```text
macro-cell-scar participates in the same soft edge and fringe system as settlement and wild recovery.
terrain-mark is blended through the same layered background as FIELD and WILD.
This makes Spirit influence feel like another soft ecological material.
```

Required behavior:

```text
Macro View MARK cells should be visibly purple and sharp.
Substrate + Macro View MARK cells should remain visibly purple even over substrate colors.
MARK should be less affected by fertility tint and regional undertone than FIELD / WILD.
```

Recommended CSS approach:

```text
For .terrain-mark in Macro View:
  use a stronger or near-solid purple terrain material.
  consider replacing the normal layered background with a more direct purple background.
  add a subtle corrosive pattern such as small dark cracks / spots if it improves readability.

For .terrain-mark in Substrate + Macro View:
  keep substrate context, but MARK must remain clearly purple.
```

Do not make MARK look like final art. This is still a prototype readability pass.

---

## Part 2: Separate Spirit Scar From Soft Ecology

Current `softenMacroMaskEdges()` treats all influence types similarly:

```text
settlement
abandoned
wild
scar
```

Required behavior:

```text
settlement and wild may keep soft edge / fringe.
scar should not receive a strong visible fringe in Macro View.
scar can receive a crisp edge or corrosion marker instead.
```

Acceptable implementation options:

```text
Option A: keep generating macro-fringe-scar, but make .grid.macro-view .macro-fringe-scar visually inactive.
Option B: modify softenMacroMaskEdges() so scar gets macro-soft-core / macro-soft-edge but no fringe.
Option C: give scar a separate class path, such as macro-corrosion-edge, and do not use macro-fringe-scar in Macro View.
```

Prefer the simplest readable implementation. If touching JS, keep it small and well-tested.

Recommended visual treatment:

```text
macro-cell-scar = crisp dark-violet outline / inner crack / high contrast purple signal.
macro-soft-edge on scar = weaker outline only, not a blended wash.
macro-fringe-scar in Macro View = disabled or nearly invisible.
```

Human and Beast should keep their current soft transition behavior unless a direct conflict appears.

---

## Part 3: Hide H / B / S Letters In Substrate + Macro View

Current unit letters can distract from reading pure color and substrate/ecology layers.

Required behavior:

```text
Cell View keeps unit letters.
Substrate + Macro View hides unit letters.
Macro View can keep its existing behavior unless hiding in Macro View is necessary for implementation simplicity.
```

Recommended CSS approach:

```css
.grid.substrate-view .cell[data-unit] {
  color: transparent;
  text-shadow: none;
}
```

Be careful:

```text
Do not clear dataset.unit.
Do not alter simulation data.
Do not alter JSON exports.
This is visual only.
```

If the current CSS already hides all macro-mode text, document that and make sure tests explicitly protect Substrate + Macro View pure-color behavior.

---

## Tests

Add or update:

```text
tests/v0_10_6_4_spirit_corrosion_substrate_unit_hide.test.js
```

Required coverage:

```text
Macro View terrain-mark has stronger / more direct visual treatment than ordinary ecological soft overlay.
Macro View macro-fringe-scar is absent, disabled, or near-invisible compared with macro-fringe-settlement / macro-fringe-wild.
macro-cell-scar still exists as a readable macro recognition class.
FIELD / WILD soft transition classes remain available.
Substrate + Macro View hides H / B / S letters visually without removing dataset.unit.
Cell View still shows H / B / S letters.
Timeline export shape remains unchanged.
Recording export shape remains unchanged.
Snapshot export shape remains unchanged except docs/version metadata if present.
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
node tests/v0_10_6_4_spirit_corrosion_substrate_unit_hide.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing tests and report the difference.

---

## Rules And Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.6.4 Spirit Corrosion And Substrate Unit Hide
```

Document:

```text
This patch is display-only.
Spirit MARK / scar uses a sharper corrosion visual language rather than the same soft transition language as FIELD / WILD.
Human FIELD and Beast WILD may keep soft ecological transitions.
Substrate + Macro View hides H / B / S unit letters for a pure color readability experiment.
Cell View keeps unit letters.
No simulation rules, map size, substrate generation, timeline shape, recording shape, or snapshot shape are changed.
```

Update the rules version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.6.4_SPIRIT_CORROSION_SUBSTRATE_UNIT_HIDE
```

Update `README.md` with a short note explaining:

```text
MARK is now displayed as corrosion / abnormal space in macro modes.
Substrate + Macro View hides unit letters to help evaluate color-only readability.
V0.10.6.4 changes display only.
```

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Confirm MARK / scar reads as clear purple corrosion, not soft purple biome.
4. Confirm FIELD and WILD still have reasonable soft transitions.
5. Select Substrate + Macro View.
6. Confirm H / B / S letters are hidden.
7. Confirm color-only reading still reveals Human / Beast / Spirit effects.
8. Confirm Cell View still shows H / B / S letters.
9. Confirm BLOCK, frontier, and route remain readable.
10. Export Snapshot JSON, Recording JSON, and Macro Timeline JSON once to confirm export shapes still work.
```

Expected result:

```text
Spirit influence should feel more alien / corrosive and easier to spot.
Substrate + Macro View should be cleaner for evaluating color and geography without letter clutter.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.6.4 rule sections are implemented
tests run
whether timeline export shape was preserved
whether recording export shape was preserved
whether snapshot export shape was preserved
known simplifications or deviations
expected Spirit / MARK visual difference
expected Substrate + Macro View unit-letter difference
```

