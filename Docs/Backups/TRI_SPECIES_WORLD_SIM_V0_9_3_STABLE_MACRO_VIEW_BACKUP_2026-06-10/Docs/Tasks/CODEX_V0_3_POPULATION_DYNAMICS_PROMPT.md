# CODEX_V0_3_POPULATION_DYNAMICS_PROMPT.md

Copy this prompt into Codex to implement V0.3 population dynamics patch.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Act as Executor.

Do not implement the previous depletion / exhausted terrain idea.

We are rejecting the DEPLETED terrain direction because it is not intuitive and may be hard to extend later.

Do not add new terrain types.

Do not add lore, tarot, multi-screen map, villages, resources, or visual polish.

---

## Observed problem from V0.2

V0.2 fixed early Human extinction, but the system is still not interesting.

Observed from exported recordings:

```text
Humans survive, but mostly stabilize as a small cluster.
Beasts and Spirits grow explosively.
The map converges toward large stable WILD / MARK regions.
Changing numeric parameters still tends to produce the same attractor.
```

Example:

```text
At tick 111:
H = 43
B = 283
S = 195
F = 49
W = 415
M = 281
```

At tick 148:

```text
H = 34
B = 273
S = 264
F = 36
W = 396
M = 407
```

The problem is not that one species instantly dies.  
The problem is that Beast and Spirit population growth is too easy, while movement and death rules do not create enough local tension.

---

## V0.3 goal

Adjust only:

```text
movement
reproduction
death / overcrowding
diagnostic export
```

Do not add new world concepts.

The goal is:

```text
Reduce Beast / Spirit population explosion.
Preserve all three species longer.
Make local boundaries move instead of freezing into static regions.
Make reproduction depend on local room and ecological pressure, not just terrain.
```

---

## Core design idea

Reproduction should require not only the right terrain and parent count, but also:

```text
local empty space
low local crowding
species-specific support condition
```

Movement should not constantly collapse units into dense clusters.

Death should punish Beast / Spirit overpopulation in areas with no relevant target or pressure.

---

## Required rule changes

### Change 1: Add local counting helpers

Add or reuse helper functions to compute for each cell:

```js
h = neighboring Humans
b = neighboring Beasts
s = neighboring Spirits
f = neighboring FIELD terrains
w = neighboring WILD terrains
m = neighboring MARK terrains
emptyUnitNeighbors = neighboring cells with no unit and not BLOCK and not BORDER
localUnitCount = h + b + s
```

Use these for reproduction and overpopulation.

---

## Change 2: Reproduction requires local room

Add a general reproduction gate:

```text
A new unit can spawn only if:
emptyUnitNeighbors >= minEmptyNeighborsForBirth
and localUnitCount <= maxLocalUnitsForBirth
```

Default params:

```text
minEmptyNeighborsForBirth = 3
maxLocalUnitsForBirth = 4
```

Expose these as sliders if easy.  
If not, constants are acceptable.

This applies to Human, Beast, and Spirit reproduction.

---

## Change 3: Human reproduction V0.3

Old Human reproduction:

```text
empty cell
terrain is FIELD
neighboring Human count is 2 or 3
spiritPressure < 2
```

New Human reproduction:

```text
cell has no unit
terrain is FIELD
neighboring Human count is 2 or 3
spiritPressure < 2
emptyUnitNeighbors >= 2
localUnitCount <= 5
neighboring Beast count <= 1
```

Reason:

```text
Humans should reproduce in supported fields,
but not directly inside heavy Beast pressure.
```

Human reproduction is allowed to be slightly easier than Beast/Spirit because Humans are currently the weakest expansion force.

---

## Change 4: Beast reproduction V0.3

Old Beast reproduction:

```text
cell has no unit
terrain is WILD
neighboring Beast count is exactly 3
neighboring Human count < 2
```

New Beast reproduction:

```text
cell has no unit
terrain is WILD
neighboring Beast count is exactly 3
neighboring Human count == 0
emptyUnitNeighbors >= 3
localUnitCount <= 4
```

Additional Beast-specific support condition:

```text
At least one of the following must be true:
- neighboring FIELD count >= 1
- neighboring MARK count >= 1
- neighboring EMPTY terrain count >= 2
```

Reason:

```text
Beasts should expand at active edges:
toward fields, marks, or open ground.
They should not endlessly reproduce deep inside stable WILD blobs.
```

---

## Change 5: Spirit reproduction V0.3

Old Spirit reproduction:

```text
cell has no unit
terrain is MARK
neighboring Spirit count is exactly 2
neighboring Beast count < 2
```

New Spirit reproduction:

```text
cell has no unit
terrain is MARK
neighboring Spirit count is exactly 2
neighboring Beast count == 0
emptyUnitNeighbors >= 3
localUnitCount <= 4
```

Additional Spirit-specific support condition:

```text
At least one of the following must be true:
- neighboring Human count >= 1
- neighboring FIELD count >= 1
- neighboring EMPTY terrain count >= 2
```

Reason:

```text
Spirits should spread near human pressure, fields, or open space.
They should not endlessly reproduce deep inside stable MARK blobs.
```

---

## Change 6: Movement should avoid over-clumping

Before a unit moves into a target cell, estimate same-species neighbors at the target.

Do not move into a target if:

```text
sameSpeciesNeighborsAtTarget >= overcrowdingThreshold - 1
```

With default overcrowdingThreshold = 6, this means:

```text
Do not move into a cell that would have 5 or more same-species neighbors.
```

Reason:

```text
This prevents Beast and Spirit from collapsing into dense, explosive breeding blobs.
```

---

## Change 7: Add species stay behavior

Units should not move every tick if already in a good position.

### Human stay

Human stays if:

```text
current terrain is FIELD
and neighboring Human count >= 1
```

This may already exist. Keep it.

### Beast stay

Beast stays if:

```text
current terrain is WILD
and neighboring Beast count >= 1
and neighboring FIELD count == 0
and neighboring MARK count == 0
```

Reason:

```text
Beast only actively moves when there is something to raid or suppress nearby.
```

### Spirit stay

Spirit stays if:

```text
current terrain is MARK
and neighboring Spirit count >= 1
and neighboring Human count == 0
and neighboring FIELD count == 0
```

Reason:

```text
Spirit only actively moves when there is human pressure or field nearby.
```

If using random movement, this can be implemented as a high stay weight.
If using deterministic priority, simply allow stay before searching target.

---

## Change 8: Beast overpopulation death

Keep general overcrowding death:

```text
sameSpeciesNeighbors >= overcrowdingThreshold
```

Add Beast-specific overpopulation rule:

```text
If Beast has neighboring Beast count >= 5
and neighboring FIELD count == 0
and neighboring MARK count == 0:
    Beast dies
```

Reason:

```text
Dense Beast populations without prey / target pressure collapse.
This is more intuitive than terrain exhaustion.
```

---

## Change 9: Spirit overpopulation death

Add Spirit-specific overpopulation rule:

```text
If Spirit has neighboring Spirit count >= 5
and neighboring Human count == 0
and neighboring FIELD count == 0:
    Spirit disappears
```

Reason:

```text
Dense Spirit populations without human / field pressure fade.
Spirit should be parasitic / reactive, not self-sufficient forever.
```

This is not a new lore system.  
It is a local population rule.

---

## Change 10: Require event counters in JSON export

Update JSON recording to include per-tick event counters.

Each frame should include:

```js
events: {
  births: { H: 0, B: 0, S: 0 },
  deaths: { H: 0, B: 0, S: 0 },
  conversions: { H_to_S: 0 },
  terrainChanges: {
    EMPTY_to_FIELD: 0,
    WILD_to_FIELD: 0,
    EMPTY_to_WILD: 0,
    FIELD_to_WILD: 0,
    MARK_to_WILD: 0,
    EMPTY_to_MARK: 0,
    FIELD_to_MARK: 0,
    WILD_to_MARK: 0,
    FIELD_to_EMPTY: 0,
    WILD_to_EMPTY: 0,
    MARK_to_EMPTY: 0,
    BORDER_to_EMPTY: 0
  }
}
```

If exact terrain change tracking is too expensive, implement at least:

```js
events: {
  births: { H, B, S },
  deaths: { H, B, S },
  conversions: { H_to_S }
}
```

Reason:

```text
Counts alone show the result.
Events show why the result happened.
```

---

## Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Set version:

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.3_POPULATION_DYNAMICS
```

Add note:

```text
V0.3 rejects DEPLETED terrain.
V0.3 focuses on reproduction, movement, and overpopulation tuning.
```

---

## Expected result

After V0.3:

```text
Beast and Spirit should grow more slowly.
B/S should not endlessly reproduce deep inside their own terrain blobs.
Humans should remain alive, but not become a static island forever.
Boundaries should continue moving at edges.
Population curves should show more fluctuation.
```

---

## Test target

Run default simulation for:

```text
0-200 ticks
```

Export recording JSON.

Check:

```text
At tick 100:
- H > 0
- B > 0
- S > 0
- F > 0
- No unit type should exceed 45% of all non-BLOCK cells.
- B/S births should not remain extremely high after their regions stabilize.
```

If this fails, still export the recording and report what failed.

---

## Do not do

Do not implement DEPLETED terrain.
Do not add new terrain.
Do not add multi-screen map.
Do not add tarot.
Do not add lore.
Do not add resources.
Do not change art direction.

---

## Completion report

Report:

```text
files changed
exact rules changed
new parameters added
whether event counters are implemented
how to run
how to export a 0-200 tick recording
any simplifications
```
