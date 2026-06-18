# CODEX V0.10.7.1 Macro Population Visual Primary Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.7.1 as a targeted display/readability correction after V0.10.7.

Current user feedback:

```text
V0.10.7 technically added population evolution shapes, but the result feels almost unchanged.
Macro View still reads like raw cell terrain plus H/B letters, not like a clear population evolution view.
Some icons/patterns are hard to identify.
The next change must be targeted, remove redundant/legacy visual noise, and avoid adding more leftover options.
```

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_7_POPULATION_EVOLUTION_MACRO_VIEW_PROMPT.md
tests/v0_10_7_population_evolution_macro_view.test.js
```

This project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing display behavior.

---

## Goal

Make Macro View actually read as:

```text
Population Evolution View
```

The user should be able to look at Macro View and immediately read:

```text
where Human settlement expanded, held, collapsed, or left memory
where Beast wild range recovered, pressed, or retreated
where Spirit corrosion appeared, persisted, fragmented, or faded
```

The main target is not prettier colors. The target is a clearer visual hierarchy.

---

## Observed Problem In Current Code

V0.10.7 added population evolution state and classes, but those classes are visually subordinate.

Relevant current code areas:

```text
sim.js
- populationEvolutionState / populationEvolutionFrame
- buildPopulationEvolutionShapes()
- buildPopulationEvolutionDisplayMasks()
- mergePopulationEvolutionMasks()
- buildMacroDisplayMasks()
- macroMaskRows()
- renderWorld()
- renderMacroOverlay()

style.css
- .grid.macro-view .cell background layer order
- .grid.macro-view .terrain-field / wild / mark
- .grid.macro-view .macro-cell-* old ecological overlays
- .grid.macro-view .population-*-core/body/edge/memory
- .grid.substrate-view .population-* variants
- .grid.substrate-view .cell[data-unit]
- .macro-icon

index.html
- Legend contents
- Show Macro Debug Icons wording and legend support

tests
- v0_10_7_population_evolution_macro_view.test.js currently protects shape existence but not visual dominance
```

Current visual failure modes:

```text
1. Macro View still shows H/B/S unit letters.
2. Raw terrain colors remain too dominant for a population-shape view.
3. Existing macro-cell-settlement / macro-cell-wild / macro-cell-scar overlays compete with population shapes.
4. Regional substrate classes are still attached in Macro View and can add unnecessary color noise.
5. Population overlays are low-opacity and appear below/within the old background stack.
6. Macro timeline does not expose population-shape summaries, so exported macro history cannot be audited for this layer.
7. Old debug icons use terse labels such as S+, R, *, ->, F and are hard to identify without already knowing the code.
```

---

## Hard Scope

Do not change:

```text
simulation rules
movement / lifecycle / conflict / reproduction / decay / fertility logic
grid size
regional substrate generation
screen-cell substrate generation
recording frame required top-level fields
snapshot required fields except additive summary fields
view mode options
existing control ids
```

Do not add:

```text
Zelda-style multi-screen map
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
new "legacy macro view" toggle
new parallel view option just to preserve old behavior
```

Allowed:

```text
display-only CSS changes
small renderWorld class composition changes
small macro display mask separation
additive macroSummary population evolution summary
legend updates
debug icon label/icon replacement
tests that protect the new visual hierarchy
README / rules documentation
```

---

## Required Design Decision

Do not add another view mode or toggle for this change.

Use the existing modes like this:

```text
Cell View:
low-level grid debugger; keeps unit letters and raw terrain readability.

Macro View:
primary population evolution reading mode; hides unit letters; population shapes dominate.

Substrate + Macro View:
geography + ecology comparison mode; keeps regional substrate readable and shows population shapes more softly.
```

If a previous display path becomes redundant after this split, remove or demote it. Do not keep both the old and new visual languages fighting in Macro View.

---

## Implementation Requirements

### 1. Rules documentation first

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with a new section:

```text
V0.10.7.1 Macro Population Visual Primary
```

Document:

```text
This is display-only.
Macro View hides unit letters and becomes the primary population-shape reading mode.
Raw terrain material is muted in Macro View so population core/body/edge/memory shapes are visually dominant.
Substrate + Macro View remains the place to inspect regional substrate and geography.
Old macro-cell recognition classes remain available for analysis/debug and compact mask export, but they should not overpower population shapes in Macro View.
Macro timeline macroSummary may include an additive compact population evolution summary.
No simulation rules, terrain types, species, map size, or substrate generation change.
```

Update the version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.7.1_MACRO_POPULATION_VISUAL_PRIMARY
```

---

### 2. Make Macro View hide unit letters

Current CSS hides units only for Substrate + Macro View:

```css
.grid.substrate-view .cell[data-unit] { ... }
```

Change this so Macro View also hides unit text visually:

```css
.grid.macro-view .cell[data-unit],
.grid.substrate-view .cell[data-unit] {
  color: transparent;
  text-shadow: none;
}
```

Keep `el.dataset.unit` and `textContent` intact for tests/export neutrality. Cell View must still show H/B/S letters.

---

### 3. Make population shapes the top visual layer in Macro View

Current background order has `--eco-overlay` above `--population-overlay`.

For Macro View, population shapes must be above old macro-cell overlays and raw terrain material. Use one of these simple approaches:

```text
Preferred:
Use separate CSS variables and order population layer first in .grid.macro-view .cell background.

Acceptable:
Keep the variable names but place linear-gradient(var(--population-overlay)) before eco/terrain layers and make old eco overlays very subtle in Macro View.
```

Target hierarchy for Macro View:

```text
1. BLOCK / route / frontier crisp aids
2. population core/body/edge/memory
3. muted real terrain material
4. very pale empty/fertility base
5. near-invisible regional undertone or no region tint
```

Target hierarchy for Substrate + Macro View:

```text
1. BLOCK / route / frontier crisp aids
2. regional substrate and screen-cell geography
3. softened population shapes
4. muted terrain material
```

Do not make regional colors the most visible thing in Macro View.

---

### 4. Mute raw terrain in Macro View, not in Cell View

The screenshot still reads primarily as raw FIELD/WILD/MARK/BLOCK cells.

In `.grid.macro-view`:

```text
FIELD/WILD/MARK terrain material should support the population shapes, not compete with them.
Human/Beast/Spirit shapes should remain identifiable even when raw terrain is fragmented.
```

Suggested starting values:

```text
Macro FIELD terrain alpha: 0.18 - 0.28
Macro WILD terrain alpha: 0.18 - 0.28
Macro MARK terrain alpha: 0.25 - 0.40
Population core alpha: 0.70 - 0.85
Population body alpha: 0.48 - 0.62
Population edge alpha: 0.25 - 0.38
Population memory alpha: 0.12 - 0.22
```

Spirit may stay sharper than Human/Beast:

```text
Spirit core: high-contrast purple
Spirit edge: crisp or cracked
Spirit memory: faint scar, not soft fertile biome
```

Human/Beast may keep softer edge semantics:

```text
Human: cultivated yellow, readable body and border
Beast: green wild range, organic but coherent
```

---

### 5. Demote old macro-cell overlays in Macro View

Do not delete old macro mask detection yet; exports and older tests may depend on it.

But in Macro View:

```text
macro-cell-settlement
macro-cell-wild
macro-cell-scar
macro-cell-abandoned
macro-fringe-*
```

should not repaint the map strongly. They can become:

```text
thin outlines
tiny highlights
near-transparent analysis hints
or debug-only visual support
```

Substrate + Macro View may keep more of these old aids if they help compare geography and ecology, but they must not hide population shapes there either.

Important:

```text
Do not keep duplicate broad fills for both macro-cell-* and population-* in Macro View.
That creates redundant information and makes the result muddy.
```

---

### 6. Region substrate handling

In `renderWorld()`, current code adds `regionBiasClass(cell.regionBias)` whenever `usesMacroMasks` is true.

Reassess this split:

```text
Macro View should either not attach region classes at all, or attach them with near-identical pale values.
Substrate + Macro View should keep region classes clearly.
```

Prefer the smaller implementation:

```js
const substrateClass = viewMode === "substrateMacro" ? ` ${regionBiasClass(cell.regionBias)}` : "";
```

If existing tests require region classes in Macro View, update those tests to reflect V0.10.7.1's new display contract.

---

### 7. Add compact population summary to macro timeline without adding noisy rows

Do not add full population mask rows to macro timeline frames.

Do add a compact additive summary inside existing `macroSummary`:

```js
macroSummary: {
  ...existingSummary,
  populationEvolution: {
    human: { shapes, activeArea, memoryArea, dominantId, trend },
    beast: { shapes, activeArea, memoryArea, dominantId, trend },
    spirit: { shapes, activeArea, memoryArea, dominantId, trend }
  }
}
```

This keeps existing top-level frame keys stable:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

The summary should be compact and human-readable. It should not include full cell lists.

Also expose the same summary through test helpers if useful.

---

### 8. Refresh legend and debug icons

The user cannot identify some patterns/icons.

Update the Legend so it matches current view semantics:

```text
Population evolution
- Human settlement shape: core / body / memory
- Beast wild range: core / body / memory
- Spirit corrosion: core / scar / memory

Terrain material
- FIELD / WILD / MARK as low-level material, not the main Macro View signal

Geography
- basin / refuge / hollow belongs mainly to Substrate + Macro View

Macro aids
- BORDER, BLOCK, frontier, route
```

Replace terse macro debug icon labels in `macroIconFor()`:

Current examples:

```text
S+
R
*
->
F
```

Use clearer short labels or simple ASCII-safe tokens:

```text
H core or H+
H old
W range
S scar
S wave
route
edge
```

Keep icons debug-only and disabled by default. Do not rely on debug icons for the normal Macro View reading experience.

Update `.macro-icon` styling if needed:

```text
slightly larger readable labels
consistent title text
less visual dominance than population shapes
```

---

### 9. Tests

Add or update tests so this does not regress into the old cell-like view again.

Update:

```text
tests/v0_10_7_population_evolution_macro_view.test.js
```

or add:

```text
tests/v0_10_7_1_macro_population_visual_primary.test.js
```

Required assertions:

```text
Macro View renders population-human / population-beast / population-spirit classes.
Macro View hides unit text visually but preserves dataset.unit/textContent.
Cell View still shows H/B/S letters.
Substrate + Macro View keeps region-basin/refuge/hollow classes.
Macro View no longer depends on region-basin/refuge/hollow classes for population readability.
Population overlay appears above or stronger than old eco overlay in Macro View CSS.
Macro terrain material alpha is lower than population core/body alpha.
Old macro-cell-* broad fills are demoted in Macro View.
Macro timeline frame top-level keys remain stable.
Macro timeline frame macroSummary includes compact populationEvolution summary.
Legend contains Population evolution entries and explains debug icons or removes unsupported icon claims.
Debug macro icons use clearer labels than S+, R, *, ->, F.
```

Keep existing V0.10.7 continuity tests:

```text
shape ids persist
tiny noise is filtered
memory/fading exists briefly
Substrate + Macro View keeps soft population classes
recording frame shape remains compatible
```

Run at least:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_5_macro_timeline_rule_audit.test.js
node tests/v0_10_6_4_spirit_corrosion_substrate_unit_hide.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
```

If a listed file does not exist, run the nearest existing tests and report the difference.

---

### 10. Manual visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Run 300-600 ticks.
4. Confirm H/B/S letters are not visible in Macro View.
5. Confirm Human/Beast/Spirit population shapes are more visible than raw terrain cells.
6. Confirm the user can follow shape expansion/contraction across several seconds.
7. Confirm Spirit purple reads as corrosion/scar, not just another soft biome.
8. Confirm BLOCK and route/frontier aids remain readable but do not dominate.
9. Switch to Substrate + Macro View and confirm geography is still readable there.
10. Export Macro Timeline JSON and confirm macroSummary.populationEvolution is present and compact.
```

Expected visual difference:

```text
Before:
Macro View looks like raw grid terrain with H/B letters and some faint overlays.

After:
Macro View looks like a population-evolution map: three readable ecological shapes, with raw grid details subordinated.
```

---

## Files Likely To Change

Expected:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
style.css
sim.js
index.html
tests/v0_10_7_population_evolution_macro_view.test.js
tests/v0_10_7_1_macro_population_visual_primary.test.js
```

Avoid broad refactors. If touching `sim.js`, keep changes close to:

```text
macroIconFor()
buildMacroFrame()
buildMacroSummary()
buildMacroDisplayMasks()
macroMaskRows()
renderWorld()
renderMacroOverlay()
module.exports test helpers
```

Do not introduce a new rendering engine or a new visualization subsystem for this patch.

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether simulation rules stayed unchanged
what redundant/legacy visual information was removed or demoted
how Macro View now prioritizes population evolution
how Substrate + Macro View differs from Macro View
what changed in the legend/icons
whether macro timeline top-level frame keys stayed stable
what compact population summary was added
known simplifications or deviations
```

