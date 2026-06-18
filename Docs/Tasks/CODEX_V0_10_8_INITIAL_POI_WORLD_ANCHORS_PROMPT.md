# CODEX V0.10.8 Initial POI World Anchors Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.8 as the first Point-of-Interest stage:

```text
Initial static POI world anchors
```

The goal is to add a small amount of readable world order on top of the existing emergent ecology.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_7_1_MACRO_POPULATION_VISUAL_PRIMARY_PROMPT.md
```

This project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing behavior.

---

## User Goal

The current simulation has strong emergence. The next stage should add readable order without replacing emergence.

The user wants POIs in three conceptual categories:

```text
1. Initial special individuals / regional states.
2. Runtime human-created special individuals / regional states.
3. Special individuals / regional states that only change under special conditions.
```

For V0.10.8, implement only category 1:

```text
initially existing static world anchors
```

Do not implement runtime-created POIs, quest POIs, unlockable POIs, dialogue, buildings, NPCs, or a full entity system yet.

---

## Current Visual Issue To Also Fix

In the latest Macro View screenshot, the user marked several unknown-looking grid patterns.

Diagnosis:

```text
The pale dotted pattern is the existing macro route marker.
It currently looks like a special terrain / resource / POI tile.
That makes the map harder to read now that true POIs are being introduced.
```

V0.10.8 must demote route styling:

```text
Routes should read as thin route aids, not as dotted special cells.
Legend must explain route/frontier/MARK-scar patterns clearly.
```

---

## Hard Scope

Do not change:

```text
grid size
terrain enum
unit enum
movement rules
core conflict cycle
species identities
regional substrate generation
screen-cell substrate layout
view mode options
existing control ids
macro timeline frame top-level keys
recording frame required keys
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
dialogue
resource economy
village buildings
network calls
external libraries
canvas/WebGL rewrite
complete entity-component framework
POI construction / cleansing / opening / unlocking
```

Allowed:

```text
new worldPOIs array/state
static initial POI placement
display-only POI classes
POI influence on existing public parameters
compact POI export summaries
tests for POI initialization, effects, display, and export
README / rules updates
route visual demotion
legend update
```

---

## POI Layer

Add an independent POI layer. POIs must not occupy `terrain` or `unit`.

Use this compact structure:

```js
{
  id: "poi_monument_001",
  type: "monument" | "rot_source" | "spring",
  x: number,
  y: number,
  radius: 4,
  strength: "strong",
  state: "active",
  createdAtTick: 0
}
```

The first implementation may keep this in `sim.js` near existing world/macro state helpers.

Do not create a broad entity framework yet. Keep the layer simple and readable.

---

## Initial POIs

Generate exactly three initial POIs:

```text
monument
rot_source
spring
```

All first-pass POIs use:

```text
radius = 4
strength = strong
state = active
createdAtTick = 0
```

Placement:

```text
monument:
Prefer basin / initial Human-FIELD area.
Fallback to any non-BLOCK cell near FIELD/Human influence.

rot_source:
Prefer hollow / MARK area.
Fallback to any non-BLOCK cell near MARK influence.

spring:
Prefer refuge or ordinary EMPTY/WILD area.
Fallback to any non-BLOCK, non-MARK cell away from rot_source.
```

Constraints:

```text
POI center must not be BLOCK.
Avoid overlapping POI centers. Keep centers at least 5 cells apart when possible.
Do not overwrite unit or terrain just to place a POI, except rot_source may force its center to MARK through its normal POI effect.
Placement should be deterministic under the existing random seed flow.
```

---

## Strong First-Pass Effects

The user explicitly wants first-pass effects to be stronger so POIs are visually and behaviorally detectable.

This is not final balance. The purpose is to verify whether POIs can become readable world anchors.

### Monument

Meaning:

```text
Human civilization / settlement memory center.
```

Effect:

```text
Within radius 4:
- FIELD decay chance is multiplied by about 0.5.
- FIELD haunted-to-MARK chance is multiplied by about 0.5.
- FIELD and EMPTY each tick have about 12% chance to gain +1 fertility, capped at 3.
```

Do not directly spawn Humans.
Do not directly create FIELD.

### Rot Source

Meaning:

```text
Persistent corruption / Spirit-scar anchor.
```

Effect:

```text
Center cell remains MARK unless it is BLOCK.
Within radius 1:
- Non-BLOCK / non-BORDER cells have about 30% chance per tick to become or remain MARK.

Within radius 4:
- MARK passive decay chance is multiplied by about 0.5.
- Non-BLOCK / non-BORDER cells have about 10% chance per tick to lose -1 fertility.
```

Do not directly spawn Spirits.
Do not create new terrain types.

### Spring

Meaning:

```text
Water / fertility recovery anchor.
```

Effect:

```text
Within radius 4:
- Non-BLOCK / non-MARK cells have about 18% chance per tick to gain +1 fertility, capped at 4.
```

Do not directly change terrain.
Do not suppress Spirit or MARK by itself.

---

## Update Order

Apply POI effects after fertility dynamics and before terrain decay.

Recommended tick flow:

```text
movement
lifecycle / conflict / reproduction / terrain rewrite
fertility dynamics
apply POI effects
terrain decay
render / stats / recording
```

If current code has a slightly different internal function order, keep the change minimal but document the actual order in rules and README.

---

## Display

POIs must be visible in Macro View and Substrate + Macro View.

Required display classes:

```text
poi-influence
poi-center
poi-monument
poi-rot-source
poi-spring
```

Display goals:

```text
POI center must be obvious but not cover the whole cell state.
POI influence radius should be readable as a soft ring / halo.
POI visuals should not look like unit letters.
POI visuals should not be confused with route markers.
```

Suggested semantics:

```text
monument: pale gold center + subtle square/column marker
rot_source: dark purple center + sharper scar/corrosion halo
spring: clear blue/cyan center + soft fertility halo
```

Route visual correction:

```text
Replace the large pale dotted route cell marker with a thinner line-like or corner-like route aid.
Avoid dense dotted patterns that look like resources or POIs.
Keep route readable but secondary.
```

Legend:

```text
Add "Points of Interest".
Explain monument / rot source / spring.
Explain route as a route aid.
Explain frontier and MARK/scar texture.
```

---

## Export / Interfaces

Add compact POI data without bloating per-frame exports.

Snapshot export:

```text
top-level pointsOfInterest: compact POI list
```

Recording export:

```text
top-level pointsOfInterest: compact POI list
```

Macro timeline export:

```text
top-level pointsOfInterest: compact POI list
```

Macro timeline frame top-level keys must remain stable:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

Inside `macroSummary`, add compact POI summary:

```js
poiSummary: {
  total: 3,
  byType: {
    monument: 1,
    rot_source: 1,
    spring: 1
  }
}
```

Do not add full POI influence rows to every timeline frame.

---

## Tests

Use TDD. Add:

```text
tests/v0_10_8_initial_poi_world_anchors.test.js
```

Test at least:

```text
initialization creates exactly one monument, one rot_source, and one spring.
Each POI has radius 4, strength strong, state active, and createdAtTick 0.
POI centers are not BLOCK.
POI centers are separated when possible.
Monument strong effect protects FIELD decay / haunted FIELD pressure or exposes the expected probability constants.
Rot source keeps center MARK and can spread/maintain MARK within radius 1.
Rot source can lower fertility within radius 4.
Spring can restore fertility within radius 4 without changing terrain.
Macro View renders poi-center / poi-influence and type classes.
Substrate + Macro View also renders POI classes.
Legend contains Points of Interest and names all three POIs.
Route styling no longer uses the old dense dotted resource-like marker.
Snapshot / Recording / Macro Timeline top-level exports include compact pointsOfInterest.
Macro Timeline frame top-level keys remain unchanged.
macroSummary.poiSummary is compact and has type counts.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_7_population_evolution_macro_view.test.js
node tests/v0_10_7_1_macro_population_visual_primary.test.js
node tests/v0_10_8_initial_poi_world_anchors.test.js
```

If a listed test does not exist locally, run the closest existing tests and report the difference.

---

## Rules / Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with:

```text
V0.10.8 Initial POI World Anchors
```

Document:

```text
POIs are an independent world anchor layer.
V0.10.8 adds initial static POIs only.
The first three POIs are monument, rot_source, and spring.
Effects are intentionally strong for readability testing.
POIs modify existing public parameters only: fertility, FIELD decay pressure, MARK persistence/spread.
POIs do not add terrain, species, quests, NPCs, buildings, save/load, or multi-screen gameplay.
```

Update version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.8_INITIAL_POI_WORLD_ANCHORS
```

Update `README.md` with:

```text
V0.10.8 adds initial static POI world anchors.
POIs are visible in macro modes and exported compactly.
This is a first readability/balance experiment, not final POI design.
```

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Select Macro View.
3. Confirm three POI centers are visible.
4. Confirm POI influence halos are readable but not confused with units/routes.
5. Run 300-600 ticks.
6. Confirm monument area tends to preserve/support Human FIELD.
7. Confirm rot source area keeps visible MARK/corrosion pressure.
8. Confirm spring area tends to keep higher fertility and supports recovery.
9. Confirm route marker no longer looks like a mysterious dotted POI tile.
10. Export Recording and Macro Timeline JSON and confirm compact pointsOfInterest exists.
```

Expected result:

```text
The map should feel less like pure noise and more like a world with a few persistent anchors.
The anchors should be strong enough that the user can point at them and notice their local effect.
```

---

## Report After Changes

Report:

```text
files changed
how to run
tests run
whether core simulation rules/species/terrain enum stayed unchanged
which V0.10.8 rule section was implemented
POI placement behavior
POI effect probabilities
JSON export changes
route visual correction
known simplifications or deviations
expected visual difference
```

