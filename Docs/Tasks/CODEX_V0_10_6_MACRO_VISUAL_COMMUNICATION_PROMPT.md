# CODEX V0.10.6 Macro Visual Communication Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.6 as a focused visual communication pass for Macro View and Substrate + Macro View:

```text
1. make underlying regional geography readable at a glance
2. make Human / Beast / Spirit land influence feel like soft material changes instead of hard-edged blocks
3. define the display hierarchy between regional substrate and ecological terrain influence
4. make EMPTY cells visually more informative through fertility shading if it improves readability
```

This follows:

```text
V0.10 Regional Substrate
V0.10.1 Screen-Cell Substrate
V0.10.2 Terrain Readability And Occlusion
V0.10.3 Performance And Macro Throttling
V0.10.4 Regression Repair
V0.10.5 Macro Timeline And Rule Audit
```

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_SIDE_CHAT_MEMORY_CN.md
Docs/Tasks/CODEX_V0_10_5_MACRO_TIMELINE_AND_RULE_AUDIT_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing display behavior.

---

## User Requirements

The user says this round of timeline work can pause for now. Do not change Macro Timeline JSON shape in this pass unless a test has to be adjusted for a purely visual class name.

The user wants the next step to tune Macro View visual communication:

```text
1. In Macro View, different regional areas are not directly readable.
2. Human / Beast / Spirit land boundaries are too sharp; add softer gradient / blurred transition similar to terrain material blending.
3. Clarify display logic between fixed world regions and land changed by Human / Beast / Spirit.
4. Consider showing EMPTY by fertility instead of flat gray-black, but avoid rule conflicts.
```

Treat this as display-only unless the rules file explicitly documents a tiny display-derived export field.

---

## Hard Scope

Do not add:

```text
new gameplay rules
new species
new terrain types
actual Zelda-style multi-screen gameplay
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
timeline format changes
```

Do not alter:

```text
movement rules
conflict rules
reproduction rules
terrain decay rules
fertility dynamics
regional substrate generation logic
macro timeline export shape
recording export shape
```

If you discover a bug while working, document it separately and keep this patch visual unless it blocks the task.

---

## Key Diagnosis

The current data already contains regional geography:

```text
regionBias: none | basin | refuge | hollow
regionalSubstrate.layout.cells with 4 x 3 logical screen cells
fertility levels from 0 to 4
macro display masks for settlement / abandoned / wildRecovery / scar / frontier / route
```

The current visual problem is that Macro View mainly shows ecological macro masks, while the stable regional substrate is not strong enough to read as the world's base geography. The user sees colored macro patches but not "this is a basin / refuge / hollow area."

The second problem is that macro masks and terrain colors look like hard categories. Human FIELD, Beast WILD, and Spirit MARK should read more like land influence over a base geography, with softer edges.

---

## Target Display Model

Implement and document this hierarchy:

```text
Layer 1: Regional substrate base
  basin / refuge / hollow / none are the underlying world geography.
  This layer should be visible in Macro View and Substrate + Macro View.

Layer 2: Fertility / empty-ground modulation
  EMPTY passable cells may vary subtly by fertility level.
  This is visual only and must not change fertility rules.

Layer 3: Ecological material influence
  Human FIELD / settlement influence, Beast WILD / recovery influence, and Spirit MARK / scar influence overlay the substrate.
  These overlays should be translucent and softly blended at edges.

Layer 4: Reading aids
  frontiers, routes, BLOCK, screen-cell boundaries, units, and optional macro icons.
  These remain crisp enough to read.
```

Important:

```text
The substrate is the base.
Human / Beast / Spirit influence modifies the visual material on top.
Macro reading aids sit above both.
BLOCK must remain clearly visible in all views.
```

---

## Part 1: Regional Areas Must Be Readable In Macro View

Current problem:

```text
Substrate + Macro View has region tint, but Macro View does not clearly communicate regional areas.
```

Required behavior:

```text
Macro View should also reveal regional substrate, but more subtly than Substrate + Macro View.
Substrate + Macro View should remain the stronger geography-reading mode.
basin / refuge / hollow should have distinct visual identities.
none should remain quiet but not identical to all other empty land.
```

Recommended approach:

```text
Always attach regionBias classes in Macro View and Substrate + Macro View.
Use CSS variables or classes to give each region a base color / texture.
Use screen-cell boundary classes only in Substrate + Macro View unless Macro View needs a very faint hint.
Add or update legend text/swatches so the user can identify basin / refuge / hollow.
```

Suggested region language:

```text
basin  = settlement basin / warmer field-friendly ground
refuge = wild refuge / greener fertile ground
hollow = scar hollow / colder marked ground
none   = ordinary ground
```

Keep display names generic. Do not invent lore names or race names.

---

## Part 2: Softer Ecological Influence Edges

Current problem:

```text
Human / Beast / Spirit macro regions have hard cell edges.
```

Required behavior:

```text
Macro masks should have center / edge / fringe classes or an equivalent cheap visual treatment.
Patch edges should feel softer and less binary.
The change must remain grid-readable and performant.
```

Recommended implementation:

Add a cheap post-process for macro display masks:

```js
function softenMacroMaskEdges(mask) {
  // For each macro influence class, detect whether an active cell is fully surrounded,
  // on an edge, or adjacent to an active cell.
  // Add suffix classes:
  // macro-soft-core
  // macro-soft-edge
  // macro-soft-fringe
}
```

Or use per-type classes:

```text
macro-cell-settlement-core / edge / fringe
macro-cell-wild-core / edge / fringe
macro-cell-scar-core / edge / fringe
```

Choose the simpler approach that fits the current class structure.

Rules:

```text
Core cells are active mask cells with many same-mask neighbors.
Edge cells are active mask cells with fewer same-mask neighbors.
Fringe cells are inactive cells adjacent to active mask cells.
Fringe should not override BLOCK.
Fringe should not hide units.
Frontier and route classes should stay crisp and should not become blurred.
```

Performance:

```text
This is a 40 x 25 grid. A simple 8-neighbor pass over mask classes is acceptable.
Do not add canvas, SVG filters, external libraries, or expensive DOM overlays.
```

---

## Part 3: Clarify Display Precedence

Implement predictable class precedence in CSS:

```text
1. BLOCK wins over all background styles.
2. route / frontier should remain readable above ecological influence.
3. ecological influence should be visible above substrate.
4. substrate should remain faintly visible beneath ecological influence.
5. fertility shading should affect empty/passable base land only and should not overpower region or macro masks.
```

Recommended CSS direction:

```text
Use layered backgrounds for region + fertility + terrain / macro influence.
Prefer translucent colors and inset shadows over fully opaque replacement colors.
Avoid making the whole UI one color family.
Keep Macro View and Substrate + Macro View visually related but not identical.
```

Avoid relying only on `opacity` for whole cells if that makes units or BLOCK harder to read.

---

## Part 4: EMPTY Fertility Shading

Current problem:

```text
EMPTY cells are flat gray-black and do not communicate whether land is fertile or exhausted.
```

Required behavior:

```text
Use fertility levels 0-4 as subtle display classes.
This is visual only.
Do not change fertility values or fertility dynamics.
```

Implementation:

```text
Add fertility classes such as fertility-0, fertility-1, fertility-2, fertility-3, fertility-4.
Attach them during render for all cells or at least passable cells.
Use them primarily for EMPTY / ordinary land display.
Keep FIELD / WILD / MARK identity stronger than fertility shading.
```

Suggested visual semantics:

```text
fertility-0 = dry / dark / depleted
fertility-1 = muted
fertility-2 = neutral
fertility-3 = slightly lively
fertility-4 = fertile / brighter
```

This should help users read why Human settlements expand or fail without adding a new rule.

---

## Part 5: UI / Legend

Update the existing legend, not as a tutorial wall but as compact readable swatches:

```text
Regional substrate:
basin / refuge / hollow / ordinary

Ecological material:
Human FIELD / Beast WILD / Spirit MARK

Macro aids:
frontier / route / BLOCK
```

Do not add a landing page or explanatory overlay.

If a new toggle is useful, prefer one small control:

```text
Show Fertility Tint
```

But do not add the toggle if the CSS treatment is subtle enough to keep always on.

---

## Part 6: Rules And Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with a new V0.10.6 section:

```text
V0.10.6 Macro Visual Communication
```

Document:

```text
This is display-only.
Macro View and Substrate + Macro View use a layered visual hierarchy.
Regional substrate is the base geography.
Ecological FIELD / WILD / MARK influence appears as translucent soft material overlay.
EMPTY may be shaded by fertility level.
BLOCK, routes, and frontiers stay readable above overlays.
No simulation rules, timeline shape, recording shape, or substrate generation rules are changed.
```

Update the rules version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.6_MACRO_VISUAL_COMMUNICATION
```

Update `README.md` with a short V0.10.6 note and how to visually test the result.

---

## Files Likely To Change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
index.html
style.css
sim.js
tests/v0_10_6_macro_visual_communication.test.js
```

Possibly update existing tests if they assert exact class names in Macro/Substrate View.

Do not edit macro timeline export tests except to ensure they still pass.

---

## Tests

Add:

```text
tests/v0_10_6_macro_visual_communication.test.js
```

Test at least:

```text
Macro View cells include regionBias classes, not only Substrate + Macro View.
Substrate + Macro View still includes regionBias classes and screen-cell boundary classes.
rendered cells include fertility level classes.
Macro influence masks include soft edge/fringe classes or equivalent soft display classes.
BLOCK cells remain visually dominant and are not replaced by fringe classes.
route/frontier classes still exist when present.
Macro Timeline export shape is unchanged.
Recording export shape is unchanged.
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
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing V0.10/V0.9 tests and report the difference.

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Confirm basin / refuge / hollow areas are readable without switching views.
4. Select Substrate + Macro View.
5. Confirm regional areas are stronger, screen-cell structure is readable, and BLOCK passages remain clear.
6. Press Play for 200-400 ticks.
7. Confirm Human / Beast / Spirit land influence changes smoothly enough to follow.
8. Confirm ecological influence edges are softer than before.
9. Confirm EMPTY land is not a flat gray-black sheet.
10. Export Snapshot JSON and Macro Timeline JSON once to confirm exports still work.
```

Expected visual difference:

```text
Macro View should read as a world map with stable regions plus evolving ecological material.
Substrate + Macro View should read as the clearest geography mode.
Human / Beast / Spirit areas should no longer look like perfectly hard rectangular paint.
Fertile and poor empty land should have subtle visible differences.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.6 rule sections are implemented
tests run
whether timeline export shape was preserved
whether recording export shape was preserved
known simplifications or deviations
expected visual difference in Macro View
expected visual difference in Substrate + Macro View
```

