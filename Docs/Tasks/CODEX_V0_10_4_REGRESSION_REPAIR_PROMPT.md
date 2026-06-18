# CODEX V0.10.4 Regression Repair Prompt

You are Executor for the Tri-Species WorldSim project.

Implement a V0.10.4 regression repair pass.

This follows:

```text
V0.10 Regional Substrate
V0.10.1 Screen-Cell Substrate
V0.10.2 Terrain Readability And Occlusion
V0.10.3 Performance And Macro Throttling
```

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_SIDE_CHAT_MEMORY_CN.md
Docs/Tasks/CODEX_V0_10_REGIONAL_SUBSTRATE_PROMPT.md
Docs/Tasks/CODEX_V0_10_1_SCREEN_CELL_SUBSTRATE_PROMPT.md
Docs/Tasks/CODEX_V0_10_2_TERRAIN_READABILITY_AND_OCCLUSION_PROMPT.md
Docs/Tasks/CODEX_V0_10_3_PERFORMANCE_AND_MACRO_THROTTLING_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing simulation behavior, map generation behavior, macro behavior, or export behavior.

---

## Observed Regression

After V0.10.3, recording size improved, but the experience appears worse.

Evidence from `tri_species_recording_ticks_0000_0329.json`:

```text
Recording size improved:
330 frames
2.90 MB
macroFrames 15
```

Compared with the previous V0.10.2 recording:

```text
644 frames
10.76 MB
macroFrames 500
```

So export/macro-frame reduction worked.

However, major regressions remain:

```text
safety.test.js fails:
300 ticks should finish under 5000ms
actual: about 5075ms

Macro information became too sparse:
V0.10.4 candidate recording had only 5 regions, 3 visible icons, 2 wildRecovery masks, 0 spiritScars.

Ecology skewed strongly toward Beast/WILD:
H 24 -> 69
B 18 -> 51
FIELD 60 -> 178
WILD 124 -> 190
MARK 32 -> 7

BLOCK count was high:
205 / 1000 cells
```

User report:

```text
This version feels worse.
```

Treat this as a regression repair, not a feature expansion.

---

## Goal

Recover a good-feeling V0.10 line:

```text
Keep recording size improvements.
Restore safety/performance margin.
Keep BLOCK-aware sensing, but reduce its hot-loop cost.
Keep screen-cell geography, but avoid overblocking.
Restore enough macro information that Macro/Substrate View feels alive.
Preserve runtime H/B/S intervention.
```

Do not add new systems.

---

## Non-Goals

Do not add:

```text
new gameplay
new terrain types
actual multi-screen gameplay
screen-to-screen propagation
map editor
brush painting
save/load
NPCs
quests
story events
resource economy
external libraries
network calls
```

---

## Required Fix Areas

### 1. Restore Safety Performance

`node tests/safety.test.js` must pass again.

The current failure is:

```text
300 ticks should finish quickly enough in tests, got about 5075ms
```

Required:

```text
300 ticks should complete under the existing 5000ms test threshold.
Do not weaken or delete the test just to pass.
```

Investigate likely hotspots:

```text
reachableCellsInRadius flood fill
movement target search
settler target search
beast relocation target ranking
macro/substrate rendering
macro display mask building
BLOCK-heavy map generation increasing path/sensing work
```

Expected fix direction:

```text
Reduce unnecessary reachable sensing calls.
Cache reachable results per source world, x, y, radius, and passability mode.
Avoid flood fill for radius 1 local checks.
Avoid repeated reachable scans for the same unit during one movement phase.
Keep macro analysis throttled.
```

### 2. Keep Recording Compact Without Killing Macro Readability

Keep V0.10.3's good result:

```text
macroRecentFrames should not store full world rows every tick.
recording frames should stay compact.
keyframes can store full rows.
regionalSubstrate should not be repeated unnecessarily.
```

But restore readable macro output.

Problem:

```text
Macro objects became too sparse or stale-feeling.
The world may look less alive despite valid ecology.
```

Required:

```text
Macro View should still show enough settlement, wild recovery, scar/frontier/route information.
Do not reduce macroWorld to only a few icons unless the map truly has only a few features.
Macro throttling should not hide active macro phenomena for too long.
```

Suggested approach:

```text
Keep full macro analysis interval-based.
Add lightweight display refreshes if needed, but avoid full expensive analysis every tick.
Separate "analysis cadence" from "display mask freshness".
Keep recent event summaries compact but sufficient for macro detectors.
```

### 3. Tune BLOCK Density

Current V0.10.3 candidate had:

```text
BLOCK = 205 / 1000
```

This may be too high for both readability and performance.

Target:

```text
Prefer roughly 120-170 BLOCK cells for default Balanced preset.
Avoid regularly exceeding 180 BLOCK cells.
Never let generated geography feel like a maze unless the archetype is explicitly a choke/pass cell.
```

Do not remove geographic structure.

Instead:

```text
Reduce internal blocker density.
Keep exits and major barriers readable.
Use fewer but more meaningful blockers.
Avoid overusing choke_pass archetypes.
Avoid too many high-block archetypes in one seed.
```

### 4. Rebalance Archetype Distribution

The candidate layout included many choke/pass or barrier-heavy cells.

Required:

```text
Ensure each generated map has readable variety.
Avoid too many choke_pass / barrier_edge cells.
Ensure at least some open_basin / plain / refuge cells have spacious interiors.
```

Suggested distribution:

```text
At most 2-3 choke_pass / barrier_edge cells in a 4 x 3 layout.
At least 3 mostly-open cells.
At least 1 basin and 1 refuge should have enough open space for visible ecology.
Hollow should be present but not dominate map flow.
```

Document simplification in README if exact counts are seed-dependent.

### 5. Rebalance Beast/WILD Skew

The candidate result at tick 329:

```text
B 18 -> 51
WILD 124 -> 190
MARK 32 -> 7
```

This may make the world feel too cleaned / too green / too Beast-heavy.

Required:

```text
Do not revert Beast recovery.
Do not make Spirit permanent.
But reduce overcorrection where Beast/WILD suppresses MARK too completely or dominates macro readability.
```

Investigate:

```text
Did refuge bias become too strong?
Did BLOCK-aware sensing or terrain generation give Beasts too much safe habitat?
Did macro filtering hide scars even when MARK exists?
Did hollow generation become too small or too isolated?
```

Possible fixes:

```text
Slightly reduce refuge initial WILD bias.
Slightly reduce Beast relocation attraction to refuge.
Let hollow MARK persistence survive Beast cleanup a little better.
Do not increase Spirit spawning directly.
```

Keep changes small and documented.

### 6. Preserve Good V0.10.3 Changes

Do not lose:

```text
compact recording frames
macroFrames cap
regionalSubstrate export
regionBiasRows in keyframes
BLOCK-aware sensing behavior
Substrate + Macro View
runtime H/B/S intervention
```

---

## Tests

Add or update tests.

Recommended new test:

```text
tests/v0_10_4_regression_repair.test.js
```

Test at least:

```text
safety performance test passes without weakening the threshold.
default generated BLOCK count is within a reasonable range for known seeds.
generated layout does not overuse choke_pass / barrier_edge archetypes.
macroRecentFrames remain compact and do not include full terrainRows/unitRows/fertilityRows.
recording keyframes still include full rows.
macroWorld after several hundred ticks has nonzero useful regions for a known seed.
runtime intervention still works.
V0.10.2 reachable sensing tests still pass.
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
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed test file does not exist locally, run the nearest existing V0.10/V0.9 tests and report the difference.

---

## Performance Measurement

Before and after implementation, measure or estimate:

```text
300 ticks Cell View no recording
300 ticks Macro View no recording
300 ticks Substrate View no recording
300 ticks Cell View recording
300 ticks Substrate View recording
```

Report before/after if possible.

Minimum required:

```text
node tests/safety.test.js passes.
```

---

## Files Likely To Change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
sim.js
tests/v0_10_4_regression_repair.test.js
```

Possibly:

```text
tests/safety.test.js
tests/v0_10_3_performance_macro_throttling.test.js
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Do not weaken performance tests unless there is a documented, unavoidable reason.

Prefer the root rule file as source of truth.

---

## Expected Result

After implementation:

```text
The app should feel less sluggish.
safety.test.js should pass.
Recording should stay smaller than the pre-V0.10.3 bloated recording.
Macro View should not feel empty or dead.
BLOCK geography should remain readable but not over-dense.
Beast/WILD should remain visible without wiping out all scar/ruin readability.
H/B/S intervention should continue working.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.4 rule sections are implemented
tests run
before/after performance measurements
recording size impact if measured
known simplifications or deviations
expected visual/interaction difference
whether safety.test.js passes
```

