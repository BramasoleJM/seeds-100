# CODEX V0.10.8.3 Rot Source Inner Ring Hardening Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.8.3 as a small targeted correction after V0.10.8.2.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_8_1_POI_ECOLOGY_ANCHOR_REBALANCE_PROMPT.md
Docs/Tasks/CODEX_V0_10_8_2_POI_BLOCKING_AND_VISUAL_PRIORITY_PROMPT.md
tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
tests/v0_10_8_2_poi_blocking_visual_priority.test.js
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing behavior.

---

## User Feedback

V0.10.8.2 mostly fixed POI blocking and visual priority:

```text
Spring center is now blocked.
Spring surrounding fertility still works.
Great Forest and Beast/WILD are more stable.
The four POIs export correctly.
```

Remaining issue:

```text
Rot Source is still not source-like enough.
It works numerically, but its inner area can visually and ecologically read as WILD/Beast-contested rather than as a persistent corruption source.
```

Recent exported data showed:

```text
rot_source center stays or returns to MARK.
rot_source radius 1 can still contain more WILD than MARK.
The visible impression can become "low fertility / wild contest" instead of "corruption source".
```

---

## Hard Scope

This is a small rot-source-only patch.

Do not change:

```text
grid size
terrain enum
unit enum
view mode options
existing control ids
the four POI set
monument behavior
spring behavior
spring blocking
great_forest behavior
macro timeline frame top-level keys
recording frame required keys
core counter-cycle rules
```

Do not add:

```text
new terrain types
new species
Zelda-style multi-screen map
map editor
save/load
NPCs
quests
dialogue
resource economy
runtime-created POIs
POI cleansing / construction / unlocking
external libraries
canvas/WebGL rewrite
```

Allowed:

```text
adjust rot_source center / radius 1 effect
adjust rot_source visual priority
adjust rot_source tests
update rules / README
```

---

## Target Behavior

Rot Source should have a stable identity:

```text
center = unmistakable corruption source
radius 1 = persistent inner corruption ring
radius 2-4 = contested ecological outer ring
```

The important change is radius 1.

V0.10.8.3 should make:

```text
rot_source center and radius 1 strongly remain MARK unless BLOCK/BORDER.
rot_source radius 1 should not be visually erased by WILD / FIELD / population shape colors.
rot_source outer ring may still be contested by Human / Beast / Spirit colors.
```

Do not make the entire radius 4 solid purple.

---

## Rule Adjustment

Current rot_source intent:

```text
center remains MARK
radius 1 strongly keeps/recreates MARK probabilistically
radius 2-4 lowers fertility / creates scar pressure
```

Change to:

```text
center:
- deterministic MARK unless BLOCK/BORDER.

radius 1:
- deterministic or near-deterministic MARK restoration for non-BLOCK / non-BORDER cells.
- If the cell has an active unit, do not delete the unit.
- If converting the terrain under a Beast/Human would be too disruptive, choose the simplest visible option:
  terrain becomes MARK after POI effects, but normal unit survival/conflict may handle consequences later.

radius 2-3:
- keep existing FIELD-to-MARK pressure and fertility loss.

radius 4:
- keep existing softer fertility decline / scar memory behavior.
```

Recommended first implementation:

```text
For center and distance <= 1:
if terrain is not BLOCK and not BORDER:
    terrain = MARK
    terrainAge = 0
```

This is intentionally strong. It is a source hardening patch, not final balance.

---

## Visual Adjustment

Rot Source visual priority should be:

```text
center: strongest, dark purple source marker
radius 1: clear corruption ring
radius 2-4: weaker contested halo
```

Update CSS so:

```text
poi-rot-core is visibly stronger than population-human / population-beast / population-spirit overlays.
poi-rot-inner is visibly purple/corrupt even if the cell also has poi-contested-beast or poi-contested-human.
poi-rot-outer remains lighter and may show contest hints.
```

Important:

```text
Do not rely only on terrain MARK color.
Use POI-specific classes to preserve source identity.
Do not let Beast/WILD green or Human/FIELD yellow dominate radius 1.
```

If needed, add one display-only class:

```text
poi-rot-hardened
```

Use it only for center + radius 1.

---

## Export / Interfaces

Keep exports compact.

Do not add full rot influence rows to recording or macro timeline frames.

Allowed additive compact metadata:

```js
rot_source POI may include innerRadius: 1
```

Macro timeline frame top-level keys must remain unchanged:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

---

## Tests

Use TDD. Add:

```text
tests/v0_10_8_3_rot_source_inner_ring_hardening.test.js
```

Required assertions:

```text
rot_source center becomes/remains MARK under applyPOIEffects.
rot_source radius 1 cells become/remain MARK under applyPOIEffects.
rot_source radius 1 does not convert BLOCK or BORDER.
rot_source radius 2-4 is not forced entirely to MARK.
rot_source inner ring keeps units intact if a unit is present.
Macro View mask gives center poi-rot-core.
Macro View mask gives radius 1 poi-rot-inner and/or poi-rot-hardened.
poi-rot-inner / poi-rot-hardened CSS is stronger than ordinary contested classes.
poi-rot-outer remains visually distinct from inner ring.
Macro timeline frame top-level keys remain unchanged.
pointsOfInterest still exports four compact POIs.
```

Update existing V0.10.8.1 / V0.10.8.2 tests only if they conflict with the new deterministic inner ring expectation.

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_8_initial_poi_world_anchors.test.js
node tests/v0_10_8_1_poi_ecology_anchor_rebalance.test.js
node tests/v0_10_8_2_poi_blocking_visual_priority.test.js
node tests/v0_10_8_3_rot_source_inner_ring_hardening.test.js
```

If a listed test does not exist locally, run the closest existing tests and report the difference.

---

## Rules / Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.8.3 Rot Source Inner Ring Hardening
```

Document:

```text
Rot Source center and radius 1 are persistent corruption.
Rot Source outer ring remains contested ecology.
The patch does not change spring, great forest, monument, terrain enum, species, map size, quests, NPCs, save/load, or multi-screen gameplay.
```

Update version string:

```text
TRI_SPECIES_WORLD_SIM_V0.10.8.3_ROT_SOURCE_INNER_RING_HARDENING
```

Update `README.md` with a short summary.

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Run 300-600 ticks.
4. Confirm rot_source center remains visually obvious.
5. Confirm radius 1 reads as corruption ring, not WILD/Beast or FIELD/Human territory.
6. Confirm radius 2-4 can still show contested ecology.
7. Confirm spring center blocking still works.
8. Confirm great forest still preserves Beast/WILD region.
9. Export Macro Timeline JSON and confirm frame top-level keys are unchanged.
```

Expected visual difference:

```text
Rot Source should now read as a persistent corruption source with a clear inner ring.
The map should still show ecological contest around it, but not over the source itself.
```

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether terrain/unit enums stayed unchanged
which V0.10.8.3 rule section was implemented
rot source center/radius 1 behavior
rot source visual-priority changes
confirmation that spring/great forest/monument were not intentionally rebalanced
JSON export changes or confirmation of no shape breakage
known simplifications or deviations
expected visual difference
```

