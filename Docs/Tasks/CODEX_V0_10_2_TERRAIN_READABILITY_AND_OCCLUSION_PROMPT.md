# CODEX V0.10.2 Terrain Readability And Occlusion Prompt

You are Executor for the Tri-Species WorldSim project.

Implement a V0.10.2 correction pass focused on:

```text
1. terrain visibility in Macro / Substrate views
2. BLOCK-aware sensing and target selection
3. less homogeneous screen-cell terrain generation
```

This follows V0.10 Regional Substrate and V0.10.1 Screen-Cell Substrate.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_SIDE_CHAT_MEMORY_CN.md
Docs/Tasks/CODEX_V0_10_REGIONAL_SUBSTRATE_PROMPT.md
Docs/Tasks/CODEX_V0_10_1_SCREEN_CELL_SUBSTRATE_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing simulation behavior.

---

## Observed Problems

A recording from V0.10.1 showed:

```text
The 4 x 3 screen-cell layout exists.
regionalSubstrate exports correctly.
BLOCK count increased enough to create barriers.
Runtime H/B/S intervention remains useful.
```

But several problems remain:

```text
Macro View hides terrain and geographic blockers.
Substrate + Macro View still does not clearly show terrain separation.
H/B/S cannot move through BLOCK, but long-range sensing appears to scan through BLOCK.
Screen-cell terrain is still too homogeneous and rectangular.
Zelda-like blocker patterns should be more irregular, with varied silhouettes and passage shapes.
```

---

## Goal

Keep the project as a single-screen `40 x 25` prototype, but make generated geography behave and read more like real map structure.

The user should be able to tell:

```text
where the blockers are
where passages/choke points are
which areas are geographically separated
whether a macro region is on this side or the other side of a blocker
```

The simulation should also treat blockers as sensory occlusion for medium/long-range decisions.

---

## Important Reference Direction

Use first-generation Zelda overworld structure as inspiration only.

Relevant design takeaways:

```text
The world is organized as screen-like map cells.
Each cell has local blocker patterns.
Screen edges have deliberate passages.
Mountains, forests, water, and walls create irregular silhouettes.
Terrain blockers are not just random scattered dots.
Openings between screens line up.
Different screens can share a biome but still have different internal shapes.
```

Do not copy exact Zelda maps or art.

Do not implement actual multi-screen gameplay.

---

## Part 1: Terrain Visibility In Views

Current issue:

```text
Macro View emphasizes ecological interpretation but hides terrain.
Substrate + Macro View shows region tint, but macro overlays can overpower terrain / blockers.
```

Required changes:

```text
BLOCK must be visible in Macro View or at least in Substrate + Macro View.
Substrate + Macro View must keep BLOCK and passages visually above macro color regions.
Screen-cell boundaries and exits should be legible in Substrate + Macro View.
Macro overlays should not fully obscure substrate and BLOCK structure.
```

Recommended approach:

```text
In Cell View:
  keep detailed terrain/unit view.

In Macro View:
  show ecological regions, but keep BLOCK as strong dark or outlined blockers.
  optionally show passages/choke blockers as silhouettes.

In Substrate + Macro View:
  substrate tint stays visible.
  BLOCK has highest terrain priority.
  macro regions become translucent or outlined.
  screen-cell boundaries remain visible.
```

Suggested visual corrections:

```text
Make BLOCK higher contrast than EMPTY.
Use outline, bevel, or patterned fill for BLOCK.
Use semi-transparent macro colors in substrate view.
Do not let settlement/wild/scar fills replace BLOCK color.
Make exits visually readable as breaks in blocker lines.
```

This is still debug/design UI, not final art.

---

## Part 2: BLOCK-Aware Sensing

Current issue:

```text
Movement cannot enter BLOCK.
But radius scans such as countUnitInRadius, countTerrainInRadius, findNearestRot, and settler target searches likely see through BLOCK.
```

This makes geography feel fake:

```text
Units may react to danger or resources behind a wall.
Settlers may target fertile ground behind blockers as if directly nearby.
Spirit / MARK pressure may influence behavior across walls.
```

Required design:

```text
BLOCK should block medium/long-range sensing and target selection.
Adjacent 8-neighbor checks may remain direct because they represent immediate contact.
Radius 2+ scans used for strategic behavior should use reachable cells or line-of-sight cells.
```

Recommended simple implementation:

```text
Add reachableCellsInRadius(source, x, y, radius, options)
```

Behavior:

```text
Start at x,y.
Flood fill outward up to radius.
Do not pass through BLOCK.
Do not pass through BORDER unless existing behavior clearly treats BORDER as passable for sensing.
Return cells reachable through passable terrain within radius.
```

Then add:

```text
countReachableUnitInRadius(...)
countReachableTerrainInRadius(...)
findReachableNearestRot(...)
```

Use these in strategic / medium-range decisions first:

```text
findNearestRot / cachedNearestRot
findSettlerTarget
settler danger scoring for target candidates
human exposure / nearby pressure checks if they use radius > 1
beast relocation target ranking if it uses radius > 1
macro display should not need this unless explicitly useful
```

Do not rewrite all neighbor logic. Keep local 8-neighborhood conflict rules simple.

Document simplification:

```text
V0.10.2 uses reachability within radius, not true visual line-of-sight.
BLOCK and optionally BORDER stop reachability.
```

---

## Part 3: Less Homogeneous Screen-Cell Terrain

Current issue:

```text
The 4 x 3 layout exists, but screen cells read as rectangular regions with repeated blocker patterns.
```

Target:

```text
Each screen-cell archetype should create a different silhouette.
Cells of the same archetype should still vary by seed.
BLOCK should form irregular but readable shapes.
Passages should be deliberate.
```

Improve archetype painting:

### open_basin

```text
Mostly open.
Soft partial border on one or two sides.
Small blocker clusters near corners.
Wide exits.
Good basin readability without becoming a plain rectangle.
```

### field_basin

```text
Open settlement-friendly interior.
Some low-density internal blockers.
One or two protected edges.
Good FIELD/Human start readability.
```

### wild_refuge

```text
Irregular clustered blockers.
Patchy interior shapes.
Broken edge clusters.
Not just a full rectangle of refuge tint.
```

### deep_refuge

```text
More enclosed than wild_refuge.
Still has at least one viable passage.
Internal pockets or curved ridges.
```

### scar_hollow

```text
Pocket-like or basin-like enclosure.
MARK-friendly interior.
Edges should suggest a hollow or dead-end.
```

### closed_hollow

```text
Mostly enclosed.
One narrow opening or two small openings.
Must not be fully sealed unless explicitly documented and rare.
```

### choke_pass

```text
Clearly creates a narrow pass.
The pass should be visible in Substrate + Macro View.
It should have more structure than a random line.
```

### barrier_edge

```text
Strong irregular barrier.
May create one-sided wall, ridge, or riverbank abstraction.
Must leave intended exits open.
```

Implementation ideas:

```text
Use jittered ridges instead of straight lines.
Use clustered BLOCK stamps of varied size.
Use corner masses plus carved exits.
Use erosion/carving passes to open holes.
Vary density by archetype.
Keep enough passable cells for movement and initial placement.
```

Do not add new terrain types.

---

## Part 4: Preserve Existing Useful Features

Keep:

```text
regionBias rows and counts
regionalSubstrate export
Substrate + Macro View mode
runtime H/B/S intervention
snapshot / recording export
existing macroWorld detection
existing ecology rules except for BLOCK-aware sensing corrections
```

Do not add:

```text
full map editor
brush terrain painting
undo/redo
save/load
new mountain / river terrain types
actual multi-screen gameplay
screen-to-screen propagation
NPCs
quests
story events
resource economy
external libraries
network calls
```

---

## Tests

Add or update tests.

Recommended test file:

```text
tests/v0_10_2_terrain_readability_occlusion.test.js
```

Test at least:

```text
reachableCellsInRadius does not include cells behind a BLOCK wall.
countReachableUnitInRadius does not count units fully occluded by BLOCK.
countReachableTerrainInRadius does not count terrain fully occluded by BLOCK.
findReachableNearestRot ignores MARK / Spirit behind a BLOCK wall.
Settler target search does not choose a target behind an unbroken BLOCK wall.
Substrate + Macro View still exists.
BLOCK cells keep a terrain-block class even when macro masks are active.
Generated maps contain screen-cell metadata.
Generated maps contain BLOCK but do not become mostly BLOCK.
Generated maps include varied archetypes or varied blocker counts across cells.
Runtime intervention still places H/B/S on non-BLOCK and rejects BLOCK.
```

Run existing tests too:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_regional_substrate.test.js
node tests/v0_10_1_screen_cell_substrate.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed test file does not exist locally, run the nearest existing V0.10/V0.9 tests and report the difference.

---

## Files Likely To Change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
style.css
sim.js
tests/v0_10_2_terrain_readability_occlusion.test.js
```

Possibly:

```text
index.html
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Prefer the root rule file as source of truth.

---

## Expected Visual Difference

After implementation:

```text
Macro/Substrate views should clearly show BLOCK geography.
Substrate + Macro View should reveal both geography and ecological macro regions.
Passages and choke points should be obvious.
Screen cells should feel less like identical rectangles.
Different archetypes should have visibly different blocker silhouettes.
Units should not strategically react to resources or dangers hidden behind unbroken BLOCK walls.
H/B/S intervention should continue working.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.2 rule sections are implemented
tests run
known simplifications or deviations
expected visual difference
whether sensing is now BLOCK-aware
```

