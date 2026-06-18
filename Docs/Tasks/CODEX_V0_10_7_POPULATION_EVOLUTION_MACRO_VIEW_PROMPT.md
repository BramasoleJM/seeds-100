# CODEX V0.10.7 Population Evolution Macro View Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.7 as a new macro-layer readability stage:

```text
Macro View must clearly and continuously show each population's ecological evolution history.
It should denoise raw grid changes, merge them into recognizable shapes, and let those shapes evolve organically over time.
```

This is not another color-tuning pass. This is a macro interpretation / display architecture pass.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Tasks/CODEX_V0_10_5_MACRO_TIMELINE_AND_RULE_AUDIT_PROMPT.md
Docs/Tasks/CODEX_V0_10_6_4_SPIRIT_CORROSION_AND_SUBSTRATE_UNIT_HIDE_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing macro behavior or display behavior.

---

## User Goal

The user clarified the intended result:

```text
1. The underlying emergence is valid.
   Do not rebase the simulation rules.
   Spirit's current role is acceptable.

2. Macro View must clearly show a population's evolution history.
   The history must be continuous and recognizable.
   Macro mode exists to remove noise, merge shapes, and make those shapes change organically over time.
   This must be direct and obvious.

3. Later memory points and POIs will be built on top of this.
   That requires the whole map to become recognizable first.
```

Treat this as the new stage goal.

---

## Current Problem

Recent V0.10.6.x work improved visual materials, but it still mostly displays:

```text
raw terrain material
regional substrate
macro masks from current detection
visual overlays
```

This is not enough.

The user does not merely need brighter `FIELD / WILD / MARK`. The user needs:

```text
Human evolution shapes
Beast evolution shapes
Spirit corrosion / scar shapes
```

Those shapes must:

```text
persist across frames
change gradually
retain identity
show expansion / contraction / collapse
remain readable even when raw terrain is noisy
```

The next layer should translate grid-level emergence into macro-level population evolution.

---

## Hard Scope

Do not change:

```text
simulation rules
species behavior
Spirit role / lifecycle
grid size
4 x 3 screen-cell substrate layout
regional substrate generation
movement / conflict / reproduction / decay / fertility dynamics
recording JSON existing fields
macro timeline existing required fields
snapshot existing required fields
panel layout unless a tiny integration issue appears
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

Allowed:

```text
new observer-only macro evolution state
new display-only macro shape classes
additive snapshot / macroWorld debug summaries if useful
tests for macro evolution continuity
README / rules documentation
```

---

## Target Concept

Create a Population Evolution Macro Layer.

It observes the existing grid and produces stable display objects:

```text
human_population_shape
beast_population_shape
spirit_corrosion_shape
```

These are not new gameplay objects. They are observer-only macro interpretation objects.

Each population shape should track:

```text
id
type: human | beast | spirit
state
age
lastSeenTick
confidence
coreCells
bodyCells
edgeCells
fadedCells / memoryCells if needed
center
bounds
area
trend: expanding | contracting | stable | fragmenting | fading
previousArea
```

Use the simplest shape needed for readability. Do not over-engineer.

---

## Population Shape Semantics

### Human Shape

Represents:

```text
settlement / field expansion / inhabited cultivated area
```

Input signals:

```text
FIELD terrain
Human units
Human-on-FIELD support
nearby FIELD continuity
recent settlement macro regions if available
```

Visual goal:

```text
Human shape should look like a recognizable settlement / cultivated territory.
It should have a core and an edge.
It may leave abandoned or fading memory if it collapses.
```

### Beast Shape

Represents:

```text
wild recovery / beast range / rewilding pressure
```

Input signals:

```text
WILD terrain
Beast units
fertile EMPTY near Beast/WILD
recent beast recovery macro regions if available
```

Visual goal:

```text
Beast shape should look like a continuous wild range, not isolated green dots.
It may be softer than Human shape, but it must still be recognizable and trackable.
```

### Spirit Shape

Represents:

```text
corrosion / abnormal scar / Spirit aftermath
```

Input signals:

```text
MARK terrain
Spirit units if present
clustered MARK
recent human-death-to-mark / spirit events if available
recent spirit_scar macro events if available
```

Visual goal:

```text
Spirit does not need to become a stable population.
It should read as a sharp corrosion / scar history.
MARK may appear, expand, fragment, and vanish.
The visual should be clear and memorable even if active Spirits are rare.
```

---

## Shape Building

Build population influence masks from current world state.

Recommended approach:

```text
1. Compute influence score per cell for each population.
2. Smooth / close small holes with cheap 8-neighbor logic.
3. Remove tiny noise fragments below a minimum size.
4. Split into connected components.
5. Classify core / body / edge cells.
6. Match components to previous shapes by overlap / center distance.
7. Preserve ids and age.
8. Apply short-term memory so shapes fade rather than flicker.
```

Keep it cheap:

```text
The grid is 40 x 25.
Simple masks and 8-neighbor passes are enough.
Do not add canvas, WebGL, or external libraries.
Do not run expensive full macro analysis every tick.
```

Suggested cadence:

```text
Update lightweight population evolution shapes every MACRO_DISPLAY_INTERVAL.
Heavy macroWorld semantic analysis can remain on MACRO_ANALYSIS_INTERVAL.
Manual Step should refresh shapes when a macro view is active.
```

This layer should be closer to the existing lightweight macro display frame than the heavy macroWorld object system.

---

## Temporal Continuity

The main success criterion is continuity.

Required behavior:

```text
Shapes should not blink off immediately when raw terrain dips below threshold.
Shapes should not completely re-id every refresh.
Shapes should grow / shrink / split / fade in a visually legible way.
```

Recommended memory:

```text
Keep previous population shapes for 20-50 ticks after last confident detection.
Fade confidence and visual intensity over time.
When a new component overlaps an old shape, update the old shape instead of creating a new one.
If one shape splits, keep the largest continuation id and create new ids for substantial separated pieces.
If shapes merge, keep the most confident / oldest id and record merged contributors only internally if useful.
```

Do not build a full historical POI system yet.

---

## Macro View Display

Macro View should become primarily:

```text
Population Evolution View
```

Required display behavior:

```text
Human / Beast / Spirit population shapes should be the primary visible elements.
Raw terrain can still contribute, but it should not be the only thing users read.
Regional substrate should be almost invisible or absent in Macro View.
Substrate + Macro View remains the place to read geography.
```

Shape classes:

```text
population-human-core
population-human-body
population-human-edge
population-human-memory

population-beast-core
population-beast-body
population-beast-edge
population-beast-memory

population-spirit-core
population-spirit-body
population-spirit-edge
population-spirit-memory
```

Use different visual semantics:

```text
Human = cultivated / settlement shape, readable core and edge
Beast = wild range, organic but still coherent
Spirit = corrosion / scar, sharper and more abnormal
```

Macro masks such as settlement / wildRecovery / spiritScars can still exist, but in Macro View they should support these population shapes rather than compete with them.

Substrate + Macro View can still show geography more strongly, but it should either:

```text
show population shapes softly above substrate
or keep current terrain material display while preserving shape outlines
```

Choose the simpler option that makes the user's goal testable.

---

## Relationship To Existing MacroWorld

Do not delete existing macroWorld detection.

Existing systems still matter:

```text
settlements
abandoned settlements
beast recovery zones
spirit scars
routes
frontiers
events
memories
macro timeline
```

But V0.10.7 should introduce a clearer display-level interpretation:

```text
population evolution shapes
```

Use existing macro detections as optional signals or overlays.

Recommended integration:

```text
buildPopulationEvolutionShapes(source)
refreshPopulationEvolutionFrame()
buildPopulationEvolutionDisplayMasks(source, mode)
```

Then `renderWorld()` can combine:

```text
terrain class
region class if needed
population evolution classes
route/frontier/block classes
```

Keep code readable inside the existing `sim.js`, but if the file becomes too hard to reason about, a small extraction is allowed only if tests remain simple. Prefer minimal integration for this pass.

---

## Data / Export

Do not break existing export shapes.

Additive debug summaries are allowed:

```text
snapshot.macroWorld.populationEvolution
recording frames compact macro summary may include populationEvolutionSummary
macro timeline frames may include populationShapeCounts only if it does not break existing tests
```

If adding export fields increases test churn or file size too much, skip export additions in this pass and keep the population evolution layer display-only.

Minimum requirement:

```text
Expose population evolution shape state through test helpers.
```

Possible helper:

```js
getPopulationEvolutionFrameForTest()
```

---

## Tests

Add:

```text
tests/v0_10_7_population_evolution_macro_view.test.js
```

Test at least:

```text
population evolution frame exists.
human shape is created from FIELD / Human clusters.
beast shape is created from WILD / Beast clusters.
spirit shape is created from MARK / Spirit/mark clusters.
tiny isolated noise cells are filtered out.
shape ids persist across multiple refreshes when the shape moves or grows slightly.
shape confidence / memory persists briefly after raw signal disappears.
Macro View render applies population-human / population-beast / population-spirit classes.
Macro View does not require regional substrate to make population shapes visible.
Substrate + Macro View still keeps substrate classes.
existing macro timeline export required frame shape remains compatible.
existing recording export required fields remain compatible.
safety performance test still passes.
```

Suggested focused fixtures:

```text
Create an empty world.
Paint a 4x4 FIELD + Human cluster.
Paint a 4x4 WILD + Beast cluster.
Paint a 3x3 MARK cluster.
Render Macro View and assert population classes appear.
Advance or modify the clusters slightly, refresh, and assert ids persist.
Remove one cluster, refresh for a few display intervals, and assert memory/fading state exists before disappearing.
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
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing tests and report the difference.

---

## Rules And Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.7 Population Evolution Macro View
```

Document:

```text
This patch adds an observer-only population evolution macro layer.
It does not change simulation rules.
Macro View becomes the ecology-evolution reading mode.
The layer denoises raw terrain and unit signals into Human / Beast / Spirit shapes.
Shapes have continuity, age, confidence, trend, and short-term memory.
Human and Beast shapes can have soft ecological edges.
Spirit shape remains corrosion / scar oriented and does not require Spirit to be permanent.
Regional substrate is demoted in Macro View and remains primarily for Substrate + Macro View.
No new terrain, species, map size, substrate generation, save/load, POI, NPC, quest, or economy system is added.
```

Update the rules version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.7_POPULATION_EVOLUTION_MACRO_VIEW
```

Update `README.md` with:

```text
Macro View now shows population evolution shapes.
Substrate + Macro View remains for geography plus ecology.
This is the foundation for later memory points and POIs, but V0.10.7 does not add POIs yet.
```

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Run 300-600 ticks.
4. Confirm Human / Beast / Spirit influence appears as recognizable shapes, not noisy terrain dots.
5. Confirm shapes grow, shrink, fade, or fragment continuously instead of blinking.
6. Confirm Human history can be followed when FIELD expands or collapses.
7. Confirm Beast range can be followed when WILD recovers or retreats.
8. Confirm Spirit / MARK appears as corrosion / scar history when it appears, even if active Spirit is rare.
9. Confirm Macro View does not feel dominated by regional substrate.
10. Select Substrate + Macro View and confirm geography remains available separately.
11. Export Snapshot JSON, Recording JSON, and Macro Timeline JSON once to confirm existing exports still work.
```

Expected result:

```text
Macro View should directly show ecological evolution history.
The user should be able to point at a shape and say:
"this is where Human settlement grew, collapsed, or held"
"this is where Beast wild range recovered or pressed back"
"this is where Spirit corrosion appeared and left a scar"
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.7 rule sections are implemented
tests run
whether simulation rules were unchanged
whether timeline export shape was preserved
whether recording export shape was preserved
whether snapshot export shape was preserved or only additively extended
known simplifications or deviations
expected Macro View visual difference
how this prepares for later memory points and POIs
```

