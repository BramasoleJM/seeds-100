# TRI_SPECIES_WORLD_SIM_RULES.md

> Single source of truth for the first prototype of the tri-species cellular world simulation.
> This version intentionally returns to the simplest single-screen unit simulation.
> Do not implement Zelda-style multi-screen terrain propagation yet.

---

## 0. Prototype goal

Build a minimal visual simulation to test whether three species can create an interesting dynamic system through:

- movement
- terrain rewriting
- conflict
- death
- conversion
- reproduction
- terrain decay

This prototype is not testing story, tarot input, NPCs, villages, quests, combat controls, or final art.

---

## 1. World model

The world is one rectangular grid.

Current stability default:

```text
gridWidth = 40
gridHeight = 25
```

Each cell has two layers:

```text
terrain
unit
age
role
fertility
```

A cell can have terrain without a unit.  
A cell can have at most one unit.

V0.6 cell and unit data:

```text
unit: H / B / S / empty
age: number
role: normal / settler / pack / manifestation
fertility: number from 0 to 100
```

---

## 2. Terrain types

| Symbol | Name | Meaning |
|---|---|---|
| `.` | EMPTY | neutral ground |
| `F` | FIELD | human-made productive terrain |
| `W` | WILD | beast-made wild terrain |
| `M` | MARK | spirit-made marked terrain |
| `X` | BORDER | temporary conflict / stalemate terrain |
| `#` | BLOCK | fixed obstacle, never changes |

---

## 3. Unit types

| Symbol | Name |
|---|---|
| `H` | Human |
| `B` | Beast |
| `S` | Spirit |
| empty | no unit |

Units are visible in this V0 prototype.  
Terrain should be visible as background color.  
Units can be rendered as letters or simple glyphs.

---

## 4. Core species roles

### 4.1 Human `H`

Supreme behavior:

```text
Human makes FIELD.
Human survives through clustering and field support.
Human suppresses Beast through group pressure.
Human is vulnerable to Spirit and MARK pressure when isolated.
```

Direct terrain rewrite:

```text
H on EMPTY -> FIELD
H on WILD -> FIELD
H on FIELD -> FIELD
```

### 4.2 Beast `B`

Supreme behavior:

```text
Beast makes WILD.
Beast raids FIELD.
Beast suppresses Spirit through group pressure.
Beast is vulnerable to Human group pressure.
```

Direct terrain rewrite:

```text
B on EMPTY -> WILD
B on FIELD -> WILD
B on MARK -> WILD
B on WILD -> WILD
```

### 4.3 Spirit `S`

Supreme behavior:

```text
Spirit makes MARK.
Spirit converts isolated Humans.
Spirit is suppressed by Beast group pressure.
```

Direct terrain rewrite:

```text
S on EMPTY -> MARK
S on FIELD -> MARK
S on WILD -> MARK
S on MARK -> MARK
```

---

## 5. Counter cycle

The counter cycle is:

```text
Human counters Beast
Beast counters Spirit
Spirit counters Human
```

Concrete implementation:

```text
2+ Humans can remove an unsupported Beast.
2+ Beasts can remove an unsupported Spirit.
Spirit / MARK pressure can convert an unsupported Human into Spirit.
```

---

## 6. Update order per tick

Each tick must run in this order:

```text
1. Movement
2. Lifecycle / natural death
3. Conflict / death / conversion
4. Terrain rewrite by surviving units
5. Reproduction and settler / manifestation events
6. Terrain decay
7. Render and statistics update
```

Use synchronous update.

Do not let cells modified earlier in the tick affect decisions later in the same tick unless the rule explicitly says this step uses the result of the previous step.

Recommended implementation:

```text
oldWorld -> movementWorld -> lifecycleWorld -> conflictWorld -> terrainWorld -> reproductionWorld -> settlerWorld -> decayWorld
```

Only surviving units rewrite terrain in V0.2. If a Beast enters FIELD and is killed during conflict, that Beast does not rewrite FIELD to WILD.

---

## 7. Neighborhood

Use 8-neighborhood for all local counting.

For a target cell, count all adjacent cells including diagonals.

Out-of-bounds cells are ignored.

V0.3 local population helpers:

```text
h = neighboring Humans
b = neighboring Beasts
s = neighboring Spirits
f = neighboring FIELD terrains
w = neighboring WILD terrains
m = neighboring MARK terrains
emptyUnitNeighbors = neighboring cells with no unit and not BLOCK and not BORDER
localUnitCount = h + b + s
```

V0.4 frontier helpers:

```text
homeTerrainForUnit:
H -> FIELD
B -> WILD
S -> MARK

A unit is on a frontier if it has:
1. a species-specific opposing unit nearby,
2. a non-home, non-EMPTY, non-BLOCK terrain nearby,
3. or at least 2 EMPTY terrain cells nearby.
```

---

## 8. Movement rules

All units may move at most 1 cell per tick.

A unit can only move into an adjacent cell if:

```text
target has no unit
target terrain is allowed for this unit
target is not BLOCK
```

If multiple units attempt to move into the same target cell:

```text
all those moves are cancelled
all involved units stay in their original cells
```

This is the V0 collision rule.

V0.4 movement rules:

```text
Do not move into a target cell if same-species neighbors at target >= overcrowdingThreshold - 1.
```

With the default threshold 6, units avoid moving into a target that would have 5 or more same-species neighbors.

Units deep inside their own terrain may stay. Units on frontiers evaluate movement.

Interior units that would stay may scout with:

```text
scoutChance = 0.06
```

Scouting targets:

```text
Human: EMPTY, then WILD
Beast: EMPTY, then WILD
Spirit: EMPTY, then MARK
```

### 8.1 Human movement

Allowed terrain:

```text
FIELD
EMPTY
WILD
```

Forbidden terrain:

```text
MARK
BORDER
BLOCK
```

Priority:

```text
FIELD > EMPTY > WILD
```

Extra rule:

```text
Human may move into WILD only if it has at least 1 Human neighbor.
```

Staying rule:

```text
If Human is already on FIELD
and has at least 1 Human neighbor
and is not on frontier:
    Human may stay instead of moving.
```

### 8.2 Beast movement

Allowed terrain:

```text
FIELD
MARK
WILD
EMPTY
```

Forbidden terrain:

```text
BORDER
BLOCK
```

Priority:

```text
FIELD > MARK > WILD > EMPTY
```

Staying rule:

```text
If Beast is on WILD
and has at least 1 neighboring Beast
and is not on frontier:
    Beast stays.
```

### 8.3 Spirit movement

Allowed terrain:

```text
MARK
FIELD
EMPTY
WILD
```

Forbidden terrain:

```text
BORDER
BLOCK
```

Priority:

```text
cell adjacent to Human > FIELD > EMPTY > WILD > MARK
```

Spirit should prefer cells that put it near Humans.

Staying rule:

```text
If Spirit is on MARK
and has at least 1 neighboring Spirit
and is not on frontier:
    Spirit stays.
```

---

## 9. Terrain rewrite rules

After movement and conflict, each surviving unit rewrites the terrain under itself.

### Human rewrite

```text
EMPTY -> FIELD
WILD -> FIELD
FIELD -> FIELD
```

Human should not be on MARK or BORDER under valid movement rules.

### Beast rewrite

```text
EMPTY -> WILD
FIELD -> WILD
MARK -> WILD
WILD -> WILD
```

### Spirit rewrite

```text
EMPTY -> MARK
FIELD -> MARK
WILD -> MARK
MARK -> MARK
```

---

## 10. Conflict / death / conversion rules

After movement and before surviving-unit terrain rewrite, count neighbors for each unit.

Definitions:

```text
h = number of neighboring Human units
b = number of neighboring Beast units
s = number of neighboring Spirit units
m = number of neighboring MARK terrain cells
```

### 10.1 Human counters Beast

For a Beast cell:

```text
If h >= 2 and b < 2:
    Beast dies. Unit becomes empty.
```

If both sides have support:

```text
If h >= 2 and b >= 2:
    Beast disappears.
    Terrain becomes BORDER.
```

### 10.2 Beast counters Spirit

For a Spirit cell:

```text
If b >= 2 and s < 2:
    Spirit disappears.
    Terrain becomes WILD.
```

If both sides have support:

```text
If b >= 2 and s >= 2:
    Spirit disappears.
    Terrain becomes BORDER.
```

### 10.3 Spirit counters Human

For a Human cell:

```text
If s >= 1 and s + m >= 2 and h < 2:
    Human becomes Spirit.
    Terrain becomes MARK.
```

If Human has support:

```text
If s >= 1 and s + m >= 2 and h >= 2:
    Human survives.
    Terrain is unchanged until surviving-unit terrain rewrite.
```

MARK terrain can amplify active Spirit pressure, but MARK alone cannot convert or remove Humans. No BORDER is created for supported Humans under Spirit pressure.

---

## 11. Isolation death

Apply after conflict / conversion.

### Human isolation

```text
If Human has no Human neighbors
and current cell plus 8-neighborhood contains no FIELD:
    Human dies.
```

### Beast isolation

```text
If Beast has no Beast neighbors
and current cell plus 8-neighborhood contains no WILD or FIELD:
    Beast dies.
```

### Spirit isolation

```text
If Spirit has no Spirit neighbors
and current cell plus 8-neighborhood contains no MARK:
    Spirit disappears.
```

---

## 12. Lifecycle and death

Every unit ages by 1 each tick.

### Human natural death

```text
humanMaxAge = 90
humanOldAgeDeathChance = 0.20
humanBaselineDeathChance = 0.002
```

Humans younger than 8 ticks do not take baseline mortality.

### Beast natural death

```text
beastMaxAge = 65
beastOldAgeDeathChance = 0.25
beastBaselineDeathChance = 0.004
```

Beasts younger than 5 ticks do not take baseline mortality.

### Spirit manifestation duration

```text
spiritMaxAge = 45
spiritOldAgeDeathChance = 0.35
```

If a Spirit has no neighboring Human, FIELD, or MARK, it disappears regardless of age.

### Overcrowding death

Apply after isolation death.

```text
If any unit has 6 or more same-species neighbors:
    unit dies / disappears.
```

This is a life-game-like anti-overgrowth rule.

V0.3 Beast-specific overpopulation:

```text
If Beast has neighboring Beast count >= 5
and neighboring FIELD count == 0
and neighboring MARK count == 0:
    Beast dies.
```

V0.3 Spirit-specific overpopulation:

```text
If Spirit has neighboring Spirit count >= 5
and neighboring Human count == 0
and neighboring FIELD count == 0:
    Spirit disappears.
```

---

## 13. Reproduction rules

Reproduction happens after conflict and death.

Only empty-unit cells can spawn new units.

V0.3 general birth room gate:

```text
emptyUnitNeighbors >= minEmptyNeighborsForBirth
localUnitCount <= maxLocalUnitsForBirth
```

Default constants:

```text
minEmptyNeighborsForBirth = 3
maxLocalUnitsForBirth = 4
```

### 13.1 Human settlement reproduction

```text
If cell has no unit
and terrain is FIELD
and neighboring Human count is 2 or 3
and neighboring FIELD count >= 2
and neighboring Beast count == 0
and spiritPressure < 2
and localUnitCount <= 5:
    spawn Human
```

Where:

```text
spiritPressure = neighboring Spirit count + neighboring MARK terrain count
```

### 13.2 Human settler spawn

If a Human is inside a dense human field cluster:

```text
neighboring Human count >= 4
neighboring FIELD count >= 4
```

Then with:

```text
settlerSpawnChance = 0.08
```

try to create a Human with role `settler` on a nearby EMPTY edge cell, then FIELD if no EMPTY is available.

### 13.3 Beast pack reproduction

```text
If cell has no unit
and terrain is WILD
and neighboring Beast count is 2 or 3
and neighboring Human count == 0
and neighboring Spirit count <= 1
and emptyUnitNeighbors >= 3
and localUnitCount <= 4
and random chance < beastBirthChance:
    spawn Beast
```

Default:

```text
beastBirthChance = 0.12
```

### 13.4 Spirit manifestation

```text
If cell has no unit
and terrain is MARK
and neighboring Spirit count <= 1
and neighboring Beast count == 0
and neighboring Human count >= 1 or neighboring FIELD count >= 1
and random chance < spiritManifestChance:
    spawn Spirit with role manifestation
```

```text
spiritManifestChance = 0.18
```

---

## 14.5 Frontier BORDER formation

After surviving units rewrite terrain and before reproduction:

```text
If an empty-unit cell has terrain EMPTY, FIELD, WILD, or MARK
and its 8-neighborhood contains at least two different unit types
and each of those two unit types has count >= 2:
    with borderFormationChance, terrain becomes BORDER
```

Default:

```text
borderFormationChance = 0.20
```

---

## 14. Terrain decay

Apply after reproduction.

### FIELD decay

```text
If FIELD has no Human in current cell or 8-neighborhood:
    FIELD -> EMPTY
```

### WILD decay

```text
If WILD has no Beast in current cell or 8-neighborhood:
    WILD -> EMPTY
```

V0.2 makes Beast terrain require nearby Beast presence.

### MARK decay

```text
If MARK has no Spirit, no Human, and no FIELD in current cell or 8-neighborhood:
    MARK -> EMPTY
```

### BORDER decay

```text
If BORDER no longer has at least two different unit types in its 8-neighborhood:
    BORDER -> EMPTY
```

### BLOCK

```text
BLOCK never changes.
```

---

## 15. Required UI for first demo

Use simple HTML/CSS/JavaScript.

Required controls:

```text
Play / Pause
Step
Reset
Randomize
Tick speed slider
```

Optional but useful controls:

```text
initial Human count
initial Beast count
initial Spirit count
overcrowding threshold
toggle movement on/off
```

Display:

```text
single grid, current stability default 40 x 25
terrain color background
unit letter/glyph on top
statistics panel
```

Statistics:

```text
tick
Human count
Beast count
Spirit count
FIELD count
WILD count
MARK count
BORDER count
```

---

## 16. Initialization

Default initialization should create separated but nearby clusters.

Suggested default seed:

```text
Human cluster near left-center with FIELD around it.
Beast cluster near right-center with WILD around it.
Spirit cluster near bottom-center with MARK around it.
Some EMPTY space between clusters.
A few BLOCK obstacles scattered or forming small walls.
```

Randomize should create:

```text
random Humans
random Beasts
random Spirits
some random FIELD/WILD/MARK terrain near corresponding units
some EMPTY
optional sparse BLOCK
```

Avoid spawning every unit uniformly across the map without terrain context.

---

## 17. What to observe

The first demo is successful if we can visually judge:

```text
1. Humans form FIELD clusters rather than instantly dying.
2. Beasts raid and convert FIELD to WILD.
3. Spirits create MARK and threaten isolated Humans.
4. Humans suppress unsupported Beasts.
5. Beasts suppress unsupported Spirits.
6. A cyclic relationship exists; no single force always wins immediately.
7. BORDER either helps show conflict zones or is obviously unnecessary.
8. Terrain changes are readable.
```

---

## 18. What not to add yet

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
```

---

## 19. Rule-change protocol

When changing rules:

```text
1. Identify observed problem.
2. Change one major rule only.
3. Update this file.
4. Update code.
5. Run simulation.
6. Capture screenshot or JSON stats.
7. Decide keep / revert / adjust.
```

Example:

```text
Problem:
Spirit dies out too quickly.

Change:
Spirit reproduction changes from exactly 2 neighboring Spirits to 2 or 3 neighboring Spirits.

Expected effect:
Spirit clusters should survive longer without instantly flooding the map.
```

---

## 20. JSON recording diagnostics

V0.5 recording frames include event counters and anti-deadlock diagnostics:

```js
events: {
  births: { H: 0, B: 0, S: 0 },
  deaths: { H: 0, B: 0, S: 0 },
  naturalDeaths: { H: 0, B: 0, S: 0 },
  conflictDeaths: { H: 0, B: 0, S: 0 },
  conversions: { H_to_S: 0 },
  settlerSpawns: 0,
  spiritManifestations: 0
},
diagnostics: {
  birthCandidates: { H: 0, B: 0, S: 0 },
  actualBirths: { H: 0, B: 0, S: 0 },
  deathCandidates: { H: 0, B: 0, S: 0 },
  actualDeaths: { H: 0, B: 0, S: 0 },
  moveCandidates: { H: 0, B: 0, S: 0 },
  actualMoves: { H: 0, B: 0, S: 0 },
  frontierUnits: { H: 0, B: 0, S: 0 },
  borderCandidates: 0,
  actualBordersCreated: 0
}
```

These counters explain why population counts changed during each tick.

---

## 21. V0.6 fertility + migration override

V0.6 does not add terrain. There is no DEPLETED terrain and no multi-screen map.

Each cell has numeric fertility in the range 0 to 100:

```text
EMPTY initial fertility: 25-55
FIELD initial fertility: 35-65
WILD initial fertility: 65-95
MARK initial fertility: 35-75
BORDER initial fertility: 20-45
BLOCK fertility: 0
```

Fertility updates after unit actions:

```text
EMPTY drifts toward 45 by 0.2 per tick.
FIELD near Humans loses 0.35 fertility per tick.
WILD gains 0.45 fertility per tick, capped at 100.
MARK drifts toward 50 by 0.15 per tick.
BLOCK stays at 0.
Beasts restore +1.2 fertility on their cell and +0.25 on neighboring non-BLOCK cells.
```

Human V0.6 rules:

```text
Human birth requires FIELD, 2 or 3 neighboring Humans, at least 2 neighboring FIELD cells, no neighboring Beasts, spirit pressure below 2, local unit count <= 5, local support fertility >= 85, local average fertility >= 42, and random chance < 0.18.
Human low-fertility death applies when local average fertility < 32 with random chance < 0.04.
Human EMPTY -> FIELD requires Human support and local average fertility >= 40.
Human WILD -> FIELD requires at least 2 neighboring Humans and local average fertility >= 55.
Creating FIELD costs 8 fertility on that cell.
Crowded or poor-fertility Humans can become settlers with random chance < 0.08. This marks an existing Human as `settler`; it does not create a new Human.
Settlers prefer higher-fertility EMPTY/WILD/FIELD cells and avoid Beast or Spirit pressure.
Settlers found FIELD and return to `normal` only where local average fertility >= 50 and at least one neighboring Human exists.
```

Beast V0.6 rules:

```text
Beasts are wandering fertility carriers.
Beast birth requires WILD or EMPTY, 2 or 3 neighboring Beasts, no neighboring Humans, local average fertility >= 60, local unit count <= 4, and random chance < 0.06.
Beast max age is 85, old-age death chance is 0.12, and baseline death chance is 0.002.
Beast FIELD -> WILD chance is 0.55.
Beast EMPTY -> WILD chance is 0.25 only when cell fertility >= 55.
Beast MARK -> WILD chance is 0.45.
```

Spirit V0.6 rules:

```text
Spirits are short-lived manifestations.
Spirit manifestation requires an empty MARK cell, no neighboring Beasts, local average fertility >= 45, and either neighboring Human, neighboring FIELD, or abandoned FIELD nearby. Chance is < 0.10.
Spirit max age is 35, old-age death chance is 0.40, and Spirits fade when not anchored near Human, FIELD, or MARK.
Spirit FIELD -> MARK chance is 0.50.
Spirit EMPTY -> MARK chance is 0.20 only when local average fertility >= 45.
Spirit WILD -> MARK requires at least 2 neighboring Spirits.
```

### V0.6 initialization and presets

Initialization separates active units from terrain traces:

```text
Initial Spirits = active Spirit units.
Initial MARK patches = latent Spirit traces.
Initial Spirits may be 0 while MARK patches are greater than 0.
```

Editable initialization settings:

```text
Initial Humans: 0-300
Initial Beasts: 0-300
Initial Spirits: 0-200
Initial FIELD patches: 0-20
Initial WILD patches: 0-20
Initial MARK patches: 0-20
Initial BLOCK count: 0-120
Random seed: editable integer
```

Default V0.6 initialization:

```text
Initial Humans = 24
Initial Beasts = 18
Initial Spirits = 0
Initial FIELD patches = 3
Initial WILD patches = 5
Initial MARK patches = 3
Initial BLOCK count = 20
```

Initialization uses patch-based generation:

```text
FIELD patches use radius 2-4 and fertility around 40-70.
WILD patches use radius 3-6 and fertility around 65-95.
MARK patches use radius 2-4 and fertility around 35-75.
Base non-BLOCK fertility starts around 20-60.
Independent fertility hotspots may create fertile EMPTY land.
Humans start near FIELD patches when available, otherwise in small EMPTY groups.
Beasts start as sparse packs near WILD patches.
Spirits start near MARK patches only when Initial Spirits > 0.
If Initial Spirits > 0 and MARK patches = 0, tiny MARK traces are created under or near Spirits.
```

Reset / Randomize behavior:

```text
Reset restores the last generated initial state exactly.
Randomize reads current settings, writes a new random seed, generates a new initial state, and stores it.
Apply Initial Settings regenerates from the current settings and current seed, then stores it.
```

Available presets:

```text
Balanced Fertility Test
No Spirit Control
Spirit Dormant Test
Spirit Active Test
Human Migration Test
Beast Recovery Test
Empty Land Fertility Test
```

JSON exports include:

```text
initialSettings
fertility: { avg, min, max, avgByTerrain: { ".", F, W, M } }
world.fertilityRows
events.settlerDepartures
events.settlementFoundings
events.spiritManifestations
events.births / deaths / conversions
```

Observed V0.6 default 400-tick smoke run:

```text
The page runs through 400 ticks without crashing.
Human settlements can decline when FIELD fertility drops.
Beasts tend to preserve high-fertility WILD zones.
Spirits appear as short-lived phenomena and can disappear early.
```

---

## 22. V0.7 Rot-Migration Rebase

V0.7 replaces the 0-100 V0.6 fertility model with discrete land fertility levels:

```text
0 = barren
1 = poor
2 = ordinary
3 = fertile
4 = abundant
```

Rules use only these 0-4 levels.

### Fertility and FIELD

```text
FIELD is not a fixed fertility value.
FIELD inherits the underlying land fertility.
When Human creates FIELD from EMPTY or WILD, fertility usually decreases by 1.
EMPTY / WILD fertility 3-4 can attract settlers.
FIELD 2-3 supports settlement.
FIELD 1 creates migration pressure.
FIELD 0 can decay or rot.
MARK keeps its fertility, but Humans cannot directly use MARK.
```

### Death Creates MARK

```text
Human death creates MARK on the death cell.
Beast death creates MARK on the death cell.
Spirit death does not create an extra corpse overlay.
No corpse overlay is implemented.
No new terrain is implemented.
```

### Spirit Plague Wave

```text
Spirit is a short-lived wave from MARK, not a stable population.
Empty MARK with enough terrainAge can spawn Spirit.
Spirit spreads MARK outward and threatens isolated Humans.
Beasts suppress Spirit.
Spirit lifespan is short, normally around 6-10 ticks.
```

### Beast Random Walk And Cleansing

```text
Beast default behavior is random walk.
If Beast has 2+ neighboring Humans, it flees.
If MARK or Spirit is visible nearby, it moves toward the nearest rot target.
When Beast enters MARK, MARK becomes WILD and fertility increases by 1 up to 4.
Beast may restore fertility on EMPTY / WILD and may trample FIELD into WILD.
```

### Human Support / Demand And Migration

Human local condition is approximated in radius 2-3:

```text
support = FIELD fertility + half outer EMPTY/WILD fertility - MARK pressure - Spirit pressure
demand = local Human count * 2
```

Conditions:

```text
surplus: support >= demand * 1.3
balanced: support >= demand * 0.8
pressured: support >= demand * 0.5
collapse: support < demand * 0.5
```

Rules:

```text
Human birth requires surplus, FIELD fertility >= 2, 2-3 neighboring Humans, no Beast neighbors, and no Spirit neighbors.
Balanced Humans tend to stay in FIELD.
Pressed / collapsing Humans may become settler_seeking.
Settlers seek fertility 3-4 EMPTY / WILD and can found FIELD alone after minimum settler age.
Settler departure changes an existing Human role; it does not create a new Human.
```

### V0.7 Initialization Presets

```text
Balanced Rot Cycle Test
No Spirit Control
Rot Outbreak Test
Beast Cleansing Test
Human Migration Test
Empty Fertility Test
```

Initial unit counts still allow 0, 1, and larger values. Initial Spirits remain separate from MARK patches.

### V0.7 JSON Diagnostics

Recording frames include:

```text
fertility.levels: counts for 0, 1, 2, 3, 4
fertility.avgByTerrain
world.fertilityRows as 0-4 digit strings
events marksCreatedByDeath / marksCreatedBySpirit / marksCleanedByBeast
events fieldCreated / fieldDecayed / fieldTrampled
events beastRandomMoves / beastFleeMoves / beastAttractedMoves
events spiritSpawnsFromMark / spiritSpreadActions / spiritSuppressedByBeast
diagnostics humanLocalConditions / activeSettlers / avgHumanSupport / avgHumanDemand
```

---

## 23. V0.7.1 Rot Containment Combined

V0.7.1 replaces the V0.7 rot chain:

```text
Old: death -> MARK -> Spirit -> more MARK -> more Spirit
New: death -> active Spirit -> movement/death leaves MARK
```

Rules:

```text
Human death creates active Spirit directly.
Beast death creates active Spirit directly.
The death cell terrain remains unchanged until Spirit moves or dies.
Spirit movement leaves MARK on the cell it leaves.
Spirit death leaves MARK on the death cell.
MARK no longer passively spawns Spirit.
MARK is passive residue: it blocks Human founding, increases migration pressure, attracts Beasts, decays, and can be cleaned.
```

Spirit:

```text
Spirit max age is random 4-7.
Spirit does not refresh by touching another Spirit.
Spirit infection is much weaker against supported Human groups.
If infection succeeds, most cases kill Human into MARK; some convert Human to Spirit.
```

Beast:

```text
Beast default movement remains random walk.
Beast flees dense Humans.
Beast reacts to active Spirit and clustered MARK.
Beast cleaning MARK creates WILD and restores fertility.
```

Diagnostics:

```text
spiritsCreatedByDeath
spiritsCreatedByHumanDeath
spiritsCreatedByBeastDeath
spiritsCreatedByConversion
spiritKillsHumanToMark
spiritTrailMarksCreated
spiritDiedIntoMark
marksDecayed
humanNormalMoves
markCellsNearHumans
spiritCellsNearHumans
humansAdjacentToSpirit
humansAdjacentToMark
```

Deprecated counters:

```text
spiritSpawnsFromMark = 0 by default
spiritManifestations = 0 by default
```

---

## 24. V0.8 Asymmetric Ecology Rebase

V0.8 replaces symmetric three-species pressure with asymmetric ecology:

```text
Human = expansion, settlement, reproduction, migration.
Beast = persistent WILD recovery and dispersal.
Spirit = short-lived Human-failure pressure.
```

Global constraints:

```text
Do not add new terrain.
Do not add DEPLETED.
Do not add corpse overlay.
Do not return to 0-100 fertility.
Keep fertility as discrete 0-4 levels.
Keep the single-screen prototype.
Keep custom initialization controls.
```

Human rules:

```text
Supported Human settlements reproduce more strongly than in V0.7.1.
Surplus settlements with enough FIELD support can send outward settlers.
Pressured or collapsing Humans can flee as crisis settlers.
Human reproduction depends on local settlement support, fertility, neighboring Humans, low Beast pressure, and no adjacent Spirit.
Human natural death may create Spirit.
Human conflict or overcrowding death may create Spirit.
Human death that does not create Spirit creates MARK.
```

Spirit rules:

```text
Spirit mainly comes from Human death or failed Human stability.
Spirit infection is strongest against isolated Humans.
Spirit infection is weak against edge Humans.
Spirit infection is blocked by supported settlement cores.
Spirit movement and death still leave MARK.
MARK does not passively spawn Spirit by default.
```

Beast rules:

```text
Beasts do not die of old age.
Beasts default to random walk.
Beasts react only to dense Humans, active Spirit, or clustered MARK.
Dense Humans disperse Beasts instead of killing them into Spirit.
Dispersed Beasts leave WILD, restore fertility, and can clean nearby MARK / suppress nearby Spirit.
Beast dispersal never creates Spirit.
Beast reproduction is low and anti-clustered.
```

Initialization:

```text
WILD patches are more scattered.
Beast placement is more dispersed.
Initial Spirits and MARK patches remain separate controls.
Initial Human, Beast, and Spirit counts can each be 0, 1, or larger values.
```

V0.8 presets:

```text
Balanced Asymmetric Ecology Test
No Spirit Control
Human Expansion Test
Human Migration Test
Beast Dispersion Test
Spirit Outbreak Test
```

V0.8 JSON diagnostics add:

```text
humanDeathsToSpirit
humanDeathsToMark
beastDispersals
beastDispersalWildCreated
beastDispersalMarksCleaned
beastDispersalSpiritsSuppressed
prosperitySettlerDepartures
prosperitySettlerBirths
crisisSettlerDepartures
spiritBlockedByCoreSettlement
humanRetreatsFromSpirit
activeProsperitySettlers
activeCrisisSettlers
coreHumans
edgeHumans
isolatedHumans
beastNeighborStats
scatteredWildCells
largestWildClusterSize
```

Compatibility counters:

```text
spiritsCreatedByBeastDeath = 0 for normal V0.8 Beast dispersal.
spiritSpawnsFromMark = 0 by default.
spiritManifestations = 0 by default.
```

---

## 25. V0.8.2 Code Review Movement / Hunting Fix

V0.8.2 is a targeted code-review fix for the V0.8 implementation. It is not a new conceptual rebase.

Settler role consistency:

```text
All settler roles are recognized by prefix.
settler_seeking_crisis and settler_seeking_prosperity count as active seeking settlers.
settler_resting_crisis and settler_resting_prosperity count as resting settlers.
Systems must not rely on exact role names like settler_seeking only.
```

Settler movement and founding:

```text
Settler movement runs before normal Human stay-in-FIELD behavior.
Settlers can found on WILD or EMPTY with fertility >= 3, age >= 2, and no adjacent Spirit.
Founding does not require neighboring Humans.
Founding is not blocked by adjacent MARK or one nearby Beast.
Founding creates FIELD, lowers fertility by one to at least 1, and returns the settler role to normal.
Founding can seed up to two adjacent FIELD cells but does not spawn extra Humans.
```

Human / Beast movement:

```text
Humans do not universally fear Beasts.
Isolated Humans avoid Beast pressure.
Grouped Humans can move toward Beast pressure and make hunting / drive-off visible.
Existing Beast dispersal by 3+ neighboring Humans remains.
If a Beast has 2 Human neighbors and no escape cell, it can also be dispersed probabilistically.
Beast dispersal never creates Spirit.
```

Beast and WILD brake:

```text
BEAST_BIRTH_CHANCE = 0.003.
BEAST_RESTORE_CHANCE = 0.18.
BEAST_TRAMPLE_FIELD_CHANCE = 0.08.
Beast birth requires exactly 1 neighboring Beast.
Beast birth is blocked by local and radius density checks.
Beast birth has soft brakes at totalBeasts >= 50, >= 80, and stops at >= 120.
Beast can restore fertility without always converting EMPTY to WILD.
EMPTY -> WILD by Beast is rare.
Old WILD without a Beast in radius 2 can slowly decay back to EMPTY.
```

V0.8.2 JSON events add:

```text
settlerForcedExplorationMoves
settlerRestTicks
settlersLeavingRest
settlersLostRoleWithoutFounding
settlerBlockedByOccupied
settlerBlockedByNoTarget
settlerBlockedByDanger
settlerBlockedByTerrain
settlerBlockedByNoValidStep
beastBirthsBlockedByDensity
beastBirthsBlockedBySoftBrake
wildCreatedByBeast
wildDecayedToEmpty
```

V0.8.2 JSON diagnostics add:

```text
activeSettlersWithValidMove
activeSettlersWithFoundingOpportunity
activeSettlersBlocked
beastBirthEligibleCells
beastLocalDensityBlockedCells
totalBeasts
totalWild
```

---

## 26. V0.8.3 Beast Relocation / Spirit Incubation

V0.8.3 is a focused patch for V0.8.2. It is not a conceptual rebase.

Spirit incubation:

```text
SPIRIT_INCUBATION_TICKS = 3.
New Spirit is visible as S but dormant while age < 3.
Dormant Spirit does not move.
Dormant Spirit does not infect or convert Humans.
Dormant Spirit does not leave MARK trails.
Dormant Spirit creates warning / retreat pressure for Humans.
Active Spirit starts at age >= 3 and keeps the existing infection / trail behavior.
```

Human warning and death-to-Spirit:

```text
Humans adjacent to dormant Spirit can become crisis settlers.
Isolated Humans flee dormant Spirit more often than edge Humans.
Core Humans rarely flee dormant Spirit.
applyPrimaryConflict no longer directly converts Human to Spirit.
Actual Spirit infection only happens in lifecycle logic and only from active Spirit.
Human death creates Spirit less often: spirit death cause 25%, natural 5%, conflict 10%.
Non-spirit Human deaths before tick 10 cannot create Spirit.
Local Spirit density can block additional death-created Spirit.
No Spirit Control disables death-to-Spirit and H-to-S conversion.
```

Beast relocation and aura cleansing:

```text
Beast dispersal keeps the original WILD/fertility purification effect.
Dispersed Beast tries to relocate to nearby WILD / EMPTY fertility >= 3.
Beast is removed only if no relocation target exists.
Beast dispersal never creates Spirit.
Beast can cleanse adjacent Spirit or MARK without stepping onto that cell.
Dormant Spirit is easier for Beast to cleanse.
Active Spirit can be aged or removed by Beast aura cleansing.
```

V0.8.3 JSON events add:

```text
spiritWarningFlees
spiritSpawnBlockedByLocalDensity
spiritSpawnBlockedByEarlyGrace
beastRelocations
beastDispersalRemovals
beastAuraSpiritCleansed
beastAuraMarksCleaned
dormantSpiritSuppressedByBeast
activeSpiritSuppressedByBeast
```

V0.8.3 JSON diagnostics add:

```text
dormantSpirits
activeSpirits
humansAdjacentToDormantSpirit
humansAdjacentToActiveSpirit
beastsAdjacentToSpirit
beastsAdjacentToMark
```

---

## 27. V0.8.4 Readable Macro Patterns

V0.8.4 is a focused readability / pattern-shaping patch on top of the V0.8.3 ecology and V0.9 macro observer.

It does not add new terrain, resources, buildings, NPCs, quests, tarot mechanics, story events, corpse overlays, DEPLETED terrain, screen-to-screen propagation, or multi-screen maps.

Human settlement readability changes:

```text
Human birth chances are lower:
surplus = 0.18
balanced = 0.07
pressured = 0.015
collapse = 0

Human birth on FIELD still requires the existing empty FIELD, fertility, local Human, Beast, and Spirit gates.
If the birth target has fewer than 3 neighboring FIELD cells, birth chance is multiplied by 0.35.
```

Crisis migration readability changes:

```text
Low-fertility crowded FIELD can create crisis migration pressure.
If local radius 2 has Human count >= 8, FIELD count >= 6, and average FIELD fertility <= 1.5:
use crisis settler departure chance at least 0.14.
This changes an existing Human role to settler_seeking_crisis and does not spawn extra Humans.
```

WILD and Beast recovery readability changes:

```text
Unsupported WILD can still decay.
Dense fertile WILD cores decay more slowly:
WILD count radius 2 >= 5 and average WILD fertility >= 3 gives decay chance 0.003.
Other unsupported old WILD keeps decay chance 0.015.
Beast relocation mildly prefers targets near existing WILD clusters.
```

MARK and abandoned FIELD readability changes:

```text
Isolated MARK decays faster after minimum lifetime: chance 0.10.
Clustered MARK decays slower after minimum lifetime: chance 0.015.
Clustered low-fertility MARK ignores the accelerated low-fertility decay path.
FIELD with fertility 0 and no nearby Human becomes EMPTY when no MARK is nearby.
FIELD with fertility 0 and nearby MARK can become MARK.
FIELD with fertility 0 and 2+ nearby MARK has a 0.5 chance to remain FIELD for that tick.
```

Macro readability changes:

```text
migration_route becomes old_route or abandoned_route after settler movement/samples stop.
Inactive route confidence is reduced after 75 and 150 ticks.
spirit_outbreak matching is limited to centers within 6 cells.
Old Spirit outbreaks can persist as aftermath/scar evidence when clustered MARK remains.
Macro icon filtering prioritizes active Spirit warnings/outbreaks, living settlements, abandoned/scar markers, active recovery zones, frontiers, then old routes.
Close icons are filtered more aggressively unless the new icon is an active Spirit outbreak.
```

---

## 28. V0.9 Macro World Layer

V0.9 adds an observer-only macro layer on top of the existing V0.8.3 ecology and V0.8.4 readability patch.

The macro layer must not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, terrain decay, or any bottom-layer unit rule.

Macro analysis reads the current grid and recent event/diagnostic history to identify:

```text
settlement
abandoned_settlement
beast_recovery_zone
spirit_outbreak
spirit_scar
migration_route
human_beast_frontier
```

Macro analysis runs on reset, on snapshot/recording export if needed, and normally every 25 ticks during simulation.

Macro objects preserve:

```text
id
type
state
center
bounds
cells or path where relevant
size
age
firstSeenTick
lastSeenTick
confidence
displayIcon
metrics
history
```

Snapshot JSON includes:

```text
macroWorld
```

Recording JSON includes:

```text
macroWorld
macroFrames
frames[n].macro
keyframes[n].macroWorld
```

The optional macro icon overlay may display one compact marker per visible macro object. These icons are presentation only and do not create new terrain, units, resources, story events, or map screens.

V0.9 notes:

```text
Ecology rules: V0.8.3 Beast relocation and Spirit incubation.
Macro layer: V0.9 Macro World Layer.
V0.9 rejects DEPLETED terrain, corpse overlays, economy/resources/buildings/NPCs/quests/tarot/story events, and multi-screen maps.
The macro layer is a historical interpreter, not a hard script director.
```

---

## 29. V0.9.1 Macro View / Field Decay

V0.9.1 is a display and readability follow-up after V0.8.4 and V0.9.

It keeps Cell View, keeps the V0.9 macroWorld export, and does not add new terrain or final art.

FIELD absence decay:

```text
Active FIELD has a Human in radius 1 and remains visually active.
If FIELD has no Human in radius 2 and nearby MARK >= 2, it can convert to MARK with chance 0.04.
If FIELD has no Human in radius 2, fertility <= 1, and terrainAge > 20, it can decay to EMPTY with chance 0.08.
If FIELD has no Human in radius 2 and fertility == 0, it can decay to EMPTY.
Haunted FIELD near MARK is not instantly deleted.
```

Beast recovery patch:

```text
When Beast successfully cleans MARK or suppresses Spirit through dispersal, aura cleansing, or standing on MARK, it can create at most one adjacent WILD recovery cell.
Candidates are adjacent EMPTY or MARK cells with no unit and not BLOCK/BORDER.
If WILD count in radius 2 around the cleansing site is already >= 7, no extra patch is created.
MARK candidate -> WILD chance is 0.35.
EMPTY candidate -> WILD chance is 0.18.
Event counter: beastRecoveryPatchCreated.
```

Macro View:

```text
View Mode supports Cell View and Macro View.
Cell View keeps the existing detailed terrain grid.
Macro View uses display-only masks derived from the current grid and macro routes.
Macro View highlights continuous settlement, abandoned FIELD, wild recovery, spirit scar, frontier, and route cells.
Macro View fades ordinary low-level cell noise.
Macro View does not alter simulation state.
```

Macro display export:

```text
macroWorld.display.viewModes = ["cell", "macro"]
macroWorld.display.masks includes counts for settlements, abandoned, wildRecovery, spiritScars, frontiers, and routes.
```

---

## 30. V0.9.2 Influence Macro View

V0.9.2 improves Macro View without changing simulation state.

Macro View now displays influence regions instead of raw terrain fragments.

Influence helpers are display-only:

```text
boolean masks
mask dilation
connected mask components
component filtering
```

Human influence:

```text
FIELD, Human units, and cells within radius 1 of Human-on-FIELD contribute to settlement influence.
Settlement components require size >= 12 and nearby Humans >= 3.
Abandoned components require FIELD evidence, size >= 8, and nearby Humans <= 1.
Tiny FIELD fragments are muted in Macro View.
```

Beast / wild recovery influence:

```text
WILD, Beast units, cells within radius 2 of Beast, fertile EMPTY near Beast, and cells near both WILD and Beast contribute to recovery influence.
Influence is dilated by radius 1 for display continuity.
Displayed recovery components require size >= 18 and either Beast count >= 2 or WILD cells >= 6.
beast_recovery_zone macro candidates use the same influence components.
Metrics include influenceArea, wildCells, beastCount, avgFertility, nearbyField, nearbyMark, recentRecovery, and recentRelocations.
```

Spirit scar influence:

```text
MARK cells and cells within radius 1 of clustered MARK contribute to scar influence.
Scar components require MARK cells >= 5, or component size >= 10 with MARK cells >= 3.
Single MARK specks are muted in Macro View.
```

Display hierarchy:

```text
Base terrain is muted.
Influence regions are higher opacity.
Wild recovery uses stronger green.
Frontier remains an outline.
Route uses dotted/line-like display.
```

Recovery patch connection:

```text
Small Beast recovery patch candidates prefer cells adjacent to existing WILD, then MARK, then EMPTY.
The max remains one extra WILD cell per cleansing action.
```

---

## 31. V0.9.3 Macro View Stability

V0.9.3 stabilizes Macro View without changing simulation state.

Beast recovery zones use soft scoring instead of a hard average-fertility cutoff:

```text
score = wildCells * 1.2
      + beastCount * 8
      + recentRecovery * 0.12
      + beastRelocations * 0.08
      - excess nearby FIELD pressure
```

Candidate minimums:

```text
influenceArea >= 18
and at least one:
    wildCells >= 6
    beastCount >= 2
    recentRecovery > 0
score >= 16
```

States:

```text
score >= 26 -> active_recovery
score >= 16 -> quiet_habitat, wild_frontier, or beast_habitat depending on context
```

Beast recovery hysteresis:

```text
Previously seen beast_recovery_zone objects are retained for up to 100 ticks if not currently detected.
inactiveTicks <= 50 -> quiet_habitat
inactiveTicks > 50 -> fading_recovery
Retained regions lower confidence gradually and disappear after 100 unseen ticks.
```

Macro View display:

```text
Visible retained beast_recovery_zone regions are drawn into Macro View masks.
If region cells are unavailable, display may approximate from bounds or center.
macroWorld.display.masks.wildRecovery counts retained regions because they remain in macroWorld.regions.
Macro View remains display-only and never writes world cells.
```

Debug icons:

```text
The old text macro markers are now debug-only.
The UI label is Show Macro Debug Icons.
The checkbox is unchecked by default.
Colored regions, frontiers, and route masks are the primary Macro View display.
```

---

## 32. V0.10 Regional Substrate

V0.10 adds a hidden regional substrate layer to the existing single-screen world.

It does not add visible terrain types. It does not add rivers, mountains, villages, monuments, quests, economy, NPCs, save/load, or multi-screen maps.

Cell data adds:

```text
regionBias: none | basin | refuge | hollow
```

Meanings:

```text
none   = ordinary area
basin  = Settlement Basin, a soft Human / FIELD tendency
refuge = Wild Refuge, a soft Beast / WILD tendency
hollow = Scar Hollow, a soft MARK / scar tendency
```

Seeded substrate generation:

```text
The current randomSeed generates 1-3 basin blobs, 1-3 refuge blobs, and 1-2 hollow blobs.
Blobs use soft oval/circular patches with jitter so maps vary by seed.
Overlap is resolved by first-write: an existing non-none regionBias is not overwritten.
Some additional BLOCK ridges are generated with gaps to create light barriers, pockets, and passages.
The generator avoids filling the whole map and avoids single-cell noise.
```

Initialization bias:

```text
basin cells are more likely to receive FIELD / Human placement.
refuge cells are more likely to receive WILD / Beast placement.
hollow cells are more likely to receive MARK or old low-fertility FIELD traces.
Preset counts still matter; substrate only biases placement and terrain traces.
```

Lightweight ongoing effects:

```text
basin slows abandoned FIELD decay slightly and gives Human stability a very small advantage.
refuge slows WILD decay slightly, improves EMPTY fertility recovery slightly, and mildly attracts Beast relocation.
hollow slows MARK decay slightly and makes Human stability slightly worse.
hollow does not directly spawn Spirit.
MARK-only pressure remains passive; Human MARK-stress death requires nearby Spirit presence.
```

Substrate + Macro View:

```text
View modes are Cell View, Macro View, and Substrate + Macro View.
Substrate + Macro View shows basin / refuge / hollow tint beneath existing macro masks, frontiers, and routes.
The substrate view is display-only and never changes world cells.
```

Runtime intervention:

```text
A debug-only intervention selector can choose Off, H, B, or S.
Clicking a grid cell places the selected unit if the cell is in bounds and not BLOCK.
If the cell already has a unit, the selected unit replaces it.
BLOCK cells reject intervention placement.
Successful interventions are recorded in snapshot / recording metadata.
No brush, undo, redo, save/load, area painting, or full map editor is included.
```

JSON export additions:

```text
world.regionBiasRows uses compact symbols: . none, b basin, r refuge, h hollow.
regionBiasCounts includes none, basin, refuge, and hollow.
macroWorld.display.viewModes includes substrateMacro.
Snapshot and recording exports include intervention metadata.
Recording keyframes include regionBiasRows.
```

Known simplifications:

```text
Substrate blobs are approximate and use first-write overlap resolution.
BLOCK ridges are short generated barriers with gaps, not rivers or mountains.
Runtime intervention supports unit placement only.
Regional effects are intentionally small and probabilistic.
```

---

## 33. V0.10.1 Screen-Cell Regional Substrate

V0.10.1 reshapes the V0.10 substrate generator so the single 40 x 25 grid is still one playable screen, but its hidden geography is generated through larger logical screen cells.

It does not add actual multi-screen gameplay, camera transitions, screen-to-screen propagation, rivers, mountains, villages, NPCs, quests, economy, save/load, or new terrain types.

Logical layout:

```text
The world is internally divided into 4 columns x 3 rows of logical screen cells.
Each logical screen cell owns bounds inside the 40 x 25 grid.
Rows may have uneven heights because 25 does not divide evenly by 3.
Each logical screen cell has id, gridX, gridY, bounds, archetype, regionBias, and exits.
```

Exit values:

```text
open
narrow
blocked
```

Adjacent screen-cell exits must be compatible:

```text
open connects to open.
narrow connects to narrow.
blocked connects to blocked.
```

Generation:

```text
The current randomSeed generates the screen-cell layout.
The layout contains 1-3 basin-like cells, 1-3 refuge-like cells, and 1-2 hollow-like cells.
Remaining cells may be plain, choke_pass, barrier_edge, or mixed.
The layout must remain mostly traversable through open or narrow exits.
BLOCK is painted as readable borders, ridges, pockets, and choke points.
BLOCK remains the only hard geography terrain abstraction.
```

Archetypes:

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

Painting rules:

```text
Each logical screen cell fills most passable cells with its regionBias.
Logical cell borders are suggested by BLOCK segments and visible substrate-grid styling.
Exits leave openings between adjacent logical cells.
Internal BLOCK shapes are simple ridges, corners, pockets, or choke details based on archetype.
Initial terrain traces remain FIELD / WILD / MARK only.
```

Initial placement correction:

```text
Initial FIELD / Human placement uses multiple candidate centers across basin screen cells.
Initial WILD / Beast placement uses multiple candidate centers across refuge screen cells.
Initial MARK / Spirit trace placement uses multiple candidate centers across hollow screen cells.
Multiple same-bias screen cells should matter; placement must not collapse to one global bias centroid.
Preset counts still control how much terrain and how many units are placed.
```

Visual display:

```text
Substrate + Macro View shows stronger basin / refuge / hollow tint.
BLOCK must be visibly distinct from EMPTY.
Logical screen-cell boundaries are visible in Substrate + Macro View through display-only classes.
Macro masks in substrate view should not fully hide substrate tint.
```

Runtime intervention:

```text
The V0.10 Off / H / B / S intervention selector is preserved.
Clicking a non-BLOCK grid cell places or replaces the selected unit.
BLOCK cells reject intervention placement.
No brush, undo, redo, terrain painting, save/load, or full map editor is added.
```

JSON export additions:

```text
Snapshot and recording exports include regionalSubstrate.
regionalSubstrate.version = "0.10.1".
regionalSubstrate.layout.columns = 4.
regionalSubstrate.layout.rows = 3.
regionalSubstrate.layout.cells exports id, gridX, gridY, bounds, archetype, regionBias, and exits.
world.regionBiasRows and regionBiasCounts remain exported.
```

Known simplifications:

```text
The logical screen-cell grid is an internal generator scaffold, not a playable multi-screen map.
Row heights are 8, 8, and 9 cells.
Exit compatibility is exact by shared edge value.
BLOCK shapes are abstract hard barriers, not final mountain or river terrain.
```

---

## 34. V0.10.2 Terrain Readability And Occlusion

V0.10.2 is a correction pass for V0.10.1. It improves terrain readability, BLOCK-aware medium-range sensing, and screen-cell blocker silhouettes.

It does not add new terrain types, actual multi-screen gameplay, screen-to-screen propagation, camera transitions, NPCs, quests, story events, resource economy, save/load, network calls, or external libraries.

Terrain visibility:

```text
Cell View remains the detailed terrain/unit view.
Macro View keeps ecological macro regions visible, but BLOCK remains visually readable above macro masks.
Substrate + Macro View keeps substrate tint, screen-cell borders, exits, and BLOCK/passages readable.
Macro colors in substrate view are translucent or blended and must not fully hide BLOCK structure.
```

BLOCK-aware sensing:

```text
Movement still cannot enter BLOCK.
Adjacent 8-neighborhood conflict and contact checks remain direct.
Medium/long-range strategic scans with radius >= 2 should not see through unbroken BLOCK barriers.
V0.10.2 uses reachable radius flood fill, not true line-of-sight.
BLOCK and BORDER stop reachable sensing.
```

Reachable helpers:

```text
reachableCellsInRadius(source, x, y, radius)
countReachableUnitInRadius(source, x, y, unit, radius, limit)
countReachableTerrainInRadius(source, x, y, terrain, radius, limit)
findReachableNearestRot(source, x, y, radius)
```

Strategic uses:

```text
Beast rot attraction uses reachable nearest rot.
Settler long-range target search only considers reachable cells.
Settler target danger scoring uses reachable local pressure for radius-based checks where applicable.
Human medium-range hunting / danger sensing uses reachable radius when radius > 1.
```

Screen-cell terrain readability:

```text
Screen-cell archetypes paint more varied blocker silhouettes.
Ridges can jitter instead of being perfectly straight.
Cells can receive corner masses, broken edges, pockets, and carved gaps.
Exits remain deliberately open.
The generator records blocker counts per screen cell for debugging and JSON export.
Generated maps must keep enough passable cells for movement and initial placement.
```

Known simplifications:

```text
Reachability is radius-limited flood fill rather than geometric vision.
The first pass applies BLOCK-aware sensing to strategic radius decisions, not every local helper.
BLOCK remains an abstract hard barrier and not a mountain, river, or wall terrain type.
```

---

## 35. V0.10.3 Performance And Macro Throttling

V0.10.3 is a performance correction pass for V0.10.2. It changes macro analysis cadence, macro display caching, and recording payload size without changing ecology rules.

It does not add new terrain, new species, actual multi-screen gameplay, screen-to-screen propagation, story events, save/load, network calls, external libraries, or new gameplay systems.

Macro analysis cadence:

```text
Normal simulation updates macroWorld only on MACRO_ANALYSIS_INTERVAL.
Macro View and Substrate + Macro View render from the latest available macroWorld instead of forcing full macro analysis every render.
Reset and runtime intervention may force one immediate macro refresh.
Snapshot and recording export may force fresh macroWorld data before exporting.
```

Macro display caching:

```text
Macro/Substrate display masks are cached by macroWorld analysis tick and display mode.
Between macro analyses, Macro View and Substrate + Macro View may reuse the previous macro mask.
Cell View remains an exact per-tick view of the current grid.
Units and terrain still render every tick; only the macro interpretation layer may be stale.
```

Macro recent frame storage:

```text
macroRecentFrames store compact tick/count/event/diagnostic summaries by default.
macroRecentFrames do not store full terrainRows, unitRows, fertilityRows, terrainAgeRows, roles, or regionBiasRows.
Full world rows are kept for snapshot exports and recording keyframes only.
```

Recording size control:

```text
Recording frames store compact counts, fertility stats, event counters, diagnostics, interventions, and macro summary.
regionalSubstrate is exported once at recording top level instead of being repeated in every frame.
Recording keyframes keep full terrainRows, unitRows, fertilityRows, terrainAgeRows, roles, and regionBiasRows.
macroFrames remain capped.
```

Reachable sensing budget:

```text
V0.10.2 reachable radius caching is preserved.
The reachable cache resets once per source world during movement planning.
Cheap adjacent 8-neighborhood checks remain direct.
Flood-fill sensing remains reserved for medium/long-range strategic checks.
```

Macro object filtering:

```text
Beast recovery zones remain available, but very low-confidence overlapping visible regions may be filtered before display.
Visible macro icons remain capped.
Display masks avoid repainting redundant low-value recovery regions where possible.
```

Known simplifications:

```text
Macro View and Substrate + Macro View may lag the cell simulation by up to MACRO_ANALYSIS_INTERVAL ticks.
This lag applies only to macro interpretation colors/routes/frontiers, not to the Cell View grid or unit/terrain display.
```

---

## 36. V0.10.4 Regression Repair

V0.10.4 repairs regressions introduced around V0.10.3. It keeps compact recording and macro throttling, but restores performance margin, reduces overblocking, and keeps Macro/Substrate View informative.

It does not add new gameplay, new terrain, actual multi-screen gameplay, screen-to-screen propagation, map editing, brush painting, save/load, NPCs, quests, story events, resource economy, network calls, external libraries, or new species.

Safety and performance:

```text
300 simulation ticks must still pass the existing safety performance test.
Reachable radius sensing remains BLOCK-aware.
Reachable scans are cached per source world and should not be repeated unnecessarily for the same unit and radius in one movement phase.
Radius 1 local checks remain direct 8-neighborhood checks.
Settler target search uses bounded radius 6 reachable search.
Beast rot attraction first uses a cheap radius check, then performs BLOCK-aware reachable search only if rot is nearby.
```

Screen-cell geography repair:

```text
Default generated maps should prefer roughly 120-170 BLOCK cells.
Generated maps should avoid regularly exceeding 180 BLOCK cells.
The 4 x 3 layout should contain at most 3 choke_pass / barrier_edge cells combined.
At least 3 logical screen cells should be mostly open.
At least one basin and one refuge should retain spacious interiors.
BLOCK should still form readable borders, ridges, pockets, and passages, but not maze-like clutter.
```

Macro readability:

```text
Macro analysis remains interval-based and recording remains compact.
MacroWorld should not become empty or dead-feeling when settlements, recovery zones, scars, routes, or frontiers are present.
Low-confidence overlapping Beast recovery regions may be filtered, but useful recovery regions should remain visible.
Macro View and Substrate + Macro View may still lag by up to MACRO_ANALYSIS_INTERVAL ticks.
```

Beast/WILD and MARK balance:

```text
Beast recovery is preserved.
Refuge remains favorable to Beast/WILD but should not over-amplify Beast dominance.
WILD in refuge decays more slowly than ordinary WILD, but the refuge protection is milder than V0.10.3.
Hollow MARK persistence is slightly stronger so scar readability can survive Beast cleanup longer.
Spirit is not made permanent and hollow does not directly spawn Spirit.
```

Preserved V0.10.3 export behavior:

```text
macroRecentFrames remain compact.
Recording frames remain compact.
Recording keyframes keep full terrainRows, unitRows, fertilityRows, terrainAgeRows, roles, and regionBiasRows.
regionalSubstrate is exported once at recording top level.
```

Known simplifications:

```text
The BLOCK count target is a default-generation guideline, not a hard law for every custom setting.
Heavy archetype limits apply to generated screen-cell archetypes, not to user-provided or future custom maps.
Performance thresholds are protected by the existing safety test and structural V0.10.4 regression tests rather than exact browser FPS guarantees.
```

---

## 37. V0.10.5 Macro Timeline And Rule Audit

V0.10.5 separates macro display, heavy macro analysis, and exported macro history. It is an architecture and audit patch, not an ecology rebase.

It does not add new gameplay, new terrain, actual multi-screen gameplay, screen-to-screen propagation, map editing, brush painting, save/load, NPCs, quests, story events, resource economy, network calls, external libraries, or new species.

Layer separation:

```text
The simulation layer still runs H / B / S / F / W / M rules every tick.
The lightweight macro display layer refreshes cheap current-grid masks every MACRO_DISPLAY_INTERVAL.
The heavy macro analysis layer refreshes semantic macroWorld objects every MACRO_ANALYSIS_INTERVAL.
The macro timeline export samples compact visual frames every MACRO_TIMELINE_SAMPLE_INTERVAL.
```

Cadence:

```text
MACRO_ANALYSIS_INTERVAL = 25
MACRO_DISPLAY_INTERVAL = 5
MACRO_TIMELINE_SAMPLE_INTERVAL = 5
```

Smooth macro display:

```text
Macro View and Substrate + Macro View should no longer appear frozen for the full macro analysis interval.
Lightweight display frames may update from the current grid without matching stable macro ids.
Heavy macroWorld analysis must not return to every-tick execution during normal play.
Cell terrain and units still render every tick.
```

Macro timeline recording:

```text
Macro Timeline recording is separate from the existing full recording.
Macro Timeline can record while the simulation plays or while Manual Step advances ticks.
Macro Timeline frames are compact visual replay frames.
Macro Timeline analysisFrames store macroWorld snapshots at the heavy analysis cadence.
Runtime interventions are exported once in top-level timeline metadata.
```

Macro Timeline JSON:

```text
type = tri_species_macro_timeline
version = 0.1
sampleEvery = MACRO_TIMELINE_SAMPLE_INTERVAL
analysisEvery = MACRO_ANALYSIS_INTERVAL
regionalSubstrate is exported once at top level.
frames must not include full terrainRows or unitRows.
frames include counts, regionBiasCounts, maskCounts, compact maskRows, and macroSummary.
analysisFrames include macroWorld snapshots.
```

Rule audit result:

```text
V0.10.5 does not intentionally change generation or ecology constants.
V0.10.3 compact recording and macro throttling are preserved.
V0.10.4 overblocking repair, heavy archetype limits, bounded reachable sensing, refuge/WILD softening, and hollow MARK persistence are preserved as documented V0.10.4 changes.
The observed problem addressed in V0.10.5 is display/timeline architecture: heavy macro analysis was too costly every tick, but using only heavy analysis made Macro/Substrate visuals feel stale.
```

Known simplifications:

```text
Lightweight display frames are visual summaries and do not preserve stable place ids.
Routes and retained macro memories still come from the latest heavy macroWorld analysis.
The macro timeline is future-readable JSON, not a save/load format.
```

---

## 38. V0.10.6 Macro Visual Communication

V0.10.6 is a display-only visual communication pass for Macro View and Substrate + Macro View.

It does not add new gameplay, new terrain, new species, actual multi-screen gameplay, screen-to-screen propagation, map editing, brush painting, save/load, NPCs, quests, story events, resource economy, network calls, external libraries, canvas/WebGL rendering, or final art.

It does not alter movement rules, conflict rules, reproduction rules, terrain decay rules, fertility dynamics, regional substrate generation logic, macro timeline export shape, or recording export shape.

Observed problem:

```text
Macro View showed ecological influence patches but did not clearly reveal basin / refuge / hollow regional geography.
Human / Beast / Spirit material influence had hard cell edges.
EMPTY cells were visually flat, even though fertility levels already existed.
```

Layered display hierarchy:

```text
Layer 1: Regional substrate base.
basin / refuge / hollow / none are the underlying world geography.
Macro View shows this layer subtly.
Substrate + Macro View shows this layer more strongly.

Layer 2: Fertility / empty-ground modulation.
Cells receive fertility-0 through fertility-4 display classes.
Fertility shading is visual only and does not change fertility values or rules.

Layer 3: Ecological material influence.
Human FIELD / settlement influence, Beast WILD / recovery influence, and Spirit MARK / scar influence appear as translucent soft overlays.
Macro influence masks may add core / edge / fringe classes to make boundaries less binary.

Layer 4: Reading aids.
BLOCK, routes, frontiers, screen-cell boundaries, units, and optional macro icons remain readable above substrate and ecological influence.
```

Display precedence:

```text
BLOCK wins over all background styles.
Routes and frontiers remain crisp.
Ecological influence appears above substrate but does not fully erase substrate.
Substrate remains visible beneath ecological influence.
Fertility shading is subtle and should not overpower FIELD / WILD / MARK identity.
```

Known simplifications:

```text
Soft edges are implemented as grid classes, not true blur filters.
Fringe is a display-only neighboring-cell hint and never changes world cells.
Fertility shading is always on because it is subtle enough not to need a separate toggle.
```

---

## 39. V0.10.6.1 Visual Weight And Panel Usability

V0.10.6.1 is a small display/UI correction after V0.10.6.

It does not change simulation rules, grid size, the 4 x 3 screen-cell substrate layout, regional substrate generation, macro timeline JSON shape, recording JSON shape, or snapshot JSON shape.

Observed problem:

```text
V0.10.6 made regional substrate too visually dominant in Macro View.
Ecological Human / Beast / Spirit land evolution became harder to see.
The right control panel was too long for comfortable observation.
```

Visual weight correction:

```text
Macro View should primarily show evolving Human / Beast / Spirit land influence.
basin / refuge / hollow remain visible in Macro View only as quiet undertones.
Substrate + Macro View may show regional geography more clearly than Macro View.
Ecological FIELD / WILD / MARK influence remains readable in both macro modes.
BLOCK, routes, and frontiers remain crisp reading aids.
```

Panel usability:

```text
The simulation grid should be visible immediately on desktop.
The panel may scroll internally instead of pushing the whole page.
Common controls stay near the top.
Initial Settings, Recording, Macro Timeline, Legend, and Advanced / Debug controls use native collapsible details groups.
Existing element ids remain stable.
```

Future topic:

```text
Map scale and less regular region generation should be discussed separately.
That topic may affect performance, macro analysis, recording size, and UI layout.
V0.10.6.1 does not change map size or region generation.
```

---

## 40. V0.10.6.2 Macro Terrain Material Layer

V0.10.6.2 is a display-only visual structure correction after V0.10.6 and V0.10.6.1.

It does not change simulation rules, grid size, the 4 x 3 screen-cell substrate layout, regional substrate generation, movement rules, conflict rules, reproduction rules, decay rules, fertility dynamics, macro timeline JSON shape, recording JSON shape, or snapshot JSON shape.

Observed problem:

```text
Macro View still read primarily as a regional substrate map.
FIELD / WILD / MARK terrain classes existed, but Macro/Substrate backgrounds used region-base as the main visible background.
Real ecological terrain was dim or invisible unless a macro mask also classified the cell as settlement, wild recovery, or scar.
```

Terrain material layer:

```text
Macro View uses real FIELD / WILD / MARK / BORDER terrain material as the primary ecological visual layer.
FIELD, WILD, and MARK remain visible even when not part of a macro mask.
EMPTY remains mostly transparent and continues to use fertility tint plus faint substrate undertone.
BLOCK remains a dominant hard obstacle above the layered display.
```

Display hierarchy:

```text
Macro View:
1. very faint regional substrate undertone
2. real terrain material from FIELD / WILD / MARK / EMPTY / BORDER
3. macro influence enhancement from settlement / wild recovery / scar / abandoned masks
4. route / frontier / BLOCK / units / optional macro icons

Substrate + Macro View:
1. readable regional substrate and screen-cell structure
2. real terrain material, still visible enough to read ecology
3. macro influence enhancement
4. route / frontier / BLOCK / units / optional macro icons
```

Macro masks:

```text
Macro masks enhance ecological material.
They do not replace terrain visibility.
Regional substrate is a faint undertone in Macro View.
Substrate + Macro View keeps geography readable while preserving ecological terrain visibility.
```

Known simplifications:

```text
The terrain material layer is CSS-only.
It does not add blur filters, canvas rendering, new terrain, or new exported world data.
```

---

## 41. V0.10.6.3 Pale Base Macro Ecology Readability

V0.10.6.3 is a display-only Macro View readability correction after V0.10.6, V0.10.6.1, and V0.10.6.2.

It does not change simulation rules, grid size, the 4 x 3 screen-cell substrate layout, regional substrate generation, movement rules, conflict rules, reproduction rules, decay rules, fertility dynamics, macro timeline JSON shape, recording JSON shape, or snapshot JSON shape.

Observed problem:

```text
Macro View still used a dark substrate base.
FIELD / WILD / MARK material was visible but remained muddy over the dark base.
Macro fringe and transition effects made emergent settlement / wild / scar shapes feel blurred.
Regional substrate was still too noticeable for the ecology-reading mode.
```

Pale Macro View base:

```text
Macro View uses pale, close-value base colors.
region-none is a pale neutral map base.
basin, refuge, and hollow are faint warm / cool undertones, not colored territories.
FIELD / WILD / MARK become the primary area colors for ecological evolution.
```

Ecology readability:

```text
Macro View terrain material is stronger and more direct.
FIELD uses clear cultivated yellow-green.
WILD uses clear green.
MARK uses clear violet.
BORDER remains visible as conflict material.
EMPTY mostly shows pale base plus subtle fertility tint.
```

Macro recognition aids:

```text
Macro masks identify recognized settlement / wild recovery / scar / abandoned patterns.
They use crisp borders or small highlights instead of broad opaque repainting.
Macro fringe is reduced to a nearly invisible hint in Macro View so patterns do not blur into fog.
Routes, frontiers, BLOCK, units, and optional macro icons remain readable.
```

Substrate + Macro View:

```text
Substrate + Macro View keeps regional geography clearer than Macro View.
FIELD / WILD / MARK terrain material remains visible above the substrate.
Screen-cell boundaries remain visible but secondary to ecology.
```

Known simplifications:

```text
The pale base and reduced fringe are CSS-only display changes.
No simulation data, terrain type, substrate generation, or export row is added.
```

---

## 42. V0.10.6.4 Spirit Corrosion And Substrate Unit Hide

V0.10.6.4 is a display-only visual semantics pass after V0.10.6.3.

It does not change simulation rules, grid size, the 4 x 3 screen-cell substrate layout, regional substrate generation, movement rules, conflict rules, reproduction rules, decay rules, fertility dynamics, macro timeline JSON shape, recording JSON shape, or snapshot JSON shape.

Observed problem:

```text
Spirit MARK / scar still read too much like a soft purple ecological biome.
The same soft edge / fringe language used for FIELD and WILD made Spirit influence feel less abnormal.
Substrate + Macro View unit letters could distract from evaluating pure color and substrate readability.
```

Spirit corrosion display:

```text
MARK / scar uses a sharper corrosion visual language in macro modes.
Macro View MARK is a strong high-contrast purple signal with a simple crack / spot pattern.
Substrate + Macro View keeps MARK visibly purple above regional substrate.
macro-cell-scar remains readable through crisp edges and corrosion markers.
macro-fringe-scar is visually disabled or weaker than FIELD / WILD fringe.
```

Human and Beast display:

```text
FIELD and WILD may keep soft ecological transitions.
Their soft edge and fringe classes remain available for village / field / wild boundary reading.
```

Substrate + Macro unit display:

```text
Substrate + Macro View hides H / B / S unit letters as a pure color readability experiment.
Cell View keeps H / B / S letters.
The hiding is visual only; dataset.unit, unitRows, recording, snapshot, and macro timeline data are unchanged.
```

Known simplifications:

```text
The corrosion treatment is CSS-only prototype readability styling, not final art.
No new terrain, species, simulation state, or export field is added.
```

---

## 43. Version

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.10.6.4_SPIRIT_CORROSION_SUBSTRATE_UNIT_HIDE
Date: 2026-06-12
Status: V0.10.6.4 Spirit Corrosion And Substrate Unit Hide patch implemented
```

Current version split:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Influence view patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
Stability patch: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
Regional substrate: TRI_SPECIES_WORLD_SIM_V0.10_REGIONAL_SUBSTRATE
Screen-cell substrate: TRI_SPECIES_WORLD_SIM_V0.10.1_SCREEN_CELL_REGIONAL_SUBSTRATE
Terrain readability / occlusion: TRI_SPECIES_WORLD_SIM_V0.10.2_TERRAIN_READABILITY_AND_OCCLUSION
Performance / macro throttling: TRI_SPECIES_WORLD_SIM_V0.10.3_PERFORMANCE_AND_MACRO_THROTTLING
Regression repair: TRI_SPECIES_WORLD_SIM_V0.10.4_REGRESSION_REPAIR
Macro timeline / rule audit: TRI_SPECIES_WORLD_SIM_V0.10.5_MACRO_TIMELINE_AND_RULE_AUDIT
Macro visual communication: TRI_SPECIES_WORLD_SIM_V0.10.6_MACRO_VISUAL_COMMUNICATION
Visual weight / panel usability: TRI_SPECIES_WORLD_SIM_V0.10.6.1_VISUAL_WEIGHT_PANEL_USABILITY
Macro terrain material layer: TRI_SPECIES_WORLD_SIM_V0.10.6.2_MACRO_TERRAIN_MATERIAL_LAYER
Pale base macro ecology readability: TRI_SPECIES_WORLD_SIM_V0.10.6.3_PALE_BASE_MACRO_ECOLOGY_READABILITY
Spirit corrosion / substrate unit hide: TRI_SPECIES_WORLD_SIM_V0.10.6.4_SPIRIT_CORROSION_SUBSTRATE_UNIT_HIDE
```

V0.8.3 notes:

```text
V0.8.3 rejects DEPLETED terrain.
V0.8.3 keeps the single-screen prototype.
V0.8.3 uses discrete 0-4 fertility levels.
V0.8.3 makes new Spirit dormant for 3 ticks.
V0.8.3 removes direct conflict-phase Human-to-Spirit conversion.
V0.8.3 relocates dispersed Beasts when possible.
V0.8.3 lets Beasts cleanse adjacent M/S.
V0.8.3 keeps MARK passive residue that does not spawn Spirit by default.
```
