# CODEX V0.10.9.1 Macro Memory Tuning Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.9.1 as a focused tuning pass after V0.10.9 Macro Memory Slow Trace.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_9_MACRO_MEMORY_SLOW_TRACE_PROMPT.md
tests/v0_10_9_macro_memory_slow_trace.test.js
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing behavior or exports.

---

## User Goal

V0.10.9 proved that slow macro memory is useful, but exported results showed over-saturation:

```text
By tick ~800, human and conflict memory covered too much of the map.
Strong memory became common enough that it risks becoming a new visual noise layer.
POI states became meaningful, but some labels fired too early or too broadly.
```

V0.10.9.1 should make macro memory more restrained and reliable before any future lineage / inheritance system is attempted.

This is the preparatory step for later Human lineage work, but do not implement lineage in this task.

---

## Findings From V0.10.9 Export

The user-provided V0.10.9 macro timeline showed:

```text
macroSummary.macroMemory and poiStates exported correctly.
recording.macroMemorySummary exported correctly.
No full trace rows were exported.
```

But memory was too broad:

```text
At late ticks, human active memory reached roughly 75%+ of the map.
conflict active memory reached roughly 50%+ of the map.
strongCells were also very high, especially human and conflict.
```

Problem interpretation:

```text
The mechanism works, but trace gain / threshold / conflict rules are too permissive.
```

---

## Hard Scope

Do not add:

```text
population lineage
individual identity
unit genealogy
dynamic POIs
new terrain types
new species
Zelda-style multi-screen map
map editor
save/load
NPCs
quests
dialogue
resource economy
network calls
external libraries
canvas/WebGL rewrite
full replay system
```

Do not change:

```text
grid size
terrain enum
unit enum
view mode options
existing control ids
four initial POIs
spring blocking
great_forest behavior
rot_source inner ring behavior
core counter-cycle rules
macro timeline frame top-level keys
recording frame required keys
```

Allowed:

```text
adjust macro memory constants
adjust conflictTrace accumulation rules
adjust visible memory thresholds
adjust POI state label thresholds / warmup
adjust compact macroMemory summary fields if additive and useful
tests / README / rules updates
```

---

## Tuning Goals

Macro memory should be:

```text
slow
selective
secondary to current population shapes
useful for later lineage analysis
not a new full-map color wash
```

Target behavior after 600-900 ticks:

```text
active memory can cover broad historical areas.
strong memory should be meaningfully smaller than active memory.
conflict memory should identify recurring frontier/conflict zones, not every human+beast overlap history.
POI states should not show dramatic labels before enough memory has accumulated.
```

Recommended target ranges for typical runs:

```text
strongCells.human usually below ~45-55% of non-BLOCK cells.
strongCells.conflict usually below ~20-30% of non-BLOCK cells unless the world is genuinely border-heavy.
activeCells may be higher, but should still be interpretable.
```

These are guidance, not hard deterministic assertions across all seeds.

---

## Constants To Adjust

Current V0.10.9 constants may be too aggressive.

Recommended starting changes:

```text
MACRO_MEMORY_DECAY: from 0.992 to about 0.988 or 0.990
MACRO_MEMORY_TERRAIN_GAIN: from 0.025 to about 0.016
MACRO_MEMORY_SHAPE_BODY_GAIN: from 0.035 to about 0.022
MACRO_MEMORY_SHAPE_CORE_GAIN: from 0.055 to about 0.038
MACRO_MEMORY_POI_GAIN: from 0.030 to about 0.020
MACRO_MEMORY_CONFLICT_GAIN: from 0.045 to about 0.026
MACRO_MEMORY_FAINT_THRESHOLD: from 0.32 to about 0.36
MACRO_MEMORY_STRONG_THRESHOLD: from 0.50 to about 0.62
```

You may tune slightly if tests show these exact values are poor, but keep the intent:

```text
less gain,
slightly faster forgetting,
higher strong threshold.
```

Expose constants for tests as already done or add test access if needed.

---

## Conflict Trace Tightening

Current conflictTrace is too broad because humanTrace + beastTrace overlap can repeatedly create conflict memory.

Change conflict accumulation:

```text
Strong conflict gain should come from:
- BORDER terrain
- macro-cell-frontier / explicit frontier mask
- current local Human + Beast adjacency / pressure
- POI contested ring if real current evidence exists
```

HumanTrace + BeastTrace overlap alone should not repeatedly add full conflict gain.

Recommended behavior:

```text
If humanTrace and beastTrace are both high but no current frontier/BORDER/local H-B pressure exists:
  add no conflict, or add only a very small overlap hint.

If current Human/Beast adjacency exists:
  add conflict gain.

If cell is BORDER:
  add conflict gain.

If macro display mask has macro-cell-frontier:
  add conflict gain.
```

Display:

```text
memory-conflict-strong should require actual conflictTrace >= strong threshold.
humanTrace + beastTrace overlap may produce memory-conflict-faint only if conflictTrace is near faint threshold.
```

Do not let historical overlap alone paint half the map as active conflict.

---

## POI State Warmup And Priority

POI state labels are useful but need better timing and priority.

Add a warmup:

```text
Before enough macro memory exists, use "forming" or conservative labels.
```

Recommended:

```text
If tick < 50 or local total memory average is below a small threshold:
  monument: forming
  great_forest: forming
  rot_source: forming
  spring: neutral
```

If adding `forming` expands label sets, update docs/tests.

Label priority adjustments:

```text
rot_source:
If conflict is very high or human/beast traces are both high around source, prefer contested over dominant.
Only use dominant when rot is high and contest is not high.

spring:
Use corrupted only when rotTrace is clearly high, not just mild contamination.
Otherwise choose wild_fed / field_fed / neutral from human vs beast balance.

monument:
Use haunted only when rotTrace is clearly high and sustained.
Avoid fallen at tick 0 due to lack of memory.

great_forest:
Use contested when human pressure/conflict is meaningful.
Use flourishing only when beast/wild is high and conflict is low.
```

Keep labels deterministic.

---

## Export Requirements

Keep V0.10.9 export shape.

Macro timeline frame top-level keys must remain:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

Keep:

```text
macroSummary.macroMemory
macroSummary.poiStates
recording.macroMemorySummary
```

Do not export full trace arrays.

Allowed additive compact fields:

```js
macroSummary.macroMemory.nonBlockCells
macroSummary.macroMemory.coverage
```

If added, keep it compact:

```js
coverage: {
  activePct: { human, beast, rot, fertility, conflict },
  strongPct: { human, beast, rot, fertility, conflict }
}
```

This can help later analysis, but do not add it if it causes broad test churn.

---

## Display Requirements

Macro memory display should become more restrained:

```text
memory-strong classes should appear less often.
memory-faint can remain broad but subtle.
conflict memory should be much more localized.
POI centers / rot core / spring center / great forest core remain visually above memory.
```

If needed, reduce memory overlay opacity slightly.

Do not create a new view mode.

---

## Tests

Use TDD. Add:

```text
tests/v0_10_9_1_macro_memory_tuning.test.js
```

Update:

```text
tests/v0_10_9_macro_memory_slow_trace.test.js
```

Required assertions:

```text
macro memory constants reflect the tuned lower-gain / higher-threshold intent.
Repeated signal still accumulates visible memory.
One-frame noise still stays below visible threshold.
Strong memory requires more repeated signal than V0.10.9.
ConflictTrace does not grow strongly from humanTrace + beastTrace overlap alone.
ConflictTrace grows from BORDER / frontier / current Human-Beast adjacency.
memory-conflict-strong is not emitted from overlap alone.
POI states use warmup/conservative labels before enough memory accumulates.
rot_source prefers contested over dominant when conflict is very high.
spring corrupted threshold is stricter.
macro timeline frame top-level keys remain unchanged.
macroSummary.macroMemory and poiStates remain present.
recording.macroMemorySummary remains present and compact.
No full trace arrays are exported.
pointsOfInterest export remains compact.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_9_macro_memory_slow_trace.test.js
node tests/v0_10_9_1_macro_memory_tuning.test.js
```

Also run relevant recent POI tests:

```text
node tests/v0_10_8_2_poi_blocking_visual_priority.test.js
node tests/v0_10_8_3_rot_source_inner_ring_hardening.test.js
```

If a listed test does not exist locally, run the closest existing tests and report the difference.

---

## Rules / Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.9.1 Macro Memory Tuning
```

Document:

```text
Macro memory remains observer-only.
This patch tunes trace gains, decay, thresholds, conflict accumulation, and POI labels.
The goal is selective readable memory, not full-map historical wash.
This patch prepares for a later Human lineage prototype but does not implement lineage.
No terrain, species, POI set, quests, NPCs, save/load, or multi-screen gameplay are added.
```

Update version string:

```text
TRI_SPECIES_WORLD_SIM_V0.10.9.1_MACRO_MEMORY_TUNING
```

Update `README.md` with a short summary.

---

## Manual / Export QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Run 600-900 ticks.
4. Export Macro Timeline JSON.
5. Export Recording JSON.
6. Confirm macroSummary.macroMemory still exists.
7. Confirm poiStates still exist.
8. Confirm strong memory coverage is lower than V0.10.9 on a typical run.
9. Confirm conflict memory is more localized.
10. Confirm one-frame/flicker areas do not become visible memory.
```

Important:

```text
Report the exported macroMemorySummary / macroMemory coverage values after the run.
The user will provide recording or macro timeline output for follow-up analysis.
```

---

## Future Direction: Human Lineage

Do not implement this now.

V0.10.9.1 should make memory reliable enough for a future V0.11 Human Lineage Prototype:

```text
Track Human population-shape lineage rather than individual unit genealogy.
Detect descendants of earlier Human settlements via shape continuity, settler routes, and memory traces.
Export compact lineage summaries for later analysis.
```

Mention in the report if memory now looks stable enough to support that next step.

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether terrain/unit enums stayed unchanged
which V0.10.9.1 rule section was implemented
tuned memory constants
conflictTrace tightening behavior
POI state warmup / priority changes
export fields preserved or added
confirmation that full trace rows are not exported
expected visual difference
whether this appears ready for future Human lineage work
```

