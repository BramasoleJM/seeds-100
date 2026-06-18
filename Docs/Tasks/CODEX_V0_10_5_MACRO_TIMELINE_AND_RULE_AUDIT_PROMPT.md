# CODEX V0.10.5 Macro Timeline And Rule Audit Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.5 as a focused architecture correction:

```text
1. make macro-layer evolution watchable and continuous
2. export a future-readable macro timeline file
3. audit V0.10.3 / V0.10.4 changes for unintended rule / generation drift
4. preserve performance headroom for later logic and art iteration
```

This follows:

```text
V0.10 Regional Substrate
V0.10.1 Screen-Cell Substrate
V0.10.2 Terrain Readability And Occlusion
V0.10.3 Performance And Macro Throttling
V0.10.4 Regression Repair
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
Docs/Tasks/CODEX_V0_10_4_REGRESSION_REPAIR_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing simulation behavior, macro behavior, export behavior, or generation behavior.

---

## User Requirements

The user explicitly wants:

```text
Macro layer evolution should be visible continuously.
There must be a file that stores macro-layer evolution over time.
That file can be any suitable format, but future features may need to read it.
The project must not become too slow because later logic and art iterations still need performance headroom.
```

The user is also concerned that recent performance / regression passes may have changed small rule or generation details that made the earlier Regional Substrate feel worse.

Treat V0.10.5 as both:

```text
macro timeline architecture
rule/generation audit
```

Do not treat this as a new gameplay feature pass.

---

## Key Diagnosis

Current implementation appears to mix three concerns:

```text
heavy macroWorld analysis
visual macro display masks
recorded macro history
```

This caused a bad tradeoff:

```text
Every-tick macro analysis was too slow.
V0.10.3/V0.10.4 throttling made the Macro/Substrate view feel jumpy or stale.
The recording format was reduced, but there is no dedicated readable macro evolution timeline.
```

V0.10.5 should separate these concerns.

---

## Target Architecture

Separate macro behavior into three layers:

```text
1. Simulation layer
   Runs H/B/S/F/W/M every tick.

2. Lightweight macro display layer
   Updates frequently enough to look continuous.
   Uses cheap current-grid summaries or masks.
   It should be suitable for on-screen Macro/Substrate display.

3. Heavy macro analysis / semantic timeline layer
   Runs less frequently.
   Preserves stable ids, region states, histories, routes, scars, memories.
   It should be suitable for future features: place names, rumors, events, map history.
```

Important:

```text
Do not go back to full heavy macroWorld analysis every tick.
Do not leave Macro/Substrate View visually frozen for 25 ticks.
```

---

## Part 1: Smooth Macro Display

Current problem:

```text
Macro/Substrate masks may update only when heavy macroWorld analysis updates.
This makes macro evolution appear to jump every several ticks.
```

Required behavior:

```text
Cell terrain and units continue to render every tick.
Macro/Substrate visual masks should update more frequently than heavy macroWorld.
Heavy macroWorld can still update on MACRO_ANALYSIS_INTERVAL.
```

Recommended approach:

```text
Add a lightweight macro display frame.
Update it every 3-5 ticks, or when the user steps manually.
Use cheap display masks from the current world.
Do not require full macro object matching / history for this layer.
```

Suggested constants:

```text
MACRO_ANALYSIS_INTERVAL = 25
MACRO_DISPLAY_INTERVAL = 5
MACRO_TIMELINE_SAMPLE_INTERVAL = 5
```

The exact numbers can be adjusted, but document them in rules and README.

Possible display-frame shape:

```js
{
  tick,
  counts,
  regionBiasCounts,
  masks: {
    settlements,
    abandoned,
    wildRecovery,
    spiritScars,
    frontiers,
    routes
  },
  maskRows: {
    settlement: ["...."],
    wildRecovery: ["...."],
    scar: ["...."],
    frontier: ["...."]
  }
}
```

Use compact row encoding for masks.

Do not store full terrainRows/unitRows in every display frame.

---

## Part 2: Macro Timeline Export

Add a dedicated export button and data structure:

```text
Export Macro Timeline JSON
```

Do not rely only on the existing full recording export.

The macro timeline file should contain both:

```text
visual evolution frames
semantic analysis frames
```

Recommended top-level shape:

```json
{
  "type": "tri_species_macro_timeline",
  "version": "0.1",
  "createdAt": "ISO timestamp",
  "startTick": 0,
  "endTick": 300,
  "sampleEvery": 5,
  "analysisEvery": 25,
  "grid": {
    "width": 40,
    "height": 25
  },
  "initialSettings": {},
  "regionalSubstrate": {},
  "frames": [],
  "analysisFrames": [],
  "interventions": []
}
```

`frames` are for visual replay:

```json
{
  "tick": 50,
  "counts": {},
  "regionBiasCounts": {},
  "maskCounts": {},
  "maskRows": {
    "settlement": ["...."],
    "wildRecovery": ["...."],
    "scar": ["...."],
    "frontier": ["...."],
    "route": ["...."]
  },
  "macroSummary": {
    "regions": 4,
    "events": 1,
    "routes": 1,
    "visibleIcons": 3
  }
}
```

`analysisFrames` are for future semantic features:

```json
{
  "tick": 50,
  "macroWorld": {
    "regions": [],
    "routes": [],
    "events": [],
    "memories": []
  }
}
```

Requirements:

```text
Timeline frames must be compact.
Timeline frames must not include full terrainRows/unitRows every sample.
Analysis frames may include full macroWorld snapshots at analysis cadence.
regionalSubstrate should be exported once at top level.
Interventions should be included once at top level or as compact per-frame events.
```

---

## Part 3: Timeline Recording Controls

Add simple controls.

Recommended UI:

```text
Start Macro Timeline
Stop Macro Timeline
Export Macro Timeline JSON
Clear Macro Timeline
```

If adding four buttons is too much, integrate with existing recording controls but keep export type separate.

Required behavior:

```text
Macro timeline can be recorded while simulation plays or steps.
Timeline recording should not require full normal recording.
Timeline recording should remain lightweight.
Manual Step should be able to add timeline samples when appropriate.
Runtime intervention should appear in timeline metadata.
```

Keep UI plain and consistent with existing controls.

---

## Part 4: Rule / Generation Audit

The user is concerned that V0.10.3 and V0.10.4 may have altered the good-feeling initial Regional Substrate behavior.

Audit the following changes and classify them:

```text
display/export only
performance only
map generation behavior
ecology behavior
macro interpretation behavior
```

Specifically inspect:

```text
BLOCK density target and archetype distribution
choke_pass / barrier_edge limits
refuge WILD decay protection
refuge Beast relocation bonus
hollow MARK persistence
reachable sensing behavior for settlers and Beasts
macro recovery filtering
macro analysis throttling
```

Create a short audit section in `README.md` or a new doc:

```text
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_RULE_AUDIT_CN.md
```

Recommended content:

```text
What changed since V0.10.2
Which changes affect rules/generation
Which changes only affect display/export/performance
Which rule-affecting changes were kept
Which were reverted or softened
Known remaining risks
```

Do not silently change ecology constants without documenting them.

---

## Part 5: Preserve Or Restore Good Earlier Feel

Do not blindly revert all V0.10.4 changes.

But if audit finds unnecessary rule drift, prefer restoring the earlier feel:

```text
Keep compact recording.
Keep BLOCK-aware sensing.
Keep screen-cell substrate.
Keep intervention.
Keep performance safeguards.
Avoid over-tuning refuge/hollow/Beast/WILD just for one recording.
```

If you change any of these, document why:

```text
BEAST_* constants
WILD decay
MARK decay
refuge modifiers
hollow modifiers
BLOCK density
archetype weights
macro recovery filtering
```

Prefer small, reversible adjustments.

---

## Part 6: Performance Budget

V0.10.5 must preserve performance headroom.

Required:

```text
Do not run heavy macro analysis every tick.
Do not store full world rows every timeline frame.
Do not rebuild expensive masks more often than needed.
Do not add canvas/WebGL/external libraries.
```

Recommended targets:

```text
Cell View no recording: under 20 ms/tick in fake-DOM benchmark.
Macro View no recording: under 25 ms/tick if practical.
Substrate View no recording: under 25 ms/tick if practical.
Macro timeline recording should be much closer to compact recording than old full recording.
```

Minimum:

```text
node tests/safety.test.js must pass.
```

---

## Tests

Add or update tests.

Recommended new test:

```text
tests/v0_10_5_macro_timeline_rule_audit.test.js
```

Test at least:

```text
macro timeline export has type tri_species_macro_timeline.
macro timeline export includes frames and analysisFrames.
frames use compact mask rows and do not include full terrainRows/unitRows.
analysisFrames include macroWorld snapshots at analysis cadence.
regionalSubstrate is exported once at timeline top level.
timeline can record while stepping without full recording enabled.
interventions appear in macro timeline metadata.
Macro display frame updates more frequently than MACRO_ANALYSIS_INTERVAL.
heavy macroWorld analysis still does not run every tick.
safety.test.js still passes.
V0.10.4 regression tests still pass unless intentionally updated with documented reason.
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
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing V0.10/V0.9 tests and report the difference.

---

## Files Likely To Change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
index.html
style.css
sim.js
tests/v0_10_5_macro_timeline_rule_audit.test.js
```

Possibly:

```text
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_RULE_AUDIT_CN.md
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
final art
```

---

## Expected Result

After implementation:

```text
Macro/Substrate evolution should look more continuous.
Heavy semantic macroWorld can still update at interval cadence.
There is a dedicated Macro Timeline JSON export.
The timeline contains both visual frames and semantic analysis frames.
Timeline files are compact enough to be useful later.
The user can keep watching the macro layer without the app feeling frozen.
Performance remains acceptable.
Rule/generation changes from V0.10.3/V0.10.4 are audited and documented.
Any unnecessary ecology/generation drift is reverted or softened.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.5 rule sections are implemented
how to record/export Macro Timeline JSON
timeline file shape
tests run
performance measurements if available
rule/generation audit summary
which changes were display/export only
which changes affected ecology or generation
known simplifications or deviations
expected visual/interaction difference
```

