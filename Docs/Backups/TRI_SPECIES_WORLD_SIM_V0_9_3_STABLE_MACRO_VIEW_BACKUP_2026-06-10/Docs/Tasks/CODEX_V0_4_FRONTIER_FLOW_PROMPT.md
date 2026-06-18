# CODEX_V0_4_FRONTIER_FLOW_PROMPT.md

Copy this prompt into Codex to implement V0.4 frontier-flow patch.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Act as Executor.

Do not implement DEPLETED / exhaustion terrain.

Do not add new terrain types.

Do not add lore, tarot, multi-screen map, villages, resources, or visual polish.

---

## Observed problem from V0.3

V0.3 reduced explosive population growth, but the system now easily falls into a deadlock / frozen attractor.

Example snapshot at tick 64:

```text
H = 63
B = 36
S = 95

F = 67
W = 72
M = 161
X = 0
```

Spatial observation:

```text
Humans and Spirits are packed into one mixed region.
Beasts are separated into another region.
There are almost no active conflict borders.
BORDER count is 0.
The system looks alive in counts, but rule triggers are mostly exhausted.
```

The issue is not extinction.  
The issue is that reproduction, death, and conflict can all become inactive at the same time.

---

## V0.4 goal

Create movement and reproduction at edges without returning to explosive growth.

The system should not depend on terrain exhaustion.

Instead, it should produce continuous motion through:

```text
frontier detection
edge-biased reproduction
scouting movement
diagnostic counters
```

---

## Key design idea

Units deep inside their own terrain should mostly stay.

Units at borders or near empty space should act.

```text
Interior = stable
Frontier = active
```

This should create moving edges instead of frozen blobs.

---

## Definitions

Add helper functions.

### Terrain affinity

```js
homeTerrainForUnit = {
  H: "F",
  B: "W",
  S: "M"
}
```

### Frontier cell

A unit is on a frontier if at least one of these is true:

```text
1. It has an enemy/counter unit in its 8-neighborhood.
2. It has a non-home terrain in its 8-neighborhood, excluding BLOCK.
3. It has at least 2 EMPTY terrain cells in its 8-neighborhood.
```

Species-specific frontier targets:

```text
Human frontier:
- neighboring EMPTY
- neighboring WILD
- neighboring MARK
- neighboring Beast or Spirit

Beast frontier:
- neighboring FIELD
- neighboring MARK
- neighboring EMPTY
- neighboring Human or Spirit

Spirit frontier:
- neighboring FIELD
- neighboring EMPTY
- neighboring Human
```

---

## Required rule changes

## Change 1: Replace absolute stay behavior with frontier-aware stay

Current stay behavior makes units too static.

New rule:

```text
A unit may stay automatically only if it is NOT on a frontier.
```

If a unit is on a frontier, it should evaluate movement.

### Human stay

Old:

```text
Human stays if current terrain is FIELD and neighboring Human count >= 1.
```

New:

```text
Human stays if:
current terrain is FIELD
and neighboring Human count >= 1
and Human is not on frontier
```

### Beast stay

Old:

```text
Beast stays if current terrain is WILD
and neighboring Beast count >= 1
and neighboring FIELD count == 0
and neighboring MARK count == 0
```

New:

```text
Beast stays if:
current terrain is WILD
and neighboring Beast count >= 1
and Beast is not on frontier
```

### Spirit stay

Old:

```text
Spirit stays if current terrain is MARK
and neighboring Spirit count >= 1
and neighboring Human count == 0
and neighboring FIELD count == 0
```

New:

```text
Spirit stays if:
current terrain is MARK
and neighboring Spirit count >= 1
and Spirit is not on frontier
```

---

## Change 2: Add low-probability scouting movement

If a unit is not on a frontier and would otherwise stay, it may still scout with a low probability.

Default:

```text
scoutChance = 0.06
```

Expose as slider if easy.

Scouting target:

```text
Human: adjacent EMPTY first, then WILD.
Beast: adjacent EMPTY first, then WILD.
Spirit: adjacent EMPTY first, then MARK.
```

Restrictions:

```text
Do not scout into BLOCK or BORDER.
Do not scout into occupied cells.
Do not scout if target would produce same-species neighbors >= overcrowdingThreshold - 1.
```

Reason:

```text
This prevents permanent frozen interiors without introducing new terrain.
```

---

## Change 3: Reproduction should happen at frontiers only

Reproduction should not happen deep inside stable blobs.

Add shared condition:

```text
birth cell must be adjacent to at least one frontier signal
```

Frontier signal by species:

### Human birth frontier signal

At least one neighboring terrain/unit:

```text
EMPTY
WILD
MARK
Beast
Spirit
```

### Beast birth frontier signal

At least one neighboring terrain/unit:

```text
EMPTY
FIELD
MARK
Human
Spirit
```

### Spirit birth frontier signal

At least one neighboring terrain/unit:

```text
EMPTY
FIELD
Human
```

---

## Change 4: Human reproduction V0.4

Human reproduction should be slightly more resilient.

New rule:

```text
cell has no unit
terrain is FIELD
neighboring Human count is 2, 3, or 4
spiritPressure < 3
neighboring Beast count <= 1
emptyUnitNeighbors >= 2
localUnitCount <= 6
has Human birth frontier signal
```

Reason:

```text
Humans should be able to slowly refill field edges.
```

---

## Change 5: Beast reproduction V0.4

Beast reproduction should happen at active edges, not deep WILD interiors.

New rule:

```text
cell has no unit
terrain is WILD
neighboring Beast count is 2 or 3
neighboring Human count <= 1
neighboring Spirit count <= 2
emptyUnitNeighbors >= 2
localUnitCount <= 5
has Beast birth frontier signal
```

Reason:

```text
Beast can regrow at active wild edges,
but does not explode in dense interiors.
```

---

## Change 6: Spirit reproduction V0.4

Spirit reproduction should happen near Human / FIELD / open-space pressure.

New rule:

```text
cell has no unit
terrain is MARK
neighboring Spirit count is 2 or 3
neighboring Beast count <= 1
emptyUnitNeighbors >= 2
localUnitCount <= 5
has Spirit birth frontier signal
```

Reason:

```text
Spirit can regrow at active marked edges,
but does not endlessly multiply in closed MARK interiors.
```

---

## Change 7: Conflict should create visible borders again

In the tick 64 deadlock, BORDER count is 0.

We need conflict zones to become visible.

Add terrain-border reaction after movement and before reproduction:

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

Do not create BORDER on BLOCK.

BORDER decay rule remains:

```text
If BORDER no longer has at least two different unit types nearby:
    BORDER -> EMPTY
```

Reason:

```text
Even when units do not directly kill each other,
their pressure should make the contested edge visible.
```

---

## Change 8: Add anti-deadlock diagnostics to JSON export

Each frame should include diagnostics:

```js
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

At minimum implement:

```js
birthCandidates
actualBirths
actualDeaths
actualMoves
frontierUnits
```

Reason:

```text
Counts alone show that the system is frozen.
Diagnostics show why it is frozen.
```

---

## Expected result

After V0.4:

```text
No species should explode immediately.
No species should become completely static by tick 60.
There should be nonzero birth candidates in most mid-game frames.
There should be nonzero actual moves in most frames.
BORDER should sometimes appear near contested edges.
Beast and Spirit should not become separate isolated backgrounds forever.
```

---

## Test target

Run default simulation:

```text
0-200 ticks
```

Export recording JSON.

Check at tick 100 and tick 200:

```text
H > 0
B > 0
S > 0
F > 0
W > 0
M > 0
birthCandidates total > 0
actualMoves total > 0
```

If a deadlock occurs, export the JSON anyway.

Deadlock definition:

```text
For 20 consecutive ticks:
actualBirths total == 0
actualDeaths total == 0
actualMoves total is very low or 0
terrain counts barely change
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
Rules version: TRI_SPECIES_WORLD_SIM_V0.4_FRONTIER_FLOW
```

Add note:

```text
V0.4 rejects DEPLETED terrain.
V0.4 adds frontier-aware movement, scouting, frontier births, visible border pressure, and anti-deadlock diagnostics.
```

---

## Do not do

Do not add DEPLETED terrain.
Do not add new terrain types.
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
diagnostics added to JSON
how to run
how to export a 0-200 tick recording
any simplifications
```
