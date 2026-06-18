# CODEX V0.10 Regional Substrate Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10 Regional Substrate for the existing single-screen prototype.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_SIDE_CHAT_MEMORY_CN.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing simulation behavior.

---

## Goal

Add a first-pass V0.10 Regional Substrate layer to the current `40 x 25` single-screen cellular world.

This stage should balance:

```text
1. lightweight ecology influence
2. visible map readability
3. simple runtime intervention experiments
```

Do not implement a full map editor yet.

---

## Current baseline

The current stable version is:

```text
TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

It already has:

```text
Cell View
Macro View
macroWorld
settlement / abandoned_settlement detection
beast_recovery_zone detection
spirit_outbreak / spirit_scar detection
migration_route detection
human_beast_frontier detection
JSON snapshot / recording export
tests
```

Keep this working.

---

## New V0.10 concept

Add hidden cell-level regional bias:

```text
regionBias: none | basin | refuge | hollow
```

Meanings:

```text
none   = ordinary area
basin  = Settlement Basin / 聚落盆地
refuge = Wild Refuge / 野地庇护区
hollow = Scar Hollow / 灵痕洼地
```

This is not a story layer. It is a soft geography layer.

The rule:

```text
Geography provides tendency.
Geography does not force outcomes.
```

---

## Important design constraint

Do not place exactly one basin, one refuge, and one hollow in three fixed corners.

The map should feel generated.

The substrate generator should produce seeded variation:

```text
1-3 basin regions
1-3 refuge regions
1-2 hollow regions
regions can be different sizes
regions can be offset from run to run
regions can be near each other or separated
BLOCK can form light barriers, pockets, and narrow passages
```

Use the existing random seed system.

Do not add new terrain types for mountain, river, lake, road, cave, village, or monument. Use existing `BLOCK` for hard barriers.

---

## Required implementation shape

### 1. Rules documentation

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with a new V0.10 section.

Document:

```text
regionBias cell field
basin / refuge / hollow meanings
seeded substrate generation
initialization bias
lightweight ongoing buffs
Substrate + Macro View
runtime intervention as debug-only experiment tool
JSON export additions
known simplifications
```

If you also keep the Docs copy synchronized, update:

```text
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
```

Only do that if the project currently expects root and Docs copies to match.

### 2. Cell data

Add `regionBias` to each cell.

Default:

```text
regionBias = "none"
```

Ensure clone/export/test helpers preserve it.

### 3. Seeded substrate generation

Add a small seeded generator inside the existing initialization flow.

Requirements:

```text
Use current randomSeed.
Generate variable basin/refuge/hollow blobs.
Blob count and size should vary within bounded ranges.
Avoid filling the entire map.
Avoid tiny single-cell noise.
Allow some overlap resolution by priority or first-write rule, but document the simplification.
Generate some BLOCK barriers/pockets/passages using existing BLOCK.
Keep starts playable.
```

Suggested simple approach:

```text
Pick blob centers.
Paint soft circular/oval patches with jitter.
Use density thresholds to avoid perfect circles.
Paint a few short BLOCK ridges or arcs.
Leave gaps in barriers so movement is not fully sealed.
```

Keep it readable and small. Do not build a general map editor.

### 4. Initialization bias

During initial world generation:

```text
basin should be more likely to receive FIELD and Human.
refuge should be more likely to receive WILD and Beast.
hollow should be more likely to receive MARK or old/low-fertility FIELD traces.
```

This should be probabilistic, not guaranteed.

The existing preset counts should still matter.

### 5. Lightweight ongoing buffs

Apply small region effects only.

Recommended first-pass rules:

```text
basin:
  FIELD absence decay is slightly slower.
  Human stability / survival gets a very small advantage.

refuge:
  WILD decay is slightly slower.
  EMPTY fertility recovery is slightly better.
  Beast relocation mildly prefers refuge cells.

hollow:
  MARK decay is slightly slower.
  Human stability is slightly worse.
  Do not directly spawn Spirit from hollow.
```

Do not broadly rewrite Human / Beast / Spirit core rules.

### 6. View mode

Add a third view mode:

```text
Cell View
Macro View
Substrate + Macro View
```

The new view should show:

```text
basin/refuge/hollow substrate tint or outline
existing macro regions/routes/frontiers over or alongside it
current units/terrain only if useful and not visually noisy
```

This is a debug/design view, not final art.

### 7. Runtime intervention tool

Add a simple debug-only intervention control.

Required behavior:

```text
User selects H / B / S.
User clicks one grid cell.
The selected unit is placed on that cell if the cell is in bounds and not BLOCK.
If the cell already has a unit, replace it or reject it using the simplest clear behavior; document the choice in README.md.
After placement, render and stats update.
Record the intervention in events/diagnostics or at least in snapshot/recording metadata if recording is active.
```

Keep it simple:

```text
No brush.
No undo/redo.
No save/load.
No full map editor.
No area painting in this version.
```

Optional if easy:

```text
Allow selecting terrain . / F / W / M for clicked cell.
```

If terrain placement adds too much scope, skip it and document that V0.10 only supports unit placement.

### 8. JSON export

Add substrate data to snapshot and recording keyframes.

Recommended shape:

```json
{
  "world": {
    "regionBiasRows": [
      "...."
    ]
  },
  "macroWorld": {
    "display": {
      "viewModes": ["cell", "macro", "substrateMacro"]
    }
  }
}
```

Use compact row encoding.

Suggested symbols:

```text
. = none
b = basin
r = refuge
h = hollow
```

Also add counts:

```text
regionBiasCounts.none
regionBiasCounts.basin
regionBiasCounts.refuge
regionBiasCounts.hollow
```

### 9. README

Update `README.md`.

Include:

```text
what V0.10 adds
how to use Substrate + Macro View
how to use runtime intervention
known simplifications
what is still not implemented
```

---

## Tests

Add focused tests. Do not rely only on visual inspection.

Suggested new test:

```text
tests/v0_10_regional_substrate.test.js
```

Test at least:

```text
cells have regionBias
same seed generates same regionBiasRows
different seeds can generate different regionBiasRows
regionBiasRows are exported
all four bias symbols are valid
generated map contains at least one non-none bias region
Substrate + Macro View is included in exported viewModes
click intervention can place a selected unit on a non-BLOCK cell
click intervention cannot place on BLOCK
```

Run existing tests too, especially:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If the repo has no test runner script, run the relevant `node tests/*.test.js` commands directly.

---

## Files likely to change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
index.html
style.css
sim.js
tests/v0_10_regional_substrate.test.js
```

Possibly:

```text
Docs/TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Keep documentation duplication under control. Prefer root rule file as source of truth.

---

## Do not add

Do not add:

```text
Zelda-style multi-screen map
screen-to-screen propagation
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

## Expected visual difference

After implementation:

```text
Substrate + Macro View should reveal basin/refuge/hollow geography.
Generated maps should not always place three regions in fixed corners.
Human settlements should tend to appear more often in basin.
Beast/WILD recovery should tend to read better in refuge.
MARK/scar traces should tend to persist more visibly in hollow.
Runtime click placement should let the user inject H/B/S and observe response.
```

---

## Report after changes

After implementation, report:

```text
files changed
how to run
which V0.10 rule sections are implemented
tests run
known simplifications or deviations
expected visual difference
```

