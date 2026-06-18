# CODEX V0.10.8.1 POI Ecology Anchor Rebalance Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.8.1 as a focused POI ecology/readability correction after V0.10.8.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_8_INITIAL_POI_WORLD_ANCHORS_PROMPT.md
tests/v0_10_8_initial_poi_world_anchors.test.js
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing behavior.

---

## User Goal

V0.10.8 proved that POIs can become visible world anchors, but the first pass created two issues:

```text
1. spring currently behaves like a Human/FIELD accelerator because Human rules benefit most from stable fertility.
2. Beast/WILD needs its own strong world anchor, not only a general refuge substrate.
3. rot_source needs clearer visual identity while still showing Human/Beast/Spirit interaction around it.
```

V0.10.8.1 should refine the first POI set, not start a broad POI system.

---

## Hard Scope

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
dialogue
resource economy
village buildings
network calls
external libraries
canvas/WebGL rewrite
full entity-component framework
runtime-created POIs
POI cleansing / construction / opening / unlocking
```

Do not change:

```text
grid size
terrain enum
unit enum
view mode options
existing control ids
macro timeline frame top-level keys
recording frame required keys
```

Allowed:

```text
add one new initial POI type: great_forest
adjust spring effects
adjust rot_source effects and display classes
adjust POI placement
add display-only POI state classes
compact export / summary changes
tests / docs updates
```

---

## Conceptual Target

The initial POI set should become four readable anchors:

```text
monument     = Human/FIELD memory and civilization support
great_forest = Beast/WILD home, origin, and protection anchor
rot_source   = Spirit/MARK corruption source with readable core and contested outer ring
spring       = neutral fertility amplifier that magnifies whichever ecology controls the area
```

This should create a clearer world-order triangle:

```text
Human has monument.
Beast has great_forest.
Spirit/corruption has rot_source.
Life/fertility has spring, but spring is not a Human POI.
```

---

## POI Data Contract

Extend the existing POI type set:

```js
type: "monument" | "rot_source" | "spring" | "great_forest"
```

Use this default for Great Forest:

```js
{
  id: "poi_great_forest_004",
  type: "great_forest",
  x: number,
  y: number,
  radius: 5,
  coreRadius: 2,
  strength: "strong",
  state: "active",
  createdAtTick: 0
}
```

Keep existing POIs compact. Do not add large per-cell POI state arrays.

V0.10.8.1 initial world should create exactly four POIs:

```text
monument
rot_source
spring
great_forest
```

---

## Spring Repositioning

Spring should be a neutral fertility amplifier, not a hidden Human monument.

New spring meaning:

```text
Spring restores fertility and amplifies the ecology already present nearby.
It does not create FIELD, protect FIELD decay, spawn Humans, or favor Human settlement by itself.
```

Implementation:

```text
Within radius 4:
- non-BLOCK / non-BORDER cells may gain fertility.
- MARK cells are not restored unless future rules explicitly add cleansing.
- WILD or EMPTY cells near WILD/Beast may recover up to fertility 4.
- FIELD cells may recover only up to fertility 3.
- plain EMPTY with no nearby WILD/Beast/Human support may recover only up to fertility 3.
```

Keep probability strong enough to notice:

```text
spring fertility chance: about 18%
```

But make the cap context-sensitive so spring does not automatically become a Human boom zone.

Tests must show:

```text
Spring improves fertility.
Spring does not directly change terrain.
Spring can support WILD/Beast-adjacent cells up to cap 4.
Spring FIELD support caps lower than WILD/Beast-adjacent support.
```

---

## Great Forest

Great Forest is the Beast/WILD equivalent of a major world anchor.

Meaning:

```text
An old wild habitat and Beast origin point.
Beasts protect it by existing there.
The forest protects Beasts and WILD by making ordinary Human expansion unable to erase the core.
```

Placement:

```text
Prefer refuge / large WILD / Beast area.
Avoid overlap with monument, spring, and rot_source when possible.
Do not place center on BLOCK.
Keep at least 5 cells from other POI centers when possible.
```

Effects:

```text
Within radius 5:
- WILD decay chance is reduced strongly.
- Beast isolation death pressure is reduced or ignored.
- Beast birth/reappearance has a small strong-anchor chance on EMPTY/WILD when local Beast density is not too high.
- fertility on WILD/EMPTY can recover toward 4.

Within coreRadius 2:
- WILD is strongly preserved.
- Human ordinary terrain rewrite should not convert WILD to FIELD.
- FIELD without strong nearby Human support should tend back toward WILD.
```

Do not make Great Forest a wall:

```text
Humans may enter.
Humans may survive if supported.
Humans just cannot permanently domesticate the core through ordinary FIELD rewrite.
Future special POIs/conditions may alter it, but not V0.10.8.1.
```

Beast generation guardrails:

```text
Great Forest may create Beast only on non-BLOCK, non-BORDER, non-MARK cells.
Prefer WILD, then EMPTY.
Do not spawn if local Beast count is already high.
Do not spawn if total Beast count is already above a reasonable cap.
This is a habitat anchor, not an infinite Beast fountain.
```

Suggested first-pass probabilities:

```text
great forest Beast spawn chance: about 4% per eligible local check, with density gates.
great forest fertility recovery chance: about 12%.
great forest WILD preservation multiplier: about 0.35.
```

---

## Rot Source Redesign

The rot_source should look and behave like a source, not merely a low-fertility area.

Functional structure:

```text
core center:
- always remains MARK unless BLOCK.
- visually always reads as rot source, regardless of Human/Beast/Spirit colors nearby.

inner ring radius 1:
- strongly keeps or recreates MARK.
- should be the persistent corruption heart.

middle ring radius 2-3:
- applies FIELD-to-MARK pressure.
- slows MARK decay.
- lowers fertility.

outer ring radius 4:
- mostly fertility decline and scar memory.
- should not turn every cell purple instantly.
```

Visual structure:

```text
The rot source center and radius 1 should have dedicated POI classes that render above population colors.
Human/Beast/Spirit interaction may tint the outer ring, but must not erase the source marker.
```

Add display-only interaction state classes if useful:

```text
poi-rot-core
poi-rot-inner
poi-rot-outer
poi-contested-human
poi-contested-beast
poi-contested-spirit
```

Interpretation:

```text
If FIELD/Human is present in rot radius, show a gold/purple contested hint.
If WILD/Beast is present in rot radius, show a green/purple contested hint.
If MARK/Spirit dominates, show strong purple corruption.
The center marker remains dark purple and recognizable in all cases.
```

Important visual requirement:

```text
Do not let population-human, population-beast, terrain-field, terrain-wild, or macro-cell-* broad fills visually erase the rot source center.
The rot source marker must win at center and inner ring.
```

This addresses the user's concern that Human/Beast/Spirit interaction colors may interfere with rot source readability.

---

## Display / Legend

Required new or updated classes:

```text
poi-great-forest
poi-great-forest-core
poi-rot-core
poi-rot-inner
poi-rot-outer
poi-contested-human
poi-contested-beast
poi-contested-spirit
```

Keep existing:

```text
poi-center
poi-influence
poi-monument
poi-rot-source
poi-spring
```

Legend must include:

```text
great forest: Beast/WILD habitat and origin
spring: neutral fertility amplifier
rot source: core / inner ring / contested outer ring
monument: Human/FIELD memory support
```

Great Forest visual suggestion:

```text
deep green center, dense wild ring, clear but not block-like.
```

Spring visual suggestion:

```text
blue/cyan center, fertility halo, but avoid making it look like Human territory.
```

Rot Source visual suggestion:

```text
dark purple center, sharper inner ring, outer ring can show contest colors.
```

---

## Export / Interfaces

Keep exports compact.

Snapshot / Recording / Macro Timeline top-level:

```text
pointsOfInterest includes four POIs.
```

Macro timeline frame top-level keys remain:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

Update `macroSummary.poiSummary`:

```js
poiSummary: {
  total: 4,
  byType: {
    monument: 1,
    rot_source: 1,
    spring: 1,
    great_forest: 1
  }
}
```

Do not add per-frame POI influence rows.

---

## Tests

Use TDD. Add:

```text
tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
```

Update:

```text
tests/v0_10_8_initial_poi_world_anchors.test.js
```

Required assertions:

```text
Initial POIs now include exactly monument, rot_source, spring, great_forest.
Great Forest has radius 5, coreRadius 2, strength strong, state active.
Great Forest center is non-BLOCK and placed near WILD/Beast/refuge when possible.
Spring does not directly change terrain.
Spring WILD/Beast-adjacent fertility can recover to cap 4.
Spring FIELD fertility support caps at 3.
Great Forest core prevents ordinary Human WILD->FIELD rewrite.
Great Forest reduces WILD decay or exposes the preservation multiplier.
Great Forest can spawn or preserve Beast under density gates.
Rot source center remains visually marked even when FIELD/Human or WILD/Beast is nearby.
Rot source applies distinct core/inner/outer classes.
Rot source contested classes appear when Human or Beast influence overlaps.
Macro View renders poi-great-forest and rot source priority classes.
Legend explains Great Forest, neutral Spring, and rot source contest rings.
Snapshot / Recording / Macro Timeline export four compact POIs.
Macro Timeline frame top-level keys stay stable.
macroSummary.poiSummary includes great_forest and total 4.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_8_initial_poi_world_anchors.test.js
node tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
```

If a listed test is not present locally, run the closest existing tests and report the difference.

---

## Rules / Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.8.1 POI Ecology Anchor Rebalance
```

Document:

```text
Spring is a neutral fertility amplifier, not a Human/FIELD POI.
Great Forest is added as the Beast/WILD habitat and origin anchor.
Rot Source now has source/core/ring visual semantics so interaction colors do not hide it.
POIs remain initially existing static world anchors only.
No runtime POI creation, quest, NPC, dialogue, save/load, new terrain, new species, or multi-screen map is added.
```

Update version string:

```text
TRI_SPECIES_WORLD_SIM_V0.10.8.1_POI_ECOLOGY_ANCHOR_REBALANCE
```

Update `README.md` with the same player-facing summary.

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Confirm four POI centers are visible.
4. Confirm Great Forest reads as a Beast/WILD anchor.
5. Run 300-600 ticks.
6. Confirm spring can support nearby ecology without always becoming a Human boom zone.
7. Confirm Great Forest preserves a recognizable wild/Beast region.
8. Confirm rot source center remains visible even when Human/Beast colors touch it.
9. Confirm rot source outer ring can show contested Human/Beast pressure without hiding the core.
10. Export Recording and Macro Timeline JSON and confirm four compact POIs and poiSummary total 4.
```

Expected result:

```text
The world should now have clearer faction/ecology anchors:
Human monument, Beast great forest, Spirit/corruption rot source, and neutral spring.
The rot source should remain visually identifiable even during ecological contest.
```

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether terrain/unit enums stayed unchanged
which V0.10.8.1 rule section was implemented
spring behavior changes
great forest placement and effects
rot source visual/interaction changes
JSON export changes
known simplifications or deviations
expected visual difference
```

