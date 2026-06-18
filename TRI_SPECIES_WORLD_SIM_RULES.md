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

## 43. V0.10.7 Population Evolution Macro View

V0.10.7 is a display-only macro readability pass after V0.10.6.4.

It does not change movement rules, lifecycle rules, conflict rules, reproduction rules, fertility dynamics, terrain decay rules, regional substrate generation, macro timeline export shape, recording export shape, or snapshot export shape.

Observed problem:

```text
Macro View showed current terrain material, but population history was still too cell-by-cell.
Human / Beast / Spirit territories could be hard to read as continuous evolving shapes.
Short-lived raw terrain changes could make the macro view flicker or lose identity between refreshes.
```

Population Evolution Macro Layer:

```text
Macro View adds observer-only population evolution shapes.
human_population_shape is derived from FIELD, Human units, H-on-FIELD support, and nearby FIELD continuity.
beast_population_shape is derived from WILD, Beast units, fertile EMPTY near Beast/WILD, and WILD continuity.
spirit_corrosion_shape is derived from MARK, Spirit units, clustered MARK, and nearby corrosion continuity.
```

Shape construction:

```text
Each population type scores cells from existing grid signals.
The score mask is lightly smoothed with 8-neighborhood closure.
Tiny isolated noise is filtered before display.
Remaining cells become connected components.
Each component is split into coreCells, bodyCells, and edgeCells.
Components match previous shapes by overlap and nearby center so ids and age persist.
If a shape disappears briefly, memoryCells retain a fading trace for a short time.
```

Shape fields:

```text
id
type: human | beast | spirit
state
age
firstSeenTick
lastSeenTick
confidence
coreCells
bodyCells
edgeCells
memoryCells
center
bounds
area
previousArea
trend: expanding | contracting | stable | fragmenting | fading
```

Display responsibilities:

```text
Macro View is now primarily a Population Evolution View.
Regional substrate remains only a very quiet undertone in Macro View.
Population shape classes are added as core / body / edge / memory overlays.
Substrate + Macro View keeps regional substrate and screen-cell geography readable while showing the same population shapes more softly.
Cell View is unchanged.
```

Display classes:

```text
population-human-core / body / edge / memory
population-beast-core / body / edge / memory
population-spirit-core / body / edge / memory
```

Compatibility:

```text
Existing macroWorld detection remains in place.
Existing macro timeline frame shape is unchanged.
Existing recording frame shape is unchanged.
The layer exposes a test/debug population evolution frame but does not add large visual rows to exports.
```

Known simplifications:

```text
Population shapes are derived from current grid evidence plus short-term display memory, not from a full historical replay.
Shape smoothing uses cheap neighborhood rules rather than image-processing libraries.
This is a foundation for later memory / point-of-interest work, but V0.10.7 does not add POIs or new world mechanics.
```

---

## 44. V0.10.7.1 Macro Population Visual Primary

V0.10.7.1 is a display-only visual hierarchy correction after V0.10.7.

It does not change movement rules, lifecycle rules, conflict rules, reproduction rules, fertility dynamics, terrain decay rules, regional substrate generation, screen-cell substrate generation, grid size, terrain types, species, recording frame required top-level fields, snapshot required fields, or macro timeline frame top-level keys.

Observed problem:

```text
V0.10.7 added population evolution shapes, but Macro View still read too much like raw terrain cells plus unit letters.
Raw FIELD / WILD / MARK material and older macro-cell recognition fills competed with the population shape layer.
Regional substrate classes added unnecessary color noise in Macro View.
Old debug icon labels were terse and hard to identify.
```

Display role split:

```text
Cell View is the low-level grid debugger.
Cell View keeps unit letters and raw terrain readability.

Macro View is the primary Population Evolution View.
Macro View hides unit letters visually.
Macro View mutes raw terrain material so population core / body / edge / memory shapes dominate.
Macro View does not attach regional substrate classes.

Substrate + Macro View is the geography + ecology comparison mode.
Substrate + Macro View keeps regional substrate and screen-cell geography readable.
Substrate + Macro View shows population shapes more softly than Macro View.
```

Macro View visual hierarchy:

```text
1. BLOCK / route / frontier crisp aids.
2. population core / body / edge / memory shapes.
3. muted real terrain material.
4. pale empty / fertility base.
5. no regional substrate class, or only near-invisible undertone if needed later.
```

Old macro-cell recognition classes:

```text
macro-cell-settlement
macro-cell-wild
macro-cell-scar
macro-cell-abandoned
macro-fringe-*
```

These remain available for analysis, debug support, and compact mask export. In Macro View they are demoted to thin outlines, small markers, or near-transparent hints so they do not duplicate broad population fills.

Macro timeline summary:

```text
macroSummary.populationEvolution may include compact shape summaries:
human / beast / spirit shapes
activeArea
memoryArea
dominantId
trend
```

The macro timeline frame top-level keys remain:

```text
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary
```

Debug icons:

```text
Macro debug icons remain optional and disabled by default.
Labels use clearer short text such as H+, H old, W range, S scar, S wave, route, and edge.
Normal Macro View readability must not depend on debug icons.
```

Known simplifications:

```text
This is CSS and display-class composition, not final art.
Population visual dominance is enforced through layer order and opacity, not a canvas renderer.
Old macro-cell masks are demoted visually but not deleted.
```

---

## 45. V0.10.8 Initial POI World Anchors

V0.10.8 adds the first independent Point-of-Interest layer:

```text
Initial static POI world anchors.
```

It does not change grid size, terrain enum, unit enum, movement rules, lifecycle rules, conflict rules, reproduction rules, terrain decay rules, regional substrate generation, screen-cell substrate layout, view mode options, existing control ids, macro timeline frame top-level keys, or recording frame required keys.

Scope:

```text
V0.10.8 implements only initially existing static world anchors.
It does not implement runtime-created POIs, quests, dialogue, buildings, NPCs, resource economy, save/load, map editing, new terrain, new species, screen-to-screen propagation, or multi-screen gameplay.
```

POI layer:

```text
POIs are independent world anchors.
They do not occupy terrain.
They do not occupy unit.
They are stored as a compact pointsOfInterest list.
```

POI object:

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

Initial POIs:

```text
Exactly one monument.
Exactly one rot_source.
Exactly one spring.

All use radius = 4, strength = strong, state = active, createdAtTick = 0.
Centers must not be BLOCK.
Centers should be at least 5 cells apart when possible.
Placement is deterministic under the existing random seed flow.
```

Placement preference:

```text
monument prefers basin / initial Human-FIELD area.
rot_source prefers hollow / MARK area.
spring prefers refuge or ordinary EMPTY/WILD area away from rot_source.
Fallback placement uses valid non-BLOCK cells.
```

POI update order:

```text
movement
lifecycle / conflict / terrain rewrite / reproduction
fertility dynamics
POI effects
terrain decay
render / stats / recording
```

Strong first-pass effects:

```text
monument:
Within radius 4, FIELD decay chance multiplier = 0.5.
Within radius 4, haunted FIELD to MARK chance multiplier = 0.5.
Within radius 4, FIELD and EMPTY each tick have 12% chance to gain +1 fertility, capped at 3.
Monument does not directly spawn Humans or create FIELD.

rot_source:
Center cell remains MARK unless it is BLOCK.
Within radius 1, non-BLOCK / non-BORDER cells have 30% chance per tick to become or remain MARK.
Within radius 4, MARK passive decay chance multiplier = 0.5.
Within radius 4, non-BLOCK / non-BORDER cells have 10% chance per tick to lose -1 fertility.
Rot source does not directly spawn Spirits.

spring:
Within radius 4, non-BLOCK / non-MARK cells have 18% chance per tick to gain +1 fertility, capped at 4.
Spring does not directly change terrain and does not suppress Spirit or MARK by itself.
```

Display:

```text
POIs are visible in Macro View and Substrate + Macro View.
POI center cells use poi-center plus a type class.
POI radius cells use poi-influence plus a type class.

Display classes:
poi-influence
poi-center
poi-monument
poi-rot-source
poi-spring
```

Route visual correction:

```text
Routes are thin route aids.
Routes must not use dense dotted resource-like cell markers.
Routes remain secondary to population shapes and POIs.
```

Exports:

```text
Snapshot export includes top-level pointsOfInterest.
Recording export includes top-level pointsOfInterest.
Macro Timeline export includes top-level pointsOfInterest.
Macro Timeline frame top-level keys remain unchanged.
macroSummary.poiSummary includes compact POI counts.
```

Known simplifications:

```text
V0.10.8 uses three fixed initial POI types only.
POIs are not a general entity framework.
POI effects are intentionally strong for readability and balance testing.
No POI construction, cleansing, unlocking, opening, dialogue, quest, or resource behavior is implemented.
```

---

## 46. V0.10.8.1 POI Ecology Anchor Rebalance

V0.10.8.1 is a focused correction after the first POI pass.

Observed problem:

```text
Spring behaved too much like a hidden Human/FIELD accelerator.
Beast/WILD did not have its own major world anchor.
Rot source could be visually hidden by Human / Beast / Spirit interaction colors.
```

Scope:

```text
POIs remain initially existing static world anchors only.
No runtime POI creation, quest, NPC, dialogue, resource economy, save/load, new terrain, new species, or multi-screen map is added.
```

Initial POIs:

```text
V0.10.8.1 creates exactly four POIs:
monument
great_forest
rot_source
spring
```

Great Forest object:

```js
{
  id: "poi_great_forest_004",
  type: "great_forest",
  x: number,
  y: number,
  radius: 5,
  coreRadius: 2,
  strength: "strong",
  state: "active",
  createdAtTick: 0
}
```

Spring rebalance:

```text
Spring is a neutral fertility amplifier, not a Human/FIELD POI.
Spring does not create FIELD, protect FIELD decay, spawn Humans, or cleanse MARK.
Within radius 4, non-BLOCK / non-BORDER / non-MARK cells may gain +1 fertility with chance about 18%.
WILD or EMPTY cells near WILD/Beast may recover up to fertility 4.
FIELD cells recover only up to fertility 3.
Plain EMPTY with no nearby WILD/Beast/Human support recovers only up to fertility 3.
```

Great Forest:

```text
Great Forest is the Beast/WILD habitat and origin anchor.
It prefers refuge / large WILD / Beast areas and avoids other POIs when possible.

Within radius 5:
- WILD decay chance is multiplied by about 0.35.
- Beast isolation death pressure is reduced.
- WILD / EMPTY fertility can recover toward 4 with chance about 12%.
- A small Beast anchor spawn chance about 4% may create Beast on eligible WILD/EMPTY cells under density and total-count gates.

Within coreRadius 2:
- WILD is strongly preserved.
- Ordinary Human WILD -> FIELD rewrite is blocked.
- FIELD without strong nearby Human support can tend back toward WILD.
```

Great Forest is not a wall:

```text
Humans may enter.
Supported Humans may survive.
Humans cannot permanently domesticate the core through ordinary terrain rewrite alone.
```

Rot Source redesign:

```text
The rot source has a persistent MARK core, a strong inner ring, and a contested outer ring.

Center:
- remains MARK unless BLOCK.
- visually reads as rot source above population colors.

Radius 1:
- strongly keeps or recreates MARK.

Radius 2-3:
- applies FIELD-to-MARK pressure.
- slows MARK decay.
- lowers fertility.

Radius 4:
- mostly fertility decline and scar memory.
- does not turn every cell purple instantly.
```

Display classes:

```text
poi-great-forest
poi-great-forest-core
poi-rot-core
poi-rot-inner
poi-rot-outer
poi-contested-human
poi-contested-beast
poi-contested-spirit
```

Exports:

```text
Snapshot, Recording, and Macro Timeline top-level pointsOfInterest include four POIs.
Macro Timeline frame top-level keys remain unchanged.
macroSummary.poiSummary is compact and includes total 4 plus one count per POI type.
```

Known simplifications:

```text
Great Forest Beast appearance is a small habitat-anchor spawn, not a broad population system.
Rot source contest classes are display-only.
No per-frame POI influence rows are exported.
```

---

## 47. V0.10.8.2 POI Blocking And Visual Priority

V0.10.8.2 is a focused semantics and readability correction after V0.10.8.1.

Observed problem:

```text
BLOCK walls could receive POI color overlays.
Great Forest visuals mixed circular influence markers with square/core outlines.
Spring center needed to behave like an unreachable source while keeping surrounding fertility effects.
Rot Source needed stronger source identity above population and contest colors.
```

Semantic hierarchy:

```text
1. BLOCK is hard geography and visually dominant.
2. Spring center is a POI hard blocker, not a terrain type.
3. POI centers are world anchors, not ordinary influence cells.
4. POI influence rings may tint ecology but must not erase hard geography or source identity.
5. Population evolution colors remain readable outside POI centers and cores.
```

BLOCK display:

```text
BLOCK cells do not receive POI influence classes.
BLOCK cells do not receive POI center classes.
BLOCK cells do not receive rot contest, rot ring, or great forest core classes.
BLOCK visual style remains dominant in Macro View and Substrate + Macro View.
```

Spring center blocking:

```text
Spring center is water/source-like and cannot be entered or occupied.
Spring center does not become BLOCK terrain.
Movement, runtime intervention placement, reachable radius sensing, and settler/scout movement gates treat an active spring center as blocked.
Spring surrounding cells keep the V0.10.8.1 fertility recovery halo.
```

POI data:

```text
Spring POI may include compact metadata:
blocksMovement: true
```

Visual priority:

```text
Spring center uses a consistent blue/cyan source marker.
Great Forest uses one coherent dense-canopy habitat language: deep green center/core and subtle non-icon outer influence.
Rot Source center and inner ring visually win over terrain, population colors, macro masks, and contest hints.
Rot Source outer ring may still show Human / Beast / Spirit contest colors.
```

Scope:

```text
The four initial POIs remain unchanged.
No new terrain, species, view mode, runtime POI creation, quest, NPC, dialogue, save/load, resource economy, or multi-screen map is added.
Macro Timeline frame top-level keys remain unchanged.
```

---

## 48. V0.10.8.3 Rot Source Inner Ring Hardening

V0.10.8.3 is a small Rot Source correction after V0.10.8.2.

Observed problem:

```text
Rot Source center was stable, but radius 1 could still read visually and ecologically as WILD / Beast contest or FIELD / Human contest instead of persistent corruption.
```

Rot Source behavior:

```text
Center and radius 1 are persistent corruption.
For the center and cells with distance <= 1 from the rot_source:
- if terrain is not BLOCK and not BORDER, terrain becomes MARK.
- terrainAge resets to 0.
- any active unit on the cell remains present; normal movement, conflict, survival, and later rules handle consequences.
```

Outer Rot Source behavior:

```text
Radius 2-3 keeps FIELD-to-MARK pressure and fertility loss.
Radius 4 keeps softer fertility decline / scar memory.
The full radius 4 is not forced to solid MARK.
```

Display:

```text
Rot Source center and radius 1 may use display-only poi-rot-hardened.
poi-rot-core is the strongest center signal.
poi-rot-inner remains visibly purple/corrupt even if contested by Human/FIELD or Beast/WILD.
poi-rot-outer remains lighter and may show ecological contest.
```

Scope:

```text
This patch does not change spring, great forest, monument, terrain enum, unit enum, grid size, view modes, control ids, macro timeline frame top-level keys, recording frame required keys, quests, NPCs, save/load, or multi-screen gameplay.
```

---

## 49. V0.10.9 Macro Memory Slow Trace

V0.10.9 adds the first observer-only macro memory / slow trace layer.

It does not change terrain types, unit types, grid size, movement rules, lifecycle rules, conflict rules, reproduction rules, fertility rules, terrain decay rules, view mode options, existing control ids, the four initial POIs, spring blocking behavior, core counter-cycle rules, macro timeline frame top-level keys, or recording frame required keys.

Observed problem:

```text
Longer runs can accumulate fast local noise.
Small cell fragments can change too quickly to summarize.
Macro View needs a slow historical substrate that asks what an area has repeatedly been recently, not only what it is this tick.
```

Macro memory state:

```js
macroMemory = {
  version: "0.10.9",
  tick,
  updatedEvery: MACRO_DISPLAY_INTERVAL,
  traces: {
    human: number[][],
    beast: number[][],
    rot: number[][],
    fertility: number[][],
    conflict: number[][]
  },
  poiStates: []
}
```

Trace semantics:

```text
humanTrace records repeated Human / FIELD / Human population-shape presence.
beastTrace records repeated Beast / WILD / Beast population-shape presence.
rotTrace records repeated MARK / Spirit / rot_source / Spirit population-shape presence.
fertilityTrace records repeated high-fertility, spring-supported, or recovery areas.
conflictTrace records repeated BORDER / frontier / Human-Beast overlap / contested POI ring.
```

Accumulation:

```text
Macro memory updates on MACRO_DISPLAY_INTERVAL, or when explicitly forced for exports/tests.
Each update applies exponential decay to old values and adds small gains from current terrain, units, population shapes, POIs, fertility, and conflict evidence.
Trace values are clamped between 0.0 and 1.0.
Short-lived one-frame signals stay below the visible threshold.
Repeated signals become faint memory, then strong memory.
```

Display:

```text
Macro memory is secondary to current population shapes and POI centers.
Memory classes are display-only:
memory-human-faint / memory-human-strong
memory-beast-faint / memory-beast-strong
memory-rot-faint / memory-rot-strong
memory-fertile-faint / memory-fertile-strong
memory-conflict-faint / memory-conflict-strong

Memory classes are not applied to BLOCK.
Memory must not hide spring center, rot_source core, or great_forest core.
Cell View remains unchanged.
```

POI state labels:

```text
POI state labels are compact deterministic labels derived from local current evidence plus macro memory traces.

monument: prosperous | pressured | haunted | fallen
great_forest: flourishing | guarded | contested | shrinking
rot_source: dominant | spreading | contested | contained
spring: wild_fed | field_fed | neutral | corrupted
```

Exports:

```text
Macro Timeline frames keep the same top-level keys:
tick
counts
regionBiasCounts
maskCounts
maskRows
macroSummary

macroSummary.macroMemory contains only compact counts:
strongest
activeCells
strongCells

macroSummary.poiStates contains compact rounded local trace values and labels.
Recording export includes top-level macroMemorySummary.
Full trace arrays are not exported per timeline frame or recording frame.
```

Known simplifications:

```text
Macro memory uses cheap grid arrays and exponential decay, not a replay system.
POI state labels are diagnostic labels, not story events, quests, dialogue, or named lore.
This layer is for readability and later analysis only.
```

---

## 50. V0.10.9.1 Macro Memory Tuning

V0.10.9.1 is a focused tuning pass after V0.10.9.

It does not add terrain types, unit types, dynamic POIs, lineage, individual genealogy, quests, NPCs, save/load, external libraries, multi-screen gameplay, or a replay system. It does not change grid size, view modes, existing control ids, the four initial POIs, spring blocking, great_forest behavior, rot_source inner ring behavior, core counter-cycle rules, macro timeline frame top-level keys, or recording frame required keys.

Observed problem:

```text
The V0.10.9 memory mechanism worked, but late runs could over-saturate.
Human memory and conflict memory could cover too much of the map.
Strong memory became common enough to risk becoming another visual noise layer.
Some POI state labels fired too early.
```

Tuning:

```text
Macro memory remains observer-only.
Trace gains are lower.
Decay is slightly faster.
The visible faint threshold is slightly higher.
The strong threshold is much higher.
Memory should remain slow and selective, with strong memory meaningfully smaller than active memory.
```

Conflict tightening:

```text
Strong conflict memory comes from current evidence:
- BORDER terrain
- explicit frontier cells
- current local Human + Beast adjacency / pressure
- contested POI rings with current Human/FIELD or Beast/WILD evidence

Historical humanTrace + beastTrace overlap alone does not repeatedly add full conflict gain.
Historical overlap may at most display a faint hint when real conflictTrace is already near the faint threshold.
```

POI state labels:

```text
POI labels use a warmup period.
Before enough local memory has accumulated:
- monument: forming
- great_forest: forming
- rot_source: forming
- spring: neutral

rot_source prefers contested over dominant when conflict pressure is high.
spring uses corrupted only for clearly sustained rot memory.
monument uses haunted only for sustained rot memory.
great_forest uses flourishing only when Beast/WILD memory is high and conflict is low.
```

Exports:

```text
Macro Timeline frame top-level keys remain unchanged.
macroSummary.macroMemory and macroSummary.poiStates remain present.
recording.macroMemorySummary remains present.
macroSummary.macroMemory may include compact nonBlockCells and coverage percentages.
Full trace arrays are not exported.
```

Future direction:

```text
This patch prepares macro memory for a later Human lineage prototype.
It does not implement lineage.
```

---

---

## 51. V0.11 Human Lineage Memory Prototype

V0.11 adds the first population-perspective memory system.

It does not add terrain types, unit types, Beast lineage, Spirit lineage, individual genealogy, lore names, NPCs, quests, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, POI, decay, or core counter-cycle rules.

Observed problem:

```text
Population evolution shapes show current Human settlements clearly, and macro memory shows slow historical traces, but the map does not yet expose whether a current Human settlement is a continuation or likely descendant of an older Human settlement.
```

Human lineage memory:

```text
humanLineageMemory is observer-only.
It reads current Human population shapes from populationEvolutionFrame.
It matches Human settlement-scale shapes across macro display updates.
It stores compact lineage records with origin, centroid, recent centroid path, area history, current active cells, old memory cells, descendants, and recent events.
```

Lineage matching:

```text
Same lineage:
- current Human shape overlaps the previous active cells,
- or stays near the previous centroid,
- or overlaps recent lineage memory cells.

Descendant:
- a new Human shape appears near a declined/collapsed lineage's old centroid path or memory cells.

New lineage:
- no existing lineage or collapsed lineage has enough spatial continuity.
```

Lineage states:

```text
forming
expanding
stable
migrating
declining
collapsed
descendant
```

The lineage tracker uses a short grace window so one missing macro frame produces `declining` before `collapsed`.

Events:

```text
founded
expanded
migrated
declined
collapsed
descended_from
reappeared
```

Events are emitted only for meaningful state changes.

Visualization:

```text
Show Human Lineage is an optional overlay, off by default.
It shows the dominant/current Human lineage only.

Visual classes:
lineage-human-origin
lineage-human-current
lineage-human-path
lineage-human-memory
lineage-human-descendant-link
```

Visual priority:

```text
current active Human population shape
selected Human lineage origin/current/path
selected Human lineage old memory cells
ordinary macro memory
regional substrate
```

Exports:

```text
Snapshot and Recording exports include top-level humanLineageMemorySummary.
Macro Timeline frame top-level keys remain unchanged.
macroSummary.humanLineage contains compact lineage counts, dominant id, and recent events.
Full lineage trace grids are not exported.
Lineage cell lists are capped in internal/test memory and omitted from compact summaries.
```

Known simplifications:

```text
Lineage is based on macro Human shapes, not individual Human units.
Descendant detection is heuristic spatial continuity, not biological genealogy.
Only Human lineage exists in V0.11.
Lineage is selective and displays only the dominant lineage to avoid visual noise.
```

---

## 52. V0.11.1 Human Lineage Visibility Pass

V0.11.1 is a focused visibility and usability pass for Human Lineage Memory.

It does not add terrain types, unit types, Beast lineage, Spirit lineage, individual genealogy, lore names, NPCs, quests, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, POI, decay, or core counter-cycle rules.

Observed problem:

```text
V0.11 lineage data existed, but the control was hidden in Advanced / Debug, the overlay was too faint, and there was no compact UI readout proving that lineage memory was active.
```

Visibility changes:

```text
Show Human Lineage is visible near View Mode and defaults on for easier evaluation.
Human Lineage status shows compact counts:
Lineages
Active
Collapsed
Descendants
Dominant
Recent Event
```

Visual tuning:

```text
lineage-human-origin is a clear warm origin marker.
lineage-human-current is a brighter current centroid marker.
lineage-human-path is a readable gold route hint.
lineage-human-memory is a soft but visible old settlement trace.
lineage-human-descendant-link is stronger than ordinary path memory.
```

Visual priority remains:

```text
POI core / blocked cells
current active population shapes
selected Human lineage origin/current/path
selected Human lineage memory
ordinary macro memory
regional substrate
```

Known simplifications:

```text
V0.11.1 changes visibility/usability only.
Human lineage remains observer-only.
The overlay still shows one selected/dominant lineage by default.
Descendant detection remains heuristic and macro-shape based.
```

---

## 53. V0.11.2 Semantic Macro Tags

V0.11.2 adds sparse semantic tags for Macro View.

It does not add terrain types, unit types, Beast lineage, Spirit lineage, individual genealogy, lore names, NPCs, quests, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, POI, decay, lineage matching, or core counter-cycle rules.

Observed problem:

```text
Color patches and lineage marks were readable only after careful inspection.
Old Macro Debug Icons used macroWorld.visibleIcons, which could drift away from the newer population shape / memory / POI visual layers.
```

Semantic tag sources:

```text
populationEvolutionFrame.shapes
humanLineageMemory
worldPOIs
macroMemory.poiStates where useful later
```

Visible tags:

```text
H core
B range
S scar
H origin
H now
H path
H old
H descendant
Monument
Rot Source
Spring
Great Forest
```

Placement:

```text
Population tags use representative visible shape cells:
core first, then body, then edge, then valid rounded centroid.

Lineage tags use active cells, memory cells, origin/current/path points, and descendant relation.

POI tags use POI centers.
Tags are skipped on invalid/BLOCK cells unless the tag is explicitly for a POI center.
```

Export:

```text
Macro Timeline frame top-level keys remain unchanged.
macroSummary.semanticTags may contain a compact capped list:
type
label
x
y
source
sourceId
category
```

Known simplifications:

```text
V0.11.2 is a visual/semantic overlay pass.
Tags are observer-only and do not affect simulation.
Tags are sparse and selective, not a full annotation of every region.
Human lineage tags show the selected/dominant lineage only.
Tag placement uses representative cells rather than raw centroid placement.
```

---

## 54. V0.11.3 Human Seat / Domain Anchors

V0.11.3 adds Human domain and Human seat interpretation for lineage readability.

It does not add terrain types, unit types, buildings, villages, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, POI, decay, or core counter-cycle rules.

Concepts:

```text
H domain = current Human macro population shape / FIELD-supported area.
H seat = stable observer-only center inside a Human domain.
H old seat = abandoned previous Human seat.
```

Seat establishment:

```text
Minimum domain area: 20 cells.
Minimum confidence: 0.55.
Candidate must be inside core/body/active Human shape cells.
Candidate must have Human/FIELD support above local MARK/Spirit pressure.
Candidate must remain near the same place for 3 macro samples.
```

Seat stability:

```text
Established seat stays fixed while still inside or near the Human domain.
Seat does not move every macro frame.
Seat enters warning after 2 unsupported macro samples.
Seat is abandoned after 5 unsupported macro samples, or when lineage collapse persists.
```

Seat abandonment records:

```text
seat_abandoned

Reasons:
lost_domain
rot_pressure
low_support
lineage_collapsed
```

Seat relocation:

```text
Old seats are retained in seatHistory.
New stable candidates become currentSeat only after the stability window.
Events may include:
seat_established
seat_relocated
```

Semantic tag changes:

```text
H core is retired as the primary Human tag.
H domain marks the Human range.
H seat marks the stable current center.
H old seat marks abandoned centers.
H path prefers origin / old seat / current seat anchors over raw centroid points.
```

Exports:

```text
humanLineageMemorySummary includes compact currentSeat, oldSeatCount, currentSeatCount, oldSeatCount, and recentSeatEvents.
macroSummary.humanLineage includes the same compact seat/domain fields.
macroSummary.semanticTags may include H domain, H seat, H old seat, H path, and existing POI/species tags.
No full domain cell grids are exported in timeline frames.
```

Known simplifications:

```text
Human seat is observer-only, not a building.
Human domain is derived from macro population shapes, not a new terrain layer.
Seat establishment and abandonment are heuristic.
Only Human seats are implemented in V0.11.3.
Seat-to-seat continuity is preferred over raw centroid paths.
```

---

## 55. V0.11.4 Semantic Tag Declutter

V0.11.4 reduces default visible semantic tags and adds deterministic collision suppression.

It does not add terrain types, unit types, buildings, villages, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, POI, decay, lineage matching, seat establishment, or core counter-cycle rules.

Default visible tags:

```text
H seat
H old seat
H domain
Monument
Rot Source
Spring
Great Forest
B range
S scar
```

Hidden by default:

```text
H now
H origin
H path
H old
H descendant
```

Hidden tags do not mean the underlying lineage data was removed.

Priority:

```text
H seat
Rot Source
Spring
Great Forest
Monument
H old seat
H domain
S scar
B range
```

Collision handling:

```text
Same-cell collisions always suppress lower-priority tags.
Near-cell collisions within 1.25 cells suppress lower-priority tags unless both are major POI tags.
Tags are suppressed deterministically, not randomly offset.
```

Caps:

```text
H domain: max 1-2 visible tags.
H old seat: max 1-2 visible tags.
B range: max 1 visible tag.
S scar: max 1 visible tag.
semanticTags: max 24 visible tags.
```

Export:

```text
macroSummary.semanticTags now represents decluttered visible map tags.
It is not a list of every possible semantic annotation.
```

Known simplifications:

```text
V0.11.4 hides low-value lineage helper tags by default.
Hidden tags remain available through lineage data, events, and summaries.
Semantic tag output now represents visible map tags.
Collision handling suppresses lower-priority tags rather than offsetting them.
```

---

## 56. V0.11.5 Human Outpost / Seat Promotion

V0.11.5 hardens Human seat interpretation and adds observer-only Human outposts.

It does not add terrain types, unit types, buildings, villages, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, terrain rewrite, reproduction, fertility, POI effects, decay, or core counter-cycle rules.

Observed problem:

```text
Seats could briefly appear on MARK / corruption.
Far Human regions could become seats too suddenly.
Visible old seats could feel like unrelated side branches.
```

Seat hard constraints:

```text
H seat must be on FIELD.
H seat must not be on MARK, BORDER, BLOCK, a hard POI blocker, or the rot-source inner ring.
If an active seat cell becomes MARK, it warns immediately.
If MARK persists on the active seat for 2 macro samples, the seat is abandoned with rot_pressure.
```

H outpost:

```text
H outpost is a distant Human domain label / memory anchor.
It is observer-only and is not a building or new terrain.
Far Human domains become forming / active / fading / promotable outposts before any seat promotion.
Outposts require medium Human shape area, confidence, distance from current seat, and FIELD/Human support.
High MARK / Spirit pressure may still be recorded diagnostically, but blocks promotion.
```

Outpost promotion:

```text
An outpost can promote to H seat only after sustained stability, larger area, higher confidence, strong support, low pressure, and no valid current seat.
Far Human shapes should not directly replace an existing H seat.
```

Semantic tags:

```text
Default visible tags include H outpost.
H outpost is capped to 2 visible tags.
H old seat tags come from the dominant Human mainline / ancestor chain, not unrelated side branches.
Hidden helper tags such as H now, H origin, H path, and H descendant remain hidden by default.
```

Exports:

```text
humanLineageMemorySummary includes compact outposts, activeOutposts, promotableOutposts, and recentOutpostEvents.
Macro Timeline frames keep the same top-level keys and include the same compact outpost summary under macroSummary.humanLineage.
Full outpost cell arrays are not exported.
```

Known simplifications:

```text
H outpost is observer-only.
Outpost promotion is heuristic, not a full colonization system.
Only Human outposts are implemented.
Seat corruption checks are stricter than ordinary Human domain checks.
Visible old seats are filtered to mainline continuity.
```

---

## 57. V0.11.6 Human Polity / Village Layer

V0.11.6 adds observer-only Human polity and village interpretation.

It does not add terrain types, unit types, buildings, villages as gameplay objects, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, terrain decay, or counter-cycle rules.

Concepts:

```text
Human polity = observer-only Human group identity for seats, old seats, outposts, and villages.
H village = short-lived local settlement marker inside a Human domain / polity.
H pressured seat = seat label when a Human seat survives under strong MARK / Spirit pressure.
```

Polity behavior:

```text
A root Human lineage with a valid seat creates or joins a Human polity.
A lineage can inherit a parent / ancestor polity when continuity is clear.
A mature far outpost can become a split polity when another active polity seat remains alive.
If a polity loses its seat but retains villages or outposts, it becomes seatless / declining before collapse.
```

Village behavior:

```text
Villages are regenerated from current Human macro shapes.
Village cells must be FIELD and must not be MARK, BORDER, BLOCK, a hard POI blocker, or the rot-source inner ring.
Villages avoid current seats and avoid crowding each other.
Villages are capped and fade quickly if the supporting domain disappears.
Villages know their polityId and lineageId when available.
```

Seat pressure:

```text
Seat pressure is derived from existing seat support / pressure diagnostics.
Seats with sustained nearby MARK / Spirit pressure can display as H pressured seat.
MARK directly on the seat still follows V0.11.5 quick warning / abandonment.
```

Semantic tags:

```text
Default visible tags may include H pressured seat and H village.
H village is capped to keep tags sparse.
Polity ids are kept in status/export rather than printed directly on the map.
Hidden helper lineage tags remain hidden by default.
```

Exports:

```text
Snapshot and Recording include compact humanPolitySummary.
Macro Timeline frames keep the same top-level keys and include macroSummary.humanPolity.
Full village/domain cell arrays are not exported.
```

Known simplifications:

```text
Human polity is observer-only, not an AI faction system.
Villages are macro markers, not buildings.
Villages do not inherit memory.
Polity split / inheritance is heuristic.
Only Human polity / village interpretation exists in V0.11.6.
```

---

## 58. V0.11.7 Polity Visual Identity

V0.11.7 adds visual and exported identity fields for Human polity semantic tags.

It does not add terrain types, unit types, actual buildings, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, terrain decay, or core counter-cycle rules.

Semantic tag data:

```text
Human semantic tags may include:
polityId
polityState
polityColorIndex
lineageId
state
support
pressure
splitFromPolityId
title
```

Coverage:

```text
H seat and H pressured seat include polity / lineage / support / pressure fields when assignable.
H village includes polityId, lineageId, state, support, and pressure.
H outpost includes polity / lineage / support / pressure fields when assignable.
H old seat can include polity, lineage, reason, and abandonedTick.
POI tags are not required to include polity fields.
```

Visual identity:

```text
Rendered Human polity tags expose data-polity-id, data-polity-color, data-lineage-id, and data-tag-state.
Human polity tags use stable polity-color-0 through polity-color-7 accent classes.
Color is applied only to tag border / accent, not to full terrain or domain fill.
```

Hover:

```text
Human polity tags use native title text with polity id, polity state, lineage, tag state, support, pressure, and split origin when available.
```

Known simplifications:

```text
Polity color applies to tags only, not full terrain / domain fill.
Hover uses native browser title text.
Village flicker is not solved in V0.11.7.
Polity identity remains observer-only.
```

---

## 59. V0.11.8 Clickable Tag Info Panel

V0.11.8 makes visible semantic tags inspectable with a compact click panel.

It does not add terrain types, unit types, actual buildings, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, terrain decay, or core counter-cycle rules.

Interaction:

```text
Clicking a visible semantic tag opens a compact information panel.
Pressing Enter or Space on a focused semantic tag opens the same panel.
Close hides the panel.
Escape hides the panel.
Reset clears the selected tag.
Clicking another tag replaces the panel content.
```

Panel content:

```text
The panel shows identity, ownership / relation, state, metrics, position, and interpretation.
Human polity tags show polity id, polity state, lineage, local state, support, pressure, split origin when present, and position.
H domain shows source shape id and assigned polity / lineage when known.
POI tags show id, type, role, position, and interpretation.
B range and S scar show source shape id, position, and interpretation.
```

Data and exports:

```text
Rendered semantic tag elements store data-tag-index and use the latest in-memory currentSemanticTags list.
Semantic tag export shape remains compact and does not include panel-only rows.
Macro timeline frame top-level keys are unchanged.
Native title remains as fallback hover text.
```

Known simplifications:

```text
The info panel shows the clicked tag snapshot.
The panel may not live-update if the tag disappears while simulation runs.
The panel uses existing semantic tag fields and does not query historical records deeply.
```

---

## 60. V0.11.9 Ancestry Chain / Polity Split Dedup

V0.11.9 adds compact ancestry chains and polity split deduplication to the observer-only Human lineage / polity data layer.

It does not add terrain types, unit types, actual buildings, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, ancestral-memory events, or any gameplay effect. It does not change movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, terrain decay, or core counter-cycle rules.

Polity split dedup:

```text
Each split candidate receives a stable splitKey based on parent polity, root lineage, and outpost id or coarse location.
If a non-collapsed polity already has the same splitKey, owns the outpost, or has the same root lineage and nearby seat, that polity is reused.
Repeated polity_split events for the same splitKey are suppressed.
Same parent polity / root lineage splits use a deterministic cooldown to avoid jitter clones.
```

Lineage ancestry:

```text
Lineage summaries include lineageAncestryIds, rootAncestorId, ancestorDepth, and capped seatAncestry.
lineageAncestryIds begins with the lineage itself and walks parentId backward.
The chain is capped at 8 ids.
seatAncestry is capped at 6 compact seat records.
```

Polity and village ancestry:

```text
Polity summaries include polityAncestryIds, rootPolityId, splitDepth, splitKey, and capped seatAncestry.
Village summaries include lineageAncestryIds, polityAncestryIds, rootLineageId, rootPolityId, and memorySeed.
memorySeed is deterministic: village id, polity id, lineage id, and firstSeenTick.
Semantic Human tags may include compact ancestry fields for visible tags.
```

Export constraints:

```text
Snapshot, Recording, and Macro Timeline summaries may include compact ancestry arrays.
Frame top-level keys are unchanged.
Full ancestor objects are not exported.
```

Known simplifications:

```text
Ancestry chains are compact snapshots, not full historical biographies.
Village memorySeed is only stored; no memory awakening behavior exists yet.
Split dedup uses deterministic heuristics.
Polity ancestry is observer-only.
```

---

## 61. V0.11.10 Polity Lifecycle / Domain Ownership

V0.11.10 cleans up Human polity lifecycle state and assigns H domain ownership when confidence is high.

It does not add terrain types, unit types, actual buildings, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. It does not change movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, terrain decay, or core counter-cycle rules.

Authoritative seat sync:

```text
Polity currentSeat is synchronized from active lineage currentSeat or a promoted outpost seat.
If a polity currentSeat no longer matches an authoritative seat, it is moved to oldSeats and cleared.
Stale seat loss records one polity_seat_lost event rather than repeating every frame.
```

Lifecycle:

```text
Polities progress through active / pressured / seatless / declining / collapsed interpretation states.
Pressed or corrupted seats accumulate pressuredSamples.
Seatless polities accumulate seatlessSamples.
Declining polities accumulate decliningSamples and collapse without active seat, villages, or outposts.
Collapsed polities do not emit visible current map tags.
Collapsed polity retention is capped at 6 compact records where possible.
```

H domain ownership:

```text
H domain semantic tags may include polityId, polityState, polityColorIndex, lineageId, polityAncestryIds, and rootPolityId.
Ownership is inferred from matching lineage, nearby active seat, nearby active village, or nearby active outpost.
If no polity clearly wins, H domain remains unassigned.
```

Export constraints:

```text
humanPolitySummary may include compact pressuredSamples, seatlessSamples, and decliningSamples.
Macro timeline top-level frame keys are unchanged.
Full cell arrays are not exported.
```

Known simplifications:

```text
Polity lifecycle is heuristic.
Collapsed polities are retained compactly only for ancestry/reference.
H domain ownership is inferred and may remain unassigned when ambiguous.
No gameplay rules are affected.
```

---

## 62. V0.11.11 Polity Ownership Consistency / Remnants

V0.11.11 enforces Human polity ownership consistency and introduces observer-only H remnant tags.

It does not add terrain types, unit types, actual buildings, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect. H remnant is a macro marker only, not a new unit, building, terrain, or rule actor.

Ownership invariant:

```text
One active lineage currentSeat may have at most one active / pressured / split polity owner.
If multiple polities claim the same lineage currentSeat, one winner is selected deterministically.
Losers clear currentSeat, keep ancestry/oldSeats, and become seatless or declining.
```

Collapsed polity tag suppression:

```text
Collapsed polities do not emit normal current H seat, H pressured seat, H village, H outpost, or H domain tags.
Collapsed polities may still appear in ancestry chains, old seat records, remnant previousPolityId, and compact exports.
```

Village inheritance and remnants:

```text
Villages owned by collapsed polities try to transfer to a nearby active descendant polity.
Inherited villages keep previousPolityId and inheritedFromPolityId.
If no clear active descendant can inherit, the village becomes H remnant while support remains.
H remnant fades when support disappears.
Visible H remnant tags are capped at 2.
```

Export constraints:

```text
humanPolitySummary.villages may include state remnant or inherited.
Villages may include previousPolityId and inheritedFromPolityId.
humanPolitySummary may include activeRemnants and inheritedVillages.
Macro timeline top-level frame keys are unchanged.
```

Known simplifications:

```text
H remnant is observer-only.
Inherited village behavior has no gameplay effect.
Outpost transfer is simplified to suppressing normal current outpost tags for collapsed polity outposts.
Ownership conflict resolution is heuristic.
```

---

## 63. V0.11.12 Polity Ownership Hardening Final

V0.11.12 is a strict Human polity ownership consistency hardening pass.

It does not add terrain types, unit types, actual buildings, NPCs, quests, resource economy, save/load, external libraries, multi-screen gameplay, or any gameplay effect.

Non-negotiable invariants:

```text
Collapsed polity with currentSeat count = 0.
Visible H seat / H pressured seat tags owned by collapsed polity = 0.
Same lineage currentSeat owned by multiple active/non-collapsed polities = 0.
Stale polity currentSeat without matching lineage currentSeat = 0.
```

Collapse cleanup:

```text
Any collapsed polity must clear currentSeat.
If a collapsed polity had currentSeat, the seat is preserved in oldSeats with reason polity_collapsed.
This cleanup runs during lifecycle update and again as a final invariant pass.
```

Seat ownership cleanup:

```text
After polity updates, current seats are checked by lineageId.
Only one non-collapsed polity may own a given lineage currentSeat.
Losing polities move their seat to oldSeats with reason ownership_conflict and become seatless or declining.
Polity seats without a matching active lineage currentSeat are cleared with reason stale_lineage_seat.
```

Semantic tag guardrail:

```text
Current Human tags owned by collapsed polities are dropped after tag generation.
This applies to H seat, H pressured seat, H village, H outpost, and H domain.
H old seat, H remnant, ancestry references, and previousPolityId / inheritedFromPolityId remain allowed.
```

Known simplifications:

```text
Ownership conflict resolution is deterministic but heuristic.
Losing polities retain ancestry and old seat history.
This pass does not add gameplay behavior.
```

---

## 64. V0.11.13 Polity Plurality Repair

V0.11.13 is a focused observer / macro interpretation repair after V0.11.12.

It does not change Human, Beast, or Spirit movement, lifecycle, conflict, conversion, terrain rewriting, fertility, POI effects, or terrain decay.

Authoritative polity seats:

```text
Human polity currentSeat carries seatSource and sourceId.
seatSource lineage uses sourceId = lineage id.
seatSource outpost uses sourceId = outpost id and outpostId = outpost id.
```

Seat validity:

```text
Lineage-source seats are valid only when they match an active lineage currentSeat within distance 1.
Outpost-source seats are valid only when they match an owned promoted/promotable Human outpost within distance 1.
Outpost-source failures use stale_outpost_seat.
Lineage-source failures keep stale_lineage_seat for compatibility.
Source-less stale failures may use stale_authoritative_seat.
```

Ownership uniqueness:

```text
Current seat uniqueness is keyed by seatSource + sourceId.
Two active polities may share lineage ancestry if their authoritative seat sources differ.
Two active polities may not own the same authoritative source.
Ownership conflict losers move their currentSeat to oldSeats with reason ownership_conflict.
```

Supported seatless polity behavior:

```text
A seatless polity with current village or outpost support remains seatless/declining longer and may still emit limited H village, H outpost, or H domain ownership.
Seatless polities do not emit fake H seat tags.
Collapsed polities still clear currentSeat and emit no current Human ownership tags.
```

Village assignment:

```text
Human village ownership prefers spatially plausible current seats and active/promotable outposts before falling back to root lineage polity ownership.
This keeps distant outpost-derived Human clusters readable as separate polities when support exists.
```

Known simplifications:

```text
Plurality repair is observer-only.
Supported seatless survival is heuristic.
Outpost-derived seat validity is local and compact; exports do not include full source objects.
```

---

## 65. V0.11.14 Collapsed Polity Seat Rebind Repair

V0.11.14 is a narrow Human polity memory repair.

It does not change Human, Beast, or Spirit movement, conflict, conversion, reproduction, terrain rewriting, fertility, POI effects, terrain decay, grid size, terrain types, or unit types.

Collapsed polity lookup:

```text
Collapsed Human polities are history.
findHumanPolityForLineage must not return a collapsed polity.
Collapsed polities may still appear in ancestry, oldSeats, remnants, previousPolityId, inheritedFromPolityId, and compact exports.
Collapsed polities may not own current lineage seats.
```

Lineage seat rebinding:

```text
If a stable/active lineage has currentSeat but lineage.polityId points to a collapsed polity, the lineage is rebound.
First try a spatially plausible non-collapsed polity near the lineage seat.
If none exists, create a new successor polity.
The collapsed polity remains collapsed.
```

Successor polity behavior:

```text
New successors receive currentSeat from the lineage.
The successor currentSeat uses seatSource lineage and sourceId = lineage id.
The successor keeps splitFromPolityId pointing to the collapsed historical polity when applicable.
The lineage.polityId updates to the active/successor polity.
```

Event guard:

```text
polity_seat_established is not emitted repeatedly for the same polity/source/position.
polity_successor_founded may be emitted once when a successor is created from a collapsed owner.
polity_seat_established must not be emitted for collapsed polities.
```

Invariants retained:

```text
Collapsed polity currentSeat count = 0.
Current semantic tags owned by collapsed polity = 0.
Duplicate authoritative source owners = 0.
```

Known simplifications:

```text
Successor selection is deterministic and heuristic.
This is observer-only polity memory repair.
```

---

## 66. V0.11.15 Human Village Stability Pass

V0.11.15 is a narrow Human village marker stability pass.

It does not change Human, Beast, or Spirit movement, conflict, conversion, reproduction, terrain rewriting, fertility, POI effects, terrain decay, grid size, terrain types, unit types, or polity seat ownership rules.

Village reuse:

```text
Village candidates first try to reuse existing villages before creating a new id.
Reuse priority is same polity + same lineage, then same polity, then same lineage with a non-collapsed polity owner.
Nearby reused villages keep id, firstSeenTick, memorySeed, previousPolityId, and inheritedFromPolityId.
Local drift may update x/y within the reuse distance.
```

Minimum lifetime and grace:

```text
Young villages with nearby Human FIELD support persist for a short minimum lifetime even when not selected as the best candidate that frame.
Older unmatched villages enter fading for a small missing-sample grace window before removal.
Collapsed polity village inheritance/remnant behavior remains unchanged.
```

Event stability:

```text
village_found is emitted only for truly new ids and is throttled for nearby equivalent villages.
village_faded is emitted when a village first enters fading, not every fading frame.
Repeated village_found / village_faded macro-frame spam is reduced.
```

Export:

```text
Village summaries include compact missingSamples, firstSeenTick, and lastSeenTick.
Full cell arrays are not exported.
Macro timeline frame top-level keys remain unchanged.
```

Known simplifications:

```text
Village stability is observer-only.
Village reuse and fade grace are deterministic heuristics, not gameplay settlement simulation.
```

---

## 67. V0.12 Local Explore View

V0.12 adds the first player-facing local exploration view.

It is not the Zelda-style multi-screen map and does not add screen-to-screen propagation.

It does not change Human, Beast, or Spirit movement, conflict, conversion, reproduction, terrain rewriting, fertility, POI effects, terrain decay, macro memory, Human lineage, Human polity, Human village rules, grid size, terrain types, or unit types.

Player observer:

```text
The player observer is independent from world cells.
The observer is not H, B, or S.
The observer does not occupy the unit layer.
The observer does not rewrite terrain or affect simulation rules.
The observer initializes on a passable cell near the center when possible.
```

Explore View:

```text
Explore View renders only a fixed local viewport around the observer.
The current viewport is 15 x 11 cells.
Hidden world cells outside the viewport are not rendered as fog.
No explored-cell memory is added.
```

Movement and collision:

```text
WASD and arrow keys move the observer one grid cell.
BLOCK, BORDER, out-of-bounds cells, and hard POI blockers block observer movement.
H/B/S units do not block observer movement.
Movement is disabled while sleeping.
```

Interaction:

```text
Space inspects the nearest important nearby semantic trace or POI center.
Inspection range is 1.5 cells.
Priority favors POI centers, Human seats, old seats, villages, outposts, remnants, Spirit scars, Beast ranges, then Human domains.
The existing semantic tag info panel is reused.
If no trace is nearby, status reports No nearby trace.
```

Sleep / wake:

```text
E toggles sleep and wake while in Explore View.
Sleeping switches to a global macro view and the world continues updating.
Waking returns to the local Explore viewport at the same observer position.
```

Export:

```text
Snapshot and recording export compact playerObserver state: x, y, facing, isSleeping.
Player path arrays are not exported.
Macro timeline frame top-level keys remain unchanged.
```

Known simplifications:

```text
Movement interpolation is lightweight CSS/DOM smoothing rather than sub-cell physics.
No fog of war, minimap, combat, inventory, dialogue, quests, dynamic POIs, or save/load are added.
```

---

## 68. V0.12.1 Explore View Correction

V0.12.1 corrects the first Explore View implementation.

It remains a view/input layer and does not change Human, Beast, or Spirit movement, conflict, conversion, reproduction, terrain rewriting, fertility, POI effects, terrain decay, macro memory, Human lineage, Human polity, Human village rules, grid size, terrain types, or unit types.

Explore visual semantics:

```text
Explore View renders the local viewport with Macro View display masks and classes.
Explore View keeps macro-view and explore-view styling active while awake.
Ordinary H/B/S unit letters are not the dominant Explore display.
The player marker is a separate overlay above the local viewport.
```

Continuous movement:

```text
The player observer uses continuous x/y coordinates.
Held WASD or arrow keys move the observer smoothly over time.
Collision samples the player radius against BLOCK, BORDER, hard POI blockers, and bounds.
H/B/S units do not block the observer.
```

Interaction:

```text
Space interaction range is 2.25 cells.
Interaction searches visible semantic tags plus raw POIs, Human villages, current polity seats, old seats, and Human outposts.
Raw memory targets are converted into compact tag-like objects for the existing info panel.
```

Sleep:

```text
Entering sleep from a stopped simulation starts sleep auto-advance.
Waking stops sleep auto-advance created by sleep.
If Play was already running, sleep does not create a second timer.
Sleep view displays the global Macro View while the world changes.
```

Known simplifications:

```text
Movement smoothing uses a lightweight requestAnimationFrame loop.
Collision sampling is simple radius sampling, not sub-cell physics.
This pass does not add fog, minimap, combat, inventory, quests, dynamic POIs, player ecology effects, or multi-screen gameplay.
```

---

## 69. V0.13.1 Map Seed, Place Memory, Wake Report

V0.13.1 adds editable initialization data, river map features, inspected-place memory, and a wake report for Explore sleep.

It does not add terrain types, unit types, Zelda-style multi-screen gameplay, story systems, resources, quests, NPCs, save/load, network calls, or external libraries. It does not change Human, Beast, or Spirit lifecycle, conflict, conversion, reproduction, terrain rewrite, core fertility rules, POI effects, terrain decay, or the counter cycle.

Map seed:

```text
Map seed shape:
version
name
width
height
units
mountains
rivers
pois

Seed units place initial H/B/S only.
Seed mountains create BLOCK terrain.
Seed POIs become worldPOIs.
Seed rivers become mapFeatures.rivers.
```

River semantics:

```text
River is not a terrain type.
River is not a unit.
River cells keep their underlying terrain.
River cells block H/B/S movement through the existing movement blocker helper.
River cells block Explore player movement through the existing Explore passability helper.
River cells are visible in Macro and Explore rendering.
River restores nearby non-BLOCK, non-river fertility with chance 0.10 per tick.
River fertility restore is capped at fertility level 3.
```

Place memory:

```text
Space inspection in Explore can create or update a place-memory anchor.
Anchor types include poi, river, village, seat, old_seat, outpost, remnant, scar, beast_range, and domain.
Each anchor stores id, type, displayName, position, sourceRef, discoveredAtTick, lastInspectedAtTick, lastSleepObservedTick, currentSnapshot, previousSnapshot, changeSinceLastInspect, and changeSinceLastSleep.
Snapshots keep numeric terrain, unit, fertility, POI, Human, and ecology data.
Player-facing text is deterministic summary text and does not expose raw numeric deltas by default.
Numeric deltas remain available in llmContext for future tools.
```

Sleep / wake report:

```text
Entering Explore sleep records before-sleep snapshots for places inspected during the current awake cycle.
Explore sleep advances 30 ticks and then auto-wakes.
On wake, inspected places are resampled and compared with their before-sleep snapshots.
Only inspected places appear in the "While You Slept" report.
If no places were inspected, the report says no inspected places were being watched.
```

JSON:

```text
Snapshot and recording exports include mapSeed, mapFeatures.rivers, placeMemory, and wakeReports through placeMemory.
Macro timeline frame top-level keys remain unchanged.
```

Known simplification:

```text
The seed editor uses compact JSON plus a brush selector.
Import uses the seed JSON text area rather than a file picker.
The wake report is shown in the existing info panel rather than a separate modal.
```

---

## 70. V0.13.1.1 Map Seed Editor Usability Patch

V0.13.1.1 makes the V0.13.1 Map Seed Editor direct and testable.

It does not change Place Memory, wake report logic, POI player text, sleep duration, H/B/S movement, lifecycle, conflict, conversion, reproduction, terrain rewrite, fertility balance, Macro View visual rules, Explore movement rules, terrain types, or unit types.

Live painting:

```text
Map seed brush edits immediately update activeMapSeed.
Map seed brush edits immediately update the current world.
Seed JSON stays synced after each edit.
Painting does not require Apply Seed.
Painting preserves tick, place memory, and player position when the current player cell remains passable.
```

Coordinate mapping:

```text
Grid clicks read data-world-x and data-world-y when present.
This keeps painting correct in Explore local viewport.
If dataset coordinates are absent, click handling falls back to full-grid index mapping.
```

Brush behavior:

```text
Mountain, River, Erase, Human, Beast, and Spirit can drag-paint.
Spring, Rot Source, Great Forest, and Monument place on click only.
Dragging skips duplicate writes on the same cell.
Mountain paints BLOCK and removes unit / river at that cell through seed rebuild.
River paints mapFeatures.rivers and does not create WATER terrain.
Human / Beast / Spirit brushes paint initial units with FIELD / WILD / MARK terrain.
Erase removes seed item(s) at that cell and updates visible world state immediately.
```

Editor actions:

```text
Generate Random Preset creates an editable seed with mountain clusters, at least one river path, one Spring, one Rot Source, one Great Forest, one Monument, and small H/B/S seed starts.
Clear Seed resets activeMapSeed to empty default and clears seed-driven units, mountains, rivers, and POIs.
Apply JSON Seed remains available for applying the textarea seed JSON.
```

Known simplification:

```text
Live painting rebuilds the 40 x 25 world from the active seed after each brush edit.
This is acceptable for the current single-screen prototype and keeps behavior simple.
```

---

## 71. V0.13.1.2 Place Memory Semantics + River Village Guard

V0.13.1.2 is a focused observer / memory / validation patch for player-facing place memory.

It does not change Human, Beast, or Spirit movement, lifecycle, conflict, conversion, reproduction, terrain rewriting, fertility balance, POI ecology effects, grid size, terrain types, unit types, Explore movement, or map seed editor behavior except where needed to prevent Human village anchors from occupying river cells.

River village guard:

```text
Human village anchors cannot be created on river cells.
Human village anchors cannot drift or be reused onto river cells.
Existing active Human villages found on river cells are invalidated instead of preserved by village grace logic.
River cells may still visually pass through FIELD underneath because river remains a map feature, not terrain.
```

Place memory semantics:

```text
Place snapshots store structured placeState with status, trend, dominantPressure, intensity, confidence, and visible.
Human-related place snapshots store compact humanMemory for settlement, polity, lineage, and continuity.
Structured placeChange records include category, subject, direction, intensity, fromTick, toTick, numeric metricsDelta, playerText, and llmContext.
No-significant-change records are retained internally and exported, but visibleToPlayer is false and playerText is empty.
```

Player-facing text:

```text
Human village / seat / outpost / remnant inspection prioritizes identity, polity, lineage, branch continuity, meaningful change, and obvious pressure.
Repeated unchanged inspections do not show "changed little", "unchanged", or "no significant change" text.
Wake reports list only watched places with visible meaningful changes.
If watched places did not change meaningfully, the wake report uses one concise fallback.
```

Known simplifications:

```text
Place state and Human memory are deterministic heuristics for readability.
They do not change simulation rules.
Anchor-center terrain state changes are treated as meaningful place-state changes even when the surrounding aggregate terrain delta is below the normal threshold.
```

---

## 72. V0.14A Semantic Place Layer

V0.14A adds an observer-only Semantic Place Layer to Place Memory.

It does not change Human, Beast, or Spirit movement, lifecycle, conflict, conversion, reproduction, terrain rewriting, fertility balance, POI ecology effects, river blocker behavior, grid size, terrain types, unit types, Explore movement, tick order, or map seed editor behavior.

Place Memory snapshot semantics:

```text
Place snapshots store semanticTraits as a compact deterministic vocabulary.
Place snapshots store one placeArchetype.
Place snapshots store compact interpretationHints.
Traits are derived from existing snapshot, anchor/target, map feature, POI, placeState, and humanMemory data.
Trait derivation does not use random numbers.
Trait derivation does not mutate world cells, units, terrain, POIs, rivers, counts, or tick.
```

Place change context:

```text
computePlaceChange llmContext includes semanticTraits, placeArchetype, interpretationHints, displayName, and visibleToPlayer.
No-significant-change records remain quiet for the player.
Wake reports remain sparse and list only visible meaningful watched-place changes.
recently_changed and long_stable are change-context traits, not gameplay state.
```

Allowed place archetypes:

```text
river_village
river_crossing
forest_edge_settlement
beast_range
spirit_scar
haunted_remnant
pressured_seat
old_seat
seatless_polity_center
frontier_outpost
fertile_refuge
contested_poi
settled_village
ordinary_place
```

Known simplifications:

```text
Semantic traits and archetypes are deterministic heuristics for readability and future interpretation.
Interpretation hints are short summaries of existing traits and metrics.
V0.14A does not add tarot, AI, civilization systems, story events, resources, NPCs, quests, buildings, save/load, new terrain, new units, external libraries, or multi-screen propagation.
```

## 72.1 V0.14A.1 Semantic Place Tuning

V0.14A.1 tunes observer-only semantic archetypes and Human place memory.

It does not change Human, Beast, or Spirit movement, lifecycle, conflict, conversion, reproduction, terrain rewriting, fertility balance, POI ecology effects, river blocker behavior, grid size, terrain types, unit types, Explore movement, tick order, or map seed editor behavior.

POI archetype tuning:

```text
contested_poi now requires stronger conflict or corruption signals:
mixed_pressure
mark_corroded
spirit_pressure
spirit_scarred
pressured_polity
field_declining around Human or Monument context
placeState.status contested or corrupted
```

```text
beast_pressure or beast_habitat alone does not make Spring or Great Forest contested_poi.
Normal Spring / Great Forest Beast ecology should prefer fertile_refuge, beast_range, forest-associated interpretation, or ordinary_place.
Corrupted, mixed, or Spirit-pressured POIs can still become contested_poi.
```

Human remembered identity:

```text
PlaceMemoryAnchor may store rememberedHumanIdentity.
PlaceSnapshot may expose rememberedHumanIdentity when available.
computePlaceChange llmContext may expose rememberedHumanIdentity.
rememberedHumanIdentity is compact observer memory only.
```

Shape:

```js
rememberedHumanIdentity: {
  polityId,
  polityState,
  lineageId,
  rootPolityId,
  rootLineageId,
  polityAncestryIds,
  lineageAncestryIds,
  rememberedAtTick,
  source
}
```

Rules:

```text
Do not overwrite remembered identity with null.
Do not use remembered identity to mutate Human polity / lineage systems.
Do not call remembered identity current ownership.
Remembered identity must not add polity_owned unless current humanMemory.polity.id exists.
```

New archetype:

```text
settled_village
```

Use for:

```text
human_settled + (polity_owned OR lineage_continuity)
```

Priority:

```text
Below pressured_seat, haunted_remnant, old_seat, seatless_polity_center, river_village, forest_edge_settlement, frontier_outpost, contested_poi, and spirit_scar.
Above beast_range, river_crossing, fertile_refuge, and ordinary_place.
```

Known simplifications:

```text
V0.14A.1 is observer-only semantic tuning.
rememberedHumanIdentity is a compact last-known identity, not current ownership.
settled_village is a memory label, not a building or resource economy.
```

---

## 73. Version

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.14A.1_SEMANTIC_PLACE_TUNING
Date: 2026-06-18
Status: V0.14A.1 Semantic Place Tuning implemented
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
Population evolution macro view: TRI_SPECIES_WORLD_SIM_V0.10.7_POPULATION_EVOLUTION_MACRO_VIEW
Macro population visual primary: TRI_SPECIES_WORLD_SIM_V0.10.7.1_MACRO_POPULATION_VISUAL_PRIMARY
Initial POI world anchors: TRI_SPECIES_WORLD_SIM_V0.10.8_INITIAL_POI_WORLD_ANCHORS
POI ecology anchor rebalance: TRI_SPECIES_WORLD_SIM_V0.10.8.1_POI_ECOLOGY_ANCHOR_REBALANCE
POI blocking and visual priority: TRI_SPECIES_WORLD_SIM_V0.10.8.2_POI_BLOCKING_VISUAL_PRIORITY
Rot source inner ring hardening: TRI_SPECIES_WORLD_SIM_V0.10.8.3_ROT_SOURCE_INNER_RING_HARDENING
Macro memory slow trace: TRI_SPECIES_WORLD_SIM_V0.10.9_MACRO_MEMORY_SLOW_TRACE
Macro memory tuning: TRI_SPECIES_WORLD_SIM_V0.10.9.1_MACRO_MEMORY_TUNING
Human lineage memory: TRI_SPECIES_WORLD_SIM_V0.11_HUMAN_LINEAGE_MEMORY_PROTOTYPE
Human lineage visibility: TRI_SPECIES_WORLD_SIM_V0.11.1_HUMAN_LINEAGE_VISIBILITY_PASS
Semantic macro tags: TRI_SPECIES_WORLD_SIM_V0.11.2_SEMANTIC_MACRO_TAGS
Human seat / domain anchors: TRI_SPECIES_WORLD_SIM_V0.11.3_HUMAN_SEAT_DOMAIN_ANCHORS
Semantic tag declutter: TRI_SPECIES_WORLD_SIM_V0.11.4_SEMANTIC_TAG_DECLUTTER
Human outpost / seat promotion: TRI_SPECIES_WORLD_SIM_V0.11.5_HUMAN_OUTPOST_SEAT_PROMOTION
Human polity / village layer: TRI_SPECIES_WORLD_SIM_V0.11.6_HUMAN_POLITY_VILLAGE_LAYER
Polity visual identity: TRI_SPECIES_WORLD_SIM_V0.11.7_POLITY_VISUAL_IDENTITY
Clickable tag info panel: TRI_SPECIES_WORLD_SIM_V0.11.8_CLICKABLE_TAG_INFO_PANEL
Ancestry chain / polity split dedup: TRI_SPECIES_WORLD_SIM_V0.11.9_ANCESTRY_CHAIN_POLITY_SPLIT_DEDUP
Polity lifecycle / domain ownership: TRI_SPECIES_WORLD_SIM_V0.11.10_POLITY_LIFECYCLE_DOMAIN_OWNERSHIP
Polity ownership consistency / remnants: TRI_SPECIES_WORLD_SIM_V0.11.11_POLITY_OWNERSHIP_CONSISTENCY_REMNANTS
Polity ownership hardening final: TRI_SPECIES_WORLD_SIM_V0.11.12_POLITY_OWNERSHIP_HARDENING_FINAL
Polity plurality repair: TRI_SPECIES_WORLD_SIM_V0.11.13_POLITY_PLURALITY_REPAIR
Collapsed polity seat rebind repair: TRI_SPECIES_WORLD_SIM_V0.11.14_COLLAPSED_POLITY_SEAT_REBIND_REPAIR
Human village stability pass: TRI_SPECIES_WORLD_SIM_V0.11.15_HUMAN_VILLAGE_STABILITY_PASS
Local explore view: TRI_SPECIES_WORLD_SIM_V0.12_LOCAL_EXPLORE_VIEW
Explore view correction: TRI_SPECIES_WORLD_SIM_V0.12.1_EXPLORE_VIEW_CORRECTION
Map seed / place memory / wake report: TRI_SPECIES_WORLD_SIM_V0.13.1_MAP_SEED_PLACE_MEMORY_WAKE_REPORT
Map seed editor usability: TRI_SPECIES_WORLD_SIM_V0.13.1.1_MAP_SEED_EDITOR_USABILITY_PATCH
Place memory semantics / river village guard: TRI_SPECIES_WORLD_SIM_V0.13.1.2_PLACE_MEMORY_SEMANTICS_RIVER_VILLAGE_GUARD
Semantic place layer: TRI_SPECIES_WORLD_SIM_V0.14A_SEMANTIC_PLACE_LAYER
Semantic place tuning: TRI_SPECIES_WORLD_SIM_V0.14A.1_SEMANTIC_PLACE_TUNING
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
