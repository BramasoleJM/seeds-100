# CODEX V0.10.3 Performance And Macro Throttling Prompt

You are Executor for the Tri-Species WorldSim project.

Implement a V0.10.3 performance correction pass.

This follows:

```text
V0.10 Regional Substrate
V0.10.1 Screen-Cell Substrate
V0.10.2 Terrain Readability And Occlusion
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
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing simulation behavior or export behavior.

---

## Observed Problem

A V0.10.2 recording around 643 ticks showed acceptable ecology results, but the app now feels slow.

Local benchmark evidence:

```text
Cell View, no recording:       about 13.55 ms/tick
Macro View, no recording:      about 54.06 ms/tick
Substrate View, no recording:  about 40.45 ms/tick
Cell View, recording:          about 18.25 ms/tick
Substrate View, recording:     about 38.57 ms/tick
```

The recording file for only 643 ticks was about 11.3 MB.

Likely causes:

```text
Macro/Substrate rendering triggers too much macro analysis and mask rebuilding.
renderWorld() may force ensureMacroAnalysis() too often.
buildMacroDisplayMasks() may be recomputed too often.
pushMacroRecentFrame() stores full world rows too frequently.
reachableCellsInRadius() added useful BLOCK-aware sensing, but it increases per-tick work.
Macro object counts, especially wildRecovery regions, may be too high for smooth display.
```

---

## Goal

Make V0.10.2 smooth enough for normal play while preserving:

```text
screen-cell substrate
BLOCK-aware sensing
Substrate + Macro View
runtime H/B/S intervention
snapshot / recording export
macroWorld detection
existing ecology behavior
```

Do not add new gameplay systems.

---

## Performance Targets

Use local fake-DOM or browser-friendly benchmarks.

Recommended target for 300 ticks:

```text
Cell View no recording: under 20 ms/tick
Macro View no recording: under 25 ms/tick
Substrate View no recording: under 25 ms/tick
Cell View recording: under 25 ms/tick
Substrate View recording: under 30 ms/tick
```

If these exact numbers are not reachable without large rewrites, document the measured improvement and remaining bottleneck.

---

## Required Fix Areas

### 1. Macro analysis throttling

Current issue:

```text
Macro/Substrate rendering can cause macro analysis to run too often.
```

Required behavior:

```text
Normal simulation should update macroWorld on MACRO_ANALYSIS_INTERVAL, not every render.
renderWorld() should not force full macro analysis every tick just because Macro View is open.
Snapshot/export may still force fresh macro analysis when needed.
Reset and intervention may force analysis once.
```

Recommended approach:

```text
Keep macroWorld from last analysis.
Render Macro/Substrate View from latest available macroWorld.
Only call analyzeMacroWorldNow() when:
  - tick % MACRO_ANALYSIS_INTERVAL === 0 during simulation
  - reset happens
  - snapshot / recording export requires fresh data
  - intervention occurs and a one-time refresh is useful
```

Document any stale-display simplification:

```text
Macro/Substrate View may lag the cell simulation by up to MACRO_ANALYSIS_INTERVAL ticks.
```

### 2. Macro display mask caching

Current issue:

```text
buildMacroDisplayMasks() can rebuild all influence masks for every rendered tick.
```

Required behavior:

```text
Cache display masks by source world and macroWorld tick / display mode.
Avoid full mask rebuild if neither world nor macroWorld display source changed.
```

If the world changes every tick, consider:

```text
For Macro/Substrate View, rebuild masks only when macroWorld is re-analyzed.
Between analyses, reuse the previous display mask while still rendering units/terrain if needed.
```

Be careful:

```text
Cell View should remain accurate every tick.
Macro/Substrate View can be slightly stale by design.
```

### 3. Macro recent frame memory reduction

Current issue:

```text
pushMacroRecentFrame() stores full createWorldRows(world) output.
This includes terrainRows, unitRows, fertilityRows, terrainAgeRows, roles, and regionBiasRows.
Doing this frequently makes recordings and memory heavy.
```

Required behavior:

```text
macroRecentFrames should store compact counts/events/diagnostics by default.
Full world rows should be stored only in recording keyframes or explicit snapshot exports.
```

If macro analysis requires historical full rows, replace that dependency with compact summaries or keep a much smaller full-row sample.

Recommended compact frame:

```js
{
  tick,
  counts,
  events,
  diagnostics
}
```

Do not remove keyframes from recording export.

### 4. Recording size control

Recording should remain useful but not balloon unnecessarily.

Required checks:

```text
frames should remain compact.
keyframes can include full rows at keyframeEvery.
macroFrames should remain capped.
intervention metadata should remain small.
regionalSubstrate should not be repeated in every frame.
```

If `regionalSubstrate` is repeated in each keyframe, decide whether it can live once at top level plus regionBiasRows in keyframes. Document the choice.

### 5. Reachable sensing budget

Current issue:

```text
BLOCK-aware reachability is behaviorally correct but can be expensive.
```

Required behavior:

```text
Keep reachableCellsInRadius caching.
Ensure cache resets once per source world.
Avoid creating excessive objects in hot loops where simple arrays or cached cell references can work.
Use reachable sensing only where needed for medium/long-range strategic behavior.
Do not replace cheap adjacent 8-neighbor checks with flood fill.
```

Audit call sites and avoid accidental repeated calls with the same `(x,y,radius)` inside one tick.

### 6. Macro object filtering

Current issue:

```text
MacroWorld can contain many visible regions, especially wildRecovery.
This increases display cost and makes the map visually busy.
```

Required behavior:

```text
Keep useful macro interpretation.
Filter or merge low-confidence / overlapping recovery zones more aggressively.
Visible icons should remain capped.
Display masks should not paint redundant overlapping regions repeatedly.
```

Do not remove beast recovery zones entirely.

---

## Tests

Add or update tests.

Recommended new test:

```text
tests/v0_10_3_performance_macro_throttling.test.js
```

Test at least:

```text
renderWorld in macro/substrate mode does not call analyzeMacroWorldNow every tick.
macro analysis still runs at MACRO_ANALYSIS_INTERVAL during simulation.
snapshot export still includes current macroWorld.
macroRecentFrames do not include full terrainRows/unitRows/fertilityRows by default.
recording keyframes still include full rows.
recording export still includes regionalSubstrate and regionBiasRows where expected.
reachable sensing tests from V0.10.2 still pass.
runtime intervention still works.
```

Add a lightweight benchmark helper if useful:

```text
tests/performance_smoke.test.js
```

The performance smoke test should avoid fragile exact timing if the environment is noisy. Prefer broad thresholds or structural assertions, such as macro analysis call counts.

Run existing tests:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_regional_substrate.test.js
node tests/v0_10_1_screen_cell_substrate.test.js
node tests/v0_10_2_terrain_readability_occlusion.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed test file does not exist locally, run the nearest existing V0.10/V0.9 tests and report the difference.

---

## Files Likely To Change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
sim.js
tests/v0_10_3_performance_macro_throttling.test.js
```

Possibly:

```text
tests/safety.test.js
tests/json-export.test.js
style.css
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Prefer the root rule file as source of truth.

---

## Do Not Add

Do not add:

```text
new gameplay systems
actual multi-screen gameplay
screen-to-screen propagation
map editor
brush terrain painting
undo/redo
save/load
new terrain types
NPCs
quests
story events
resource economy
external libraries
network calls
```

---

## Expected Difference

After implementation:

```text
Macro View and Substrate + Macro View should feel much less sluggish.
Recording should grow more slowly.
Macro display may update at interval cadence instead of every tick.
Cell View should remain accurate every tick.
BLOCK-aware sensing should remain intact.
The simulation should still produce settlements, beast recovery zones, scars, routes, and frontiers.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.3 rule sections are implemented
tests run
before/after performance measurements if available
recording size impact if measured
known simplifications or deviations
expected visual/interaction difference
```

