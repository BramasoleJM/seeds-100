# CODEX_V0_5_LIFECYCLE_GROUPS_PROMPT.md

Copy this prompt into Codex to implement the V0.5 lifecycle + group-behavior redesign.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Act as Executor.

This is not a small numeric tuning pass.

The current model still converges into stable territorial blocks. We are redesigning the population logic so that the three species behave less like infinite cellular flood-fills and more like:

```text
Humans = clustered settlements that can send out settlers.
Beasts = roaming packs that expand wild ground but do not permanently fill it.
Spirits = temporary manifestations around marks / humans, not a normal animal population.
```

Do not add Zelda-style multi-screen map.

Do not add tarot.

Do not add lore text.

Do not add resources, economy, buildings, UI polish, or final art.

---

## Observed problem

Current snapshots show stable territorial occupation.

Example tick 111:

```text
H = 132
B = 275
S = 64
F = 185
W = 619
M = 98
X = 41
```

Example tick 162:

```text
H = 215
B = 236
S = 25
F = 315
W = 562
M = 33
X = 44
```

Problem:

```text
Population keeps filling available territory.
Once territory is filled, boundaries are maintained.
Other species have little chance to invade.
The simulation tends toward static blocks.
```

Main diagnosis:

```text
There is no natural lifespan.
Birth is local and indefinite.
Species occupy territory as individual cells instead of forming groups.
Beasts and Spirits lack distinct behavioral identity.
```

---

## V0.5 design goal

Create a system where:

```text
1. Humans form small settlements.
2. If a settlement grows crowded, some humans leave as settlers.
3. Settlers can found new small settlements elsewhere.
4. Beasts move as roaming packs, expand WILD, reproduce rarely, and avoid strong human groups.
5. Spirits are not a normal population. They manifest near MARK / Human pressure, act, then fade.
6. Natural death prevents permanent population saturation.
7. The map should contain clusters, gaps, migrations, and moving pressure zones.
```

This is still a grid simulation, but no longer pure flood-fill cellular automata.

---

## Data model changes

Each unit should store at least:

```js
unit: "H" | "B" | "S" | null
age: number
```

Optional but useful:

```js
role: "normal" | "settler" | "pack" | "manifestation"
```

Minimum acceptable implementation:

```text
Add age for all units.
Use role only for Humans if implementing settlers.
```

If changing the existing cell structure is hard, add a parallel age grid:

```js
unitAge[y][x]
unitRole[y][x]
```

When a new unit is born, age starts at 0.

Each tick, every unit age increases by 1.

---

## New terrain rules remain the same

Do not add new terrain.

Keep:

```text
. EMPTY
F FIELD
W WILD
M MARK
X BORDER
# BLOCK
```

---

# PART A — Natural lifespan

## A1. Human natural death

Humans should not live forever.

Rule:

```text
If H age >= humanMaxAge:
    H dies with probability humanOldAgeDeathChance each tick.
```

Defaults:

```text
humanMaxAge = 90
humanOldAgeDeathChance = 0.20
```

Also add a very small baseline mortality:

```text
humanBaselineDeathChance = 0.002
```

Do not apply baseline death to newly spawned humans younger than 8 ticks.

---

## A2. Beast natural death

Beasts should turn over faster than humans.

Defaults:

```text
beastMaxAge = 65
beastOldAgeDeathChance = 0.25
beastBaselineDeathChance = 0.004
```

Do not apply baseline death to beasts younger than 5 ticks.

---

## A3. Spirit manifestation duration

Spirits are temporary manifestations, not a stable population.

Defaults:

```text
spiritMaxAge = 45
spiritOldAgeDeathChance = 0.35
```

If a Spirit is not near Human, FIELD, or another MARK:

```text
it disappears regardless of age.
```

Definition of near:

```text
8-neighborhood contains H or FIELD or MARK
```

---

# PART B — Human settlements and migration

## B1. Human reproduction becomes settlement-based

Humans should reproduce only inside a supported settlement cluster.

Replace current Human reproduction with:

```text
cell has no unit
terrain is FIELD
neighboring Human count is 2 or 3
neighboring FIELD count >= 2
neighboring Beast count == 0
spiritPressure < 2
localUnitCount <= 5
```

This keeps reproduction local to settlement-like areas.

---

## B2. Human overcrowding creates settlers instead of more local birth

If a Human is inside a dense human field cluster:

```text
neighboring Human count >= 4
neighboring FIELD count >= 4
```

Then with probability:

```text
settlerSpawnChance = 0.08
```

try to create a settler on a nearby EMPTY or FIELD edge cell.

Target for settler:

```text
Prefer adjacent EMPTY with no unit.
Then adjacent FIELD with no unit.
Do not spawn into WILD, MARK, BORDER, BLOCK.
```

If role support exists:

```text
new Human role = "settler"
```

If no role support, just spawn a normal Human.

This represents:

```text
A crowded settlement sends out people to form a new group.
```

---

## B3. Settler movement

If roles are implemented:

Human settler movement priority:

```text
EMPTY > FIELD > WILD
```

But settlers avoid:

```text
MARK
BORDER
BLOCK
cells adjacent to 2+ Beasts
cells adjacent to 1+ Spirit if not supported by another Human
```

Settlers prefer to move away from dense Human clusters.

Simple implementation:

```text
For candidate moves, score higher if fewer neighboring Humans.
```

If no role support, approximate this by letting Humans in dense clusters sometimes move outward to EMPTY cells.

---

## B4. Founding a new settlement

If a Human settler or normal Human is on EMPTY and has at least one Human neighbor:

```text
EMPTY -> FIELD
```

If a small group of Humans reaches a new area, they begin making FIELD.

Important:

```text
Humans should not individually convert every WILD tile.
Human conversion of WILD should require support.
```

Change Human terrain rewrite:

Old:

```text
H on WILD -> FIELD
```

New:

```text
H on WILD -> FIELD only if neighboring Human count >= 2.
Otherwise WILD remains WILD.
```

Human on EMPTY:

```text
EMPTY -> FIELD if neighboring Human count >= 1
```

Human on FIELD:

```text
FIELD remains FIELD
```

This makes humans group-based.

---

# PART C — Beast packs

## C1. Beast reproduction becomes rare

Replace Beast reproduction with:

```text
cell has no unit
terrain is WILD
neighboring Beast count is 2 or 3
neighboring Human count == 0
neighboring Spirit count <= 1
emptyUnitNeighbors >= 3
localUnitCount <= 4
random chance < beastBirthChance
```

Default:

```text
beastBirthChance = 0.12
```

This means Beast reproduction is possible but not guaranteed.

---

## C2. Beasts avoid strong human groups

If a Beast has neighboring Human count >= 2:

```text
it tries to move away from Humans.
```

Movement priority in this case:

```text
WILD away from Humans > EMPTY away from Humans > MARK > FIELD
```

Do not move toward cells with more neighboring Humans than current cell.

If no escape target exists, the Beast stays and may be killed by Humans.

---

## C3. Humans kill Beasts only when Beast is trapped / surrounded

Old Human counters Beast rule may be too broad.

Change to:

```text
If Beast has neighboring Human count >= 3
and Beast has no valid escape cell:
    Beast dies
```

A valid escape cell:

```text
adjacent cell has no unit
terrain is WILD or EMPTY
and neighboring Human count at target < current neighboring Human count
```

If Beast has escape, it should prioritize movement next tick instead of dying.

This makes Beasts feel more like evasive animals rather than static enemies.

---

## C4. Beast terrain rewrite

Beast on terrain:

```text
FIELD -> WILD
MARK -> WILD
EMPTY -> WILD with probability beastWildSpreadChance
WILD remains WILD
```

Default:

```text
beastWildSpreadChance = 0.45
```

This prevents every Beast step from instantly painting the map.

---

# PART D — Spirit manifestations

## D1. Spirits are not normal breeders

Remove normal Spirit reproduction as a primary population mechanism.

Spirits should manifest from MARK under pressure.

New Spirit manifestation rule:

For an empty-unit MARK cell:

```text
If neighboring Spirit count <= 1
and neighboring Beast count == 0
and at least one of the following is true:
    neighboring Human count >= 1
    neighboring FIELD count >= 1
Then with probability spiritManifestChance:
    spawn Spirit with age 0
```

Default:

```text
spiritManifestChance = 0.18
```

This makes Spirits appear near humans / fields, not breed deep inside MARK blobs.

---

## D2. Spirits convert isolated Humans

Keep:

```text
If Human has neighboring Spirit count >= 1
and spiritPressure >= 2
and neighboring Human count < 2:
    Human becomes Spirit
    terrain becomes MARK
```

But the converted Spirit should be age 0 and role "manifestation" if role exists.

---

## D3. Spirits do not seek to fill the map

Spirit movement priority:

```text
toward isolated Human > toward FIELD edge > MARK > EMPTY
```

But Spirit should avoid Beast pressure:

```text
Do not move into a cell with neighboring Beast count >= 2.
```

Spirit terrain rewrite:

```text
FIELD -> MARK
EMPTY -> MARK with probability spiritMarkSpreadChance
WILD -> MARK only if neighboring Spirit count >= 2
MARK remains MARK
```

Defaults:

```text
spiritMarkSpreadChance = 0.35
```

This makes Spirits field/human-oriented rather than universal spreaders.

---

# PART E — Terrain decay

Keep terrain decay but adjust to group logic.

## E1. FIELD decay

```text
FIELD with no Human in current cell or 8-neighborhood -> EMPTY
```

Keep.

## E2. WILD decay

```text
WILD with no Beast in current cell or 8-neighborhood -> EMPTY
```

Keep.

## E3. MARK decay

```text
MARK with no Spirit and no Human and no FIELD in current cell or 8-neighborhood -> EMPTY
```

This allows MARK to remain near human pressure even if Spirit manifestations fade.

## E4. BORDER decay

```text
BORDER with fewer than two different unit types nearby -> EMPTY
```

Keep.

---

# PART F — Movement update

Use species-specific movement identity.

## F1. Human movement identity

Humans prefer:

```text
FIELD if normal
EMPTY if settler / dense cluster outward migration
```

Humans avoid:

```text
MARK
BORDER
BLOCK
cells with neighboring Beast >= 2
cells with neighboring Spirit >= 1 unless neighboring Human support >= 1
```

## F2. Beast movement identity

Beasts prefer:

```text
WILD
EMPTY
MARK
FIELD
```

But if near 2+ Humans, flee rather than approach.

If not near Humans:

```text
prefer FIELD or MARK if nearby, otherwise wander in WILD/EMPTY.
```

## F3. Spirit movement identity

Spirits prefer:

```text
isolated Human adjacency
FIELD edge
MARK
EMPTY
```

Avoid:

```text
cells with 2+ neighboring Beasts
```

---

# PART G — JSON diagnostics

Update JSON export to include:

```js
events: {
  births: { H: 0, B: 0, S: 0 },
  naturalDeaths: { H: 0, B: 0, S: 0 },
  conflictDeaths: { H: 0, B: 0, S: 0 },
  conversions: { H_to_S: 0 },
  settlerSpawns: 0,
  spiritManifestations: 0,
  terrainChanges: {
    EMPTY_to_FIELD: 0,
    WILD_to_FIELD: 0,
    FIELD_to_WILD: 0,
    MARK_to_WILD: 0,
    FIELD_to_MARK: 0,
    EMPTY_to_MARK: 0,
    WILD_to_MARK: 0,
    FIELD_to_EMPTY: 0,
    WILD_to_EMPTY: 0,
    MARK_to_EMPTY: 0
  }
}
```

At minimum implement:

```js
births
naturalDeaths
conflictDeaths
conversions
settlerSpawns
spiritManifestations
```

---

# PART H — UI parameters

Add sliders if easy, otherwise constants are fine.

Recommended params:

```text
humanMaxAge = 90
humanOldAgeDeathChance = 0.20
humanBaselineDeathChance = 0.002

beastMaxAge = 65
beastOldAgeDeathChance = 0.25
beastBaselineDeathChance = 0.004
beastBirthChance = 0.12
beastWildSpreadChance = 0.45

spiritMaxAge = 45
spiritOldAgeDeathChance = 0.35
spiritManifestChance = 0.18
spiritMarkSpreadChance = 0.35

settlerSpawnChance = 0.08
```

---

# Expected result

After V0.5:

```text
Humans should form small FIELD clusters, not one solid human wall.
Crowded human clusters should occasionally send settlers outward.
Beasts should roam in packs, not fill every WILD cell.
Beast population should fluctuate due to natural death and rare reproduction.
Spirits should appear near humans / fields / marks and fade, not behave like a normal animal population.
The map should have gaps, moving packs, settlement seeds, and temporary spirit pressure.
Stable borders should be less permanent.
```

---

# Test target

Run:

```text
0-300 ticks
```

Export:

```text
snapshot at around tick 100
snapshot at around tick 200
recording 0-300 if possible
```

Evaluate:

```text
1. Are there multiple small Human clusters instead of one solid F/H mass?
2. Do Beasts move as scattered packs instead of filling all WILD?
3. Does Beast population fluctuate rather than monotonic growth?
4. Do Spirits appear near Human/FIELD pressure and fade elsewhere?
5. Does the map keep empty gaps?
6. Are there migrations / recolonizations?
```

---

# Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Set version:

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.5_LIFECYCLE_GROUPS
```

Add note:

```text
V0.5 changes the model from pure individual flood-fill automata to lifecycle + group behavior:
- natural death
- human settlement and settlers
- beast packs and evasive movement
- spirit manifestations
```

---

# Do not do

Do not add DEPLETED terrain.
Do not add new terrain types.
Do not add multi-screen map.
Do not add tarot.
Do not add lore text.
Do not add resources.
Do not add buildings.
Do not change art direction.

---

# Completion report

Report:

```text
files changed
data model changes
rules changed
new parameters
JSON diagnostics implemented
how to run
how to export recordings
known simplifications
```
