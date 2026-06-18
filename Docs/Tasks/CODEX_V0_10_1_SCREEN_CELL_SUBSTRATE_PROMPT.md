# CODEX V0.10.1 Screen-Cell Substrate Prompt

You are Executor for the Tri-Species WorldSim project.

Implement a V0.10.1 readability and generation correction for Regional Substrate.

This is a follow-up to V0.10 Regional Substrate. The current V0.10 implementation appears functionally useful, but its geography is not readable enough:

```text
Substrate regions exist, but they feel like random blobs.
BLOCK walls feel scattered and random.
BLOCK color is too close to EMPTY / dark background.
Substrate + Macro View does not clearly show geographic separation.
Different geography regions are hard to perceive even when they affect simulation.
Runtime H/B/S intervention seems useful and should be kept.
```

The new goal is to move from random region blobs toward a Zelda-like screen-cell map structure while still keeping the project single-screen.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_SIDE_CHAT_MEMORY_CN.md
Docs/Tasks/CODEX_V0_10_REGIONAL_SUBSTRATE_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing simulation behavior.

---

## Goal

Replace or substantially reshape the current random blob substrate generator with a screen-cell substrate layout.

The world remains one `40 x 25` simulation grid.

Internally, divide this single grid into larger logical map cells, inspired by first-generation Zelda overworld screens:

```text
Each large cell has local geography.
Each large cell has edge exits.
Adjacent large cells must connect through matching exits.
BLOCK forms readable borders, ridges, pockets, and passages.
basin/refuge/hollow become geographic roles inside this larger map structure.
```

Do not implement actual multi-screen gameplay.

---

## Core Concept

Current V0.10 problem:

```text
regionBias blobs and BLOCK ridges are generated directly on the 40 x 25 grid.
This creates functional substrate, but the result can look like random paint and scattered walls.
```

V0.10.1 target:

```text
Generate a higher-level screen-cell layout first.
Then paint each screen cell into the 40 x 25 grid.
Then run the existing ecology on that structured substrate.
```

Suggested logical layout:

```text
4 columns x 3 rows
```

Each large cell is approximately:

```text
10 x 8 or 10 x 9 small simulation cells
```

It is acceptable if the final row sizes are uneven due to `25` height. Keep the implementation simple and document the simplification.

---

## Screen Cell Data

Represent each logical screen cell with:

```text
id
gridX
gridY
bounds
archetype
regionBias
exits: north / south / west / east
```

Exit values can be simple:

```text
open
narrow
blocked
```

Adjacent exits must match enough to create believable passages:

```text
cell A east open/narrow implies neighbor B west open/narrow.
cell A east blocked implies neighbor B west blocked unless this would isolate too much of the map.
```

Keep the map mostly traversable. Avoid fully sealing large areas unless there is at least one narrow passage.

---

## Archetypes

Use a small set of simple archetypes.

Recommended first-pass set:

```text
open_basin
field_basin
wild_refuge
deep_refuge
scar_hollow
closed_hollow
plain
choke_pass
barrier_edge
```

Each archetype determines:

```text
default regionBias
internal BLOCK shape
preferred edge exits
initial terrain tendency
visual silhouette
```

Do not add new terrain types yet.

Use existing terrain:

```text
BLOCK = hard geography barrier abstraction
EMPTY = passable ordinary ground
FIELD/WILD/MARK = ecology traces
```

---

## Generation Requirements

Use the current random seed system.

The generated map should vary across seeds but keep screen-cell readability.

Requirements:

```text
Do not place exactly one basin, one refuge, one hollow in fixed corners.
Do not paint basin/refuge/hollow as unstructured random blobs.
Generate 1-3 basin-like screen cells.
Generate 1-3 refuge-like screen cells.
Generate 1-2 hollow-like screen cells.
The remaining screen cells can be plain, pass, barrier, or mixed.
Create at least one meaningful passage or choke point when possible.
Create some readable hard separation using BLOCK.
Keep enough open cells for initial unit placement and movement.
```

Suggested strategy:

```text
1. Create a 4 x 3 logical screen-cell grid.
2. Assign archetypes using weighted randomness.
3. Generate exits between neighboring logical cells.
4. Ensure basic connectivity between most cells.
5. Paint each logical cell into the 40 x 25 world:
   - outer walls or partial borders
   - openings at exits
   - internal BLOCK clusters or ridges
   - regionBias fill
   - small terrain traces based on archetype
6. Run existing initial FIELD/WILD/MARK patches and unit placement biased by screen-cell regionBias.
```

---

## Important Correction: Initial Placement

The current V0.10 implementation may effectively collapse each bias type into one centroid for placement.

That makes multiple basin/refuge/hollow regions less meaningful.

Fix this.

Initial placement should use multiple candidate centers, preferably one or more per relevant screen cell / region component.

Expected behavior:

```text
If there are 2 basin cells, Human/FIELD placement can use both, not only one global basin centroid.
If there are 2 refuge cells, Beast/WILD placement can use both.
If there are 2 hollow cells, MARK traces can use both.
```

Keep preset counts meaningful.

---

## Visual Requirements

The Substrate + Macro View must make geography legible.

Fix the current visual problems:

```text
BLOCK should be visibly distinct from EMPTY.
Substrate regions should remain visible under macro overlays.
basin/refuge/hollow should have clear tint or outline.
Logical screen-cell boundaries should be visible in Substrate + Macro View.
Passages/choke points should be visually obvious.
Macro regions should not completely hide the substrate.
```

Recommended display changes:

```text
Use stronger BLOCK color or outline.
Draw screen-cell borders as subtle grid lines in Substrate + Macro View.
Use semi-transparent macro overlay colors or outlines when in substrate view.
Add different texture/pattern hints for basin/refuge/hollow if plain color is insufficient.
Keep Cell View detailed and readable.
```

Do not create final art.

This is still a debug/design view.

---

## Runtime Intervention

Keep and preserve the V0.10 runtime intervention tool.

Required behavior remains:

```text
User selects Off / H / B / S.
User clicks one grid cell.
Selected unit is placed on a non-BLOCK cell.
BLOCK rejects placement.
The placement is visible immediately.
Stats update.
Interventions are exported or recorded in metadata.
```

Do not add brush painting, undo/redo, save/load, or a full map editor.

---

## JSON Export

Keep existing V0.10 export data:

```text
regionBiasRows
regionBiasCounts
intervention metadata
macroWorld.display.viewModes includes substrateMacro
```

Add screen-cell layout export if practical:

```json
{
  "regionalSubstrate": {
    "version": "0.10.1",
    "layout": {
      "columns": 4,
      "rows": 3,
      "cells": [
        {
          "id": "screen_0_0",
          "gridX": 0,
          "gridY": 0,
          "bounds": { "minX": 0, "minY": 0, "maxX": 9, "maxY": 7 },
          "archetype": "wild_refuge",
          "regionBias": "refuge",
          "exits": {
            "north": "blocked",
            "south": "open",
            "west": "blocked",
            "east": "narrow"
          }
        }
      ]
    }
  }
}
```

If adding full layout export is too much for this pass, export at least:

```text
regionalSubstrate.version
regionalSubstrate.columns
regionalSubstrate.rows
```

Document any simplification.

---

## Tests

Add or update focused tests.

Recommended test file:

```text
tests/v0_10_1_screen_cell_substrate.test.js
```

Test at least:

```text
same seed produces same regionBiasRows and screen-cell layout
different seeds can produce different layout
regionalSubstrate metadata exists in snapshot export
screen-cell layout has 4 columns and 3 rows
every exported screen cell has bounds, archetype, regionBias, and exits
adjacent exits are compatible
generated map contains visible non-none regionBias
generated map contains BLOCK barriers but does not become mostly BLOCK
initial placement can use multiple same-bias screen cells
Substrate + Macro View mode still exists
intervention still places H/B/S on non-BLOCK cells
intervention still rejects BLOCK cells
```

Run existing tests too:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_regional_substrate.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed test file does not exist in the local checkout, run the nearest existing V0.10/V0.9 tests and report that difference.

---

## Files likely to change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
index.html
style.css
sim.js
tests/v0_10_1_screen_cell_substrate.test.js
```

Possibly:

```text
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Prefer the root rule file as source of truth.

---

## Do Not Add

Do not add:

```text
actual multi-screen gameplay
screen-to-screen propagation
camera transitions
new mountain / river terrain types
tarot mechanics
NPCs
quests
story events
resource economy
village buildings
specific race names
final art
save/load
network calls
external libraries
full map editor
brush painting
undo/redo
```

---

## Expected Visual Difference

After implementation, the user should be able to see:

```text
The map is divided into readable large cells.
Each large cell has a rough geographic character.
BLOCK forms readable borders, pockets, ridges, or passages instead of random noise.
Passages between neighboring cells line up.
basin/refuge/hollow regions are visibly different.
Macro regions are readable without hiding the underlying substrate.
Intervention still lets the user inject H/B/S and watch ecological response.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.1 rule sections are implemented
tests run
known simplifications or deviations
expected visual difference
```

