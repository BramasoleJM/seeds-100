# CODEX_V0_8_ASYMMETRIC_ECOLOGY_REBASE_PROMPT.md

Copy this single prompt into Codex.

This is a conceptual rebase after V0.7.1.

Do not treat this as a small tuning pass.

---

# Read first

Read these files first if they exist:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
CODEX_V0_7_ROT_MIGRATION_REBASE_PROMPT.md
CODEX_V0_7_1_ROT_CONTAINMENT_COMBINED_PROMPT.md
```

Act as Executor.

Set rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.8_ASYMMETRIC_ECOLOGY_REBASE
```

---

# Why V0.8 exists

Recent recordings show that V0.7.1 still does not match the intended world behavior.

Observed failures:

```text
1. Humans still die too early in many runs.
2. Human migration exists in diagnostics but often does not become a visible world pattern.
3. Human settlements are too fragile internally.
4. Beasts are still treated too much like a normal population that can die.
5. Beast death creates Spirit in some runs, which contradicts Beast's ecological role.
6. Spirits still eat into Human settlements too quickly.
7. Humans, Beasts, and Spirits all form clustered blobs, making the map feel like competing colonies.
8. Beasts and WILD should feel more scattered and mobile.
```

Important conceptual correction:

```text
Do not treat Human / Beast / Spirit as three symmetric species.
```

New roles:

```text
Human = high reproduction, settlement, expansion, migration, land use.
Beast = scattered mobile natural recovery force; not a normal mortal population.
Spirit = short-lived disease/rot outbreak mainly caused by Human failure/death.
```

The intended ecology:

```text
Humans spread and form settlements.
Settlements consume land fertility.
Strong settlements send migrants outward.
Weak/haunted settlements send refugees outward.
Beasts wander, restore WILD/fertility, and clean rot/spirit.
Spirits emerge from Human death and failure, threaten isolated or edge Humans, and leave MARK trails.
```

---

# Hard constraints

Do not add corpse overlay.

Do not add new visible terrain.

Do not add DEPLETED terrain.

Do not restore 0-100 fertility as rule basis.

Do not add economy/resources/buildings/multi-screen map/tarot/lore text.

Do not make Beast a complex optimizer.

Do not make Spirit a normal reproducing species.

Do not make MARK spawn Spirit by default.

Do not remove custom initialization controls.

---

# Core entities

Units:

```text
H = Human
B = Beast
S = Spirit
```

Terrains:

```text
. = EMPTY
F = FIELD
W = WILD
M = MARK
X = BORDER, optional / legacy
# = BLOCK
```

Hidden fields:

```js
fertilityLevel[y][x]  // integer 0-4
unitAge[y][x]         // H/S only required; B may not need aging
unitRole[y][x]        // "normal" | "settler_seeking" | "settler_resting"
terrainAge[y][x]      // especially for MARK decay
```

Fertility levels:

```text
0 = barren
1 = poor
2 = ordinary
3 = fertile
4 = abundant
```

Core meanings:

```text
FIELD is Human-organized land. It inherits fertility and usually reduces it by 1 when created.
WILD is naturally fertile land, usually maintained or restored by Beasts.
MARK is passive rot/spirit trace. It blocks Human use, attracts Beasts, and decays/gets cleaned.
SPIRIT is active short-lived disease/rot created mostly by Human death/failure.
```

---

# Part A — Role asymmetry

## A1. Humans are the expansion species

Humans should:

```text
reproduce more strongly than before
form settlements
create FIELD
consume local fertility
send migrants when prosperous
send refugees when pressured
be resistant in settlement cores
be vulnerable when isolated / at edges / migrating alone
```

Humans should not be a fragile species that disappears before migration matters.

## A2. Beasts are natural recovery agents, not a mortal population

Beasts should:

```text
not naturally die
not become Spirit when removed
wander mostly randomly
stay scattered
restore fertility and WILD
clean MARK and Spirit
flee dense Human groups
```

Beasts should feel like mobile nature, not a competing civilization.

## A3. Spirits are short-lived outbreaks from Human failure

Spirits should:

```text
mainly come from Human death / Human infection / settlement collapse
not come from Beast death
not spawn from MARK by default
move briefly and leave MARK trails
threaten isolated or edge Humans
struggle against settlement cores
be cleaned by Beasts
```

Spirits should be local pulses, not permanent colonies.

---

# Part B — Beast rebase

This is one of the most important changes.

## B1. Remove Beast natural death

Disable:

```text
beastBaselineDeathChance
beastOldAgeDeathChance
beastMaxAge death logic
```

Beasts should not die from aging.

If unitAge is still tracked for Beasts, it should not kill them.

## B2. Beast removal becomes dispersal, not death

When a Beast would previously die due to Human pressure / conflict / being surrounded:

```text
do not create Spirit
do not create MARK
```

Instead perform Beast dispersal:

```text
remove B from current cell
terrain -> WILD
fertilityLevel = 4
clean nearby M/S
```

Suggested local cleanup:

```text
For each adjacent cell:
    if terrain == MARK:
        with probability 0.5, terrain -> WILD and fertilityLevel = min(fertilityLevel + 1, 4)

    if unit == S:
        with probability 0.7, remove S and terrain -> WILD and fertilityLevel = min(fertilityLevel + 1, 4)
```

Track:

```js
beastDispersals
beastDispersalWildCreated
beastDispersalMarksCleaned
beastDispersalSpiritsSuppressed
```

Concept:

```text
A Beast never feeds rot.
If a Beast is driven away, nature flows back into the cell.
```

## B3. Beast does not create Spirit

Remove / disable:

```text
spiritsCreatedByBeastDeath
```

or keep diagnostic but it should remain 0.

Rules:

```text
Human death can create Spirit.
Beast death/dispersal never creates Spirit.
```

## B4. Beast movement: random walk first

Beast behavior priority:

```text
1. If 2+ Humans nearby:
    flee / disperse away from Humans.

2. Else if adjacent Spirit:
    suppress / move into Spirit.

3. Else if visible Spirit within radius 3:
    50% move toward Spirit, 50% random walk.

4. Else if clustered MARK within radius 2:
    40% move toward clustered MARK, 60% random walk.

5. Else:
    random walk.
```

Important:

```text
Most Beast movement should still be random walk.
```

If no target exists:

```text
beastRandomMoves should dominate.
```

## B5. Beast anti-clustering

Beasts should not form large blobs.

When choosing a random move, add a mild anti-cluster bias:

```text
If target cell would have 3+ Beast neighbors:
    strongly avoid it.

If current Beast has 3+ Beast neighbors:
    prefer moves that reduce neighboring Beast count.
```

Do not make this too smart. It is only a dispersion pressure.

## B6. Beast restores fertility and WILD lightly

When Beast moves through EMPTY or WILD:

```text
with probability 0.35:
    fertilityLevel += 1, max 4
```

When Beast moves through EMPTY with fertilityLevel >= 3:

```text
with probability 0.18:
    terrain -> WILD
```

When Beast moves through WILD:

```text
maintain / raise fertility toward 4
```

When Beast moves through FIELD:

```text
with probability 0.18:
    FIELD -> WILD
    fertilityLevel = min(fertilityLevel + 1, 4)
```

This should create scattered WILD trails, not giant WILD blocks.

## B7. Beast reproduction: rare and spatially dispersed

Condition:

```text
target cell empty
terrain WILD or EMPTY
fertilityLevel >= 3
neighboring Beast count is 1 or 2
neighboring Human count == 0
local Beast count radius 3 <= 4
random < beastBirthChance
```

Default:

```text
beastBirthChance = 0.02
```

This keeps Beasts present but dispersed.

---

# Part C — WILD initialization and distribution

WILD should be more scattered.

Change initial generation:

```text
Use smaller WILD patches.
Add scattered WILD cells.
Avoid one huge WILD blob.
```

Suggested:

```text
WILD patches radius: 1-3
number of WILD patches can remain 5, but each should be smaller.
Add 60-120 scattered WILD cells depending on map size / preset.
Scattered WILD cells should have fertilityLevel 3-4.
```

Beast placement:

```text
70% of Beasts placed as isolated individuals
30% placed in small groups of 2-3
avoid placing Beasts into large clusters
avoid placing more than 3 Beasts within radius 3 during initialization
```

This should make Beasts feel like roaming animals rather than a faction.

---

# Part D — Human rebase: stronger reproduction and visible migration

Humans must be able to form several settlements before collapse.

## D1. Human reproduction is stronger

Human birth should be easier in healthy settlements.

Birth condition:

```text
target cell has no unit
target terrain is FIELD
target fertilityLevel >= 2
neighboring Human count is 2 or 3
neighboring Beast count <= 1
neighboring Spirit count == 0
local condition is surplus or balanced
random < humanBirthChance
```

Default:

```text
humanBirthChance = 0.22
```

If local condition is surplus:

```text
birth chance can be 0.28
```

If balanced:

```text
birth chance can be 0.12
```

No birth in collapse.

Very low birth in pressured:

```text
0.04
```

## D2. Overgrowth produces migrants, not only local population

When a settlement is healthy and populous:

```text
FIELD core count >= 5
Human count in radius / settlement >= 8
avg FIELD fertility >= 2
local condition surplus or strong balanced
```

then it may produce migrants.

There are two migration types:

```text
prosperity migration
crisis migration
```

## D3. Prosperity migration

Prosperity migration should happen before collapse.

Condition:

```text
local condition is surplus
local Human count >= 8
FIELD count radius 2/3 >= 5
random < prosperityMigrationChance
```

Default:

```text
prosperityMigrationChance = 0.06 per eligible settlement area per tick
```

Effect:

```text
choose 1-2 edge Humans and set role = settler_seeking
```

If settlement is very strong:

```text
with probability 0.35, create one extra Human settler at settlement edge
```

This is the one case where migration can create an extra Human, because Human identity includes strong reproduction/expansion.

Track separately:

```js
prosperitySettlerDepartures
prosperitySettlerBirths
```

## D4. Crisis migration

Condition:

```text
local condition is pressured or collapse
or nearby Spirit >= 1
or nearby MARK >= 2
or avg FIELD fertility <= 1.5
```

Effect:

```text
choose 1-3 edge Humans and set role = settler_seeking
```

Do not spawn extra Humans in crisis migration.

Track:

```js
crisisSettlerDepartures
```

## D5. Migration party behavior

Settlers should be more visible and more survivable.

If a settlement sends migrants:

```text
prefer party size 2
if settlement Human count >= 12, party size may be 3
```

Settler parties should prefer staying near other settlers:

```text
settler movement gets small bonus for moving adjacent to another settler
```

Do not make them stuck together, just loosely grouped.

Settler infection resistance:

```text
If settler has 1+ adjacent settler/H:
    reduce Spirit infection chance by 50%
```

## D6. Settler seeking target

Settlers should actively seek Beast-restored fertile land.

Target priority:

```text
1. WILD fertility 4
2. WILD fertility 3
3. EMPTY fertility 4
4. EMPTY fertility 3
```

Avoid:

```text
MARK
adjacent Spirit
2+ Beast neighbors
```

A single Beast nearby should not block founding.

Vision radius:

```text
settlerVisionRadius = 6
```

If no good target:

```text
move toward EMPTY fertility 1-2 and rest
```

## D7. Settler resting

If no high-fertility target is visible:

```text
settler may rest on EMPTY fertility 1-2
```

Resting:

```text
Every 5 ticks:
    fertilityLevel -= 1, min 0
```

When fertility becomes 0:

```text
return to settler_seeking
```

## D8. Settlement founding

Founding condition:

```text
terrain WILD or EMPTY
fertilityLevel >= 3
no adjacent Spirit
no adjacent MARK
neighboring Beast count <= 1
settlerAge >= 3
```

On founding:

```text
terrain -> FIELD
fertilityLevel -= 1
role -> normal
settlementFoundings += 1
```

Seed field bonus:

```text
if adjacent EMPTY/WILD fertility >= 2 and no M/S:
    with probability 0.5 create 1 extra FIELD
```

Do not require neighboring Human for first founding.

Growth after founding still requires Humans and support.

---

# Part E — Human settlement support

Support must detect danger earlier but should not classify everything as collapse.

Use local radius 2 or component approximation.

Support:

```text
support =
    2.0 * sum fertilityLevel of FIELD cells in radius 2
  + 0.35 * sum fertilityLevel of adjacent WILD / EMPTY cells in radius 2
  - 3 * count MARK cells in radius 2
  - 5 * count Spirit units in radius 2
```

Demand:

```text
demand = local Human count in radius 2 * 2
```

Condition:

```text
surplus:
    support >= demand * 1.25
    and FIELD count radius 2 >= 3
    and avg FIELD fertility >= 2

balanced:
    support >= demand * 0.8

pressured:
    support >= demand * 0.5

collapse:
    support < demand * 0.5
```

Important:

```text
A settlement can still be balanced even with nearby MARK.
A nearby Spirit should push toward pressured / crisis migration.
```

---

# Part F — Human core resistance to Spirit

This is critical.

Spirit should not convert settlement cores.

For each Human, classify:

```text
coreHuman if:
    neighboring Human count in radius 1 >= 3
    and FIELD count in radius 1 >= 3

edgeHuman if:
    neighboring Human count in radius 1 is 1-2
    or FIELD count is 1-2

isolatedHuman if:
    neighboring Human count == 0
```

Spirit infection:

```text
if coreHuman:
    infectionChance = 0
    instead add migration/retreat pressure

if edgeHuman:
    infectionChance = 0.06

if isolatedHuman:
    infectionChance = 0.24

if Human role is settler and no adjacent settler/H:
    infectionChance = 0.20

if settler has adjacent settler/H:
    infectionChance *= 0.5
```

Modifiers:

```text
if local condition is collapse:
    infectionChance *= 1.5

if local condition is surplus/balanced:
    infectionChance *= 0.5

cap infectionChance at 0.30
```

On failed infection near core/edge:

```text
increase migration pressure / retreat pressure
```

Track:

```js
spiritBlockedByCoreSettlement
humanRetreatsFromSpirit
```

---

# Part G — Human death creates Spirit, but not always

Human death should not always create active Spirit.

Rules:

```text
If H dies due to Spirit infection:
    40% create S
    60% create MARK

If H dies due to natural death:
    20% create S
    80% create MARK

If H dies due to Beast/conflict/other:
    25% create S
    75% create MARK
```

When creating S:

```text
place S at death cell
S age = 0
S maxAge = random 4-7
```

When creating MARK:

```text
terrain -> MARK
terrainAge = 0
```

Track:

```js
spiritsCreatedByHumanDeath
humanDeathsToMark
humanDeathsToSpirit
```

This prevents one death from always becoming a strong outbreak.

---

# Part H — Spirit behavior

Spirit remains short-lived.

## H1. Spirit does not spawn from MARK

Ensure:

```text
spiritSpawnChanceFromMark = 0
spiritSpawnsFromMark = 0
```

unless rare debug mode is explicitly enabled.

## H2. Spirit lifespan

```text
spiritMaxAge = random 4-7
```

If adjacent to Beast:

```text
age += 2
```

If 2+ adjacent Beasts:

```text
remove S
```

## H3. Spirit movement and MARK trail

S moves at most once per tick.

On movement:

```text
old cell -> MARK
terrainAge = 0
spiritTrailMarksCreated += 1
```

S movement priority:

```text
1. isolated Human
2. edge Human
3. FIELD edge
4. non-MARK low-fertility land
5. random valid cell
```

Restrictions:

```text
avoid high-fertility WILD >= 3 unless adjacent Human/FIELD
avoid cells adjacent to 2+ Beasts
do not enter BLOCK
```

## H4. Spirit cannot convert too much terrain

Do not allow S to convert an extra cell without moving.

No area-of-effect MARK creation.

No automatic radial filling.

The trail is the spread.

---

# Part I — MARK behavior

MARK is passive residue.

It should:

```text
block Human founding
increase migration pressure
attract Beasts only if clustered or nearby active S
decay over time
be cleaned by Beasts
```

MARK does not create S.

Decay:

```text
markMinLifetime = 15
markPassiveDecayChance = 0.04 after min lifetime
markLowFertilityDecayChance = 0.10 if fertility <= 1 and age >= 8
```

Beast cleaning:

```text
B enters MARK:
    MARK -> WILD
    fertilityLevel = min(fertilityLevel + 2, 4)
```

Track:

```js
marksDecayed
marksCleanedByBeast
```

---

# Part J — Initialization presets

Keep existing custom controls.

Update placement to be more scattered.

## Balanced Asymmetric Ecology Test

```text
H = 32
B = 18
S = 0
FIELD patches = 3
WILD patches = 5 small patches
MARK patches = 1
BLOCK = 20
```

## Human Expansion Test

```text
H = 36
B = 14
S = 0
FIELD patches = 3
WILD patches = 6 small patches + scattered WILD
MARK patches = 0
BLOCK = 20
```

## Human Migration Test

```text
H = 36
B = 10
S = 0
FIELD patches = 2
WILD patches = 6 small patches + scattered WILD
MARK patches = 1
BLOCK = 20
```

## Beast Dispersion Test

```text
H = 0
B = 30
S = 0
FIELD patches = 0
WILD patches = 8 small patches + scattered WILD
MARK patches = 0
BLOCK = 20
```

## Spirit Outbreak Test

```text
H = 36
B = 12
S = 2
FIELD patches = 4
WILD patches = 4
MARK patches = 2
BLOCK = 20
```

Reset behavior remains:

```text
Reset restores last generated initial state.
Randomize generates new initial state.
Apply Initial Settings regenerates using UI values.
```

---

# Part K — Diagnostics

Update JSON events.

Required events:

```js
events: {
  births: { H, B, S },
  deaths: { H, B, S },

  humanDeathsToSpirit: 0,
  humanDeathsToMark: 0,
  spiritsCreatedByHumanDeath: 0,
  spiritsCreatedByBeastDeath: 0,   // should remain 0
  spiritsCreatedByConversion: 0,

  beastDispersals: 0,
  beastDispersalWildCreated: 0,
  beastDispersalMarksCleaned: 0,
  beastDispersalSpiritsSuppressed: 0,

  conversions: { H_to_S: 0 },
  spiritBlockedByCoreSettlement: 0,
  humanRetreatsFromSpirit: 0,

  spiritTrailMarksCreated: 0,
  spiritDiedIntoMark: 0,
  spiritSuppressedByBeast: 0,

  marksCreatedBySpirit: 0,
  marksCleanedByBeast: 0,
  marksDecayed: 0,

  fieldCreated: 0,
  fieldDecayed: 0,
  fieldTrampled: 0,

  prosperitySettlerDepartures: 0,
  prosperitySettlerBirths: 0,
  crisisSettlerDepartures: 0,
  settlerMoves: 0,
  settlerRestStops: 0,
  settlementFoundings: 0,

  beastRandomMoves: 0,
  beastFleeMoves: 0,
  beastAttractedMoves: 0,
  beastBlockedMoves: 0,
  beastStallBreakMoves: 0
}
```

Diagnostics:

```js
diagnostics: {
  humanLocalConditions: {
    surplus: 0,
    balanced: 0,
    pressured: 0,
    collapse: 0
  },

  coreHumans: 0,
  edgeHumans: 0,
  isolatedHumans: 0,

  activeSettlers: 0,
  activeRestingSettlers: 0,
  activeProsperitySettlers: 0,
  activeCrisisSettlers: 0,

  avgHumanSupport: 0,
  avgHumanDemand: 0,

  markCellsNearHumans: 0,
  spiritCellsNearHumans: 0,
  humansAdjacentToSpirit: 0,
  humansAdjacentToMark: 0,

  beastNeighborStats: {
    isolated: 0,
    smallGroup: 0,
    clustered: 0
  },

  scatteredWildCells: 0,
  largestWildClusterSize: 0
}
```

Important:

```text
spiritsCreatedByBeastDeath should stay 0.
spiritSpawnsFromMark should stay 0.
```

---

# Part L — Expected behavior

After V0.8:

```text
Humans should usually survive past tick 100 in balanced seeds.
Humans should visibly reproduce and expand.
Human migration should happen both during prosperity and crisis.
Multiple FIELD settlements should appear.
Some settlements may collapse, but not all immediately.
Beasts should remain scattered and mobile.
WILD should appear as scattered patches/trails, not only huge blobs.
Beasts should not naturally die.
Beast dispersal should clean/restore, not create Spirit.
Spirit should mainly emerge from Human death/failure.
Spirit should threaten isolated / edge Humans, not instantly eat settlement cores.
MARK should be passive and decay/clean.
```

Failure signs:

```text
H extinction before tick 30 in balanced runs.
spiritsCreatedByBeastDeath > 0.
spiritSpawnsFromMark > 0.
beastRandomMoves near 0 for long periods.
largestWildCluster dominates whole map too early.
no settlementFoundings despite activeSettlers.
activeSettlers never appears before crisis.
```

---

# Part M — Test checklist

Run and export:

```text
Balanced Asymmetric Ecology Test 0-250
Human Expansion Test 0-250
Human Migration Test 0-250
Beast Dispersion Test 0-150
Spirit Outbreak Test 0-150
```

Check:

```text
1. H survives >100 ticks in most balanced seeds.
2. H births are meaningfully higher than before.
3. prosperitySettlerDepartures > 0 before collapse.
4. settlementFoundings > 0 in Human Expansion / Migration tests.
5. Beasts remain present without natural death.
6. spiritsCreatedByBeastDeath == 0.
7. beastDispersals create WILD/fertility and clean M/S.
8. beastRandomMoves remains high.
9. Beast clustering is reduced.
10. WILD distribution is more scattered.
11. coreHumans resist Spirit conversion.
12. Spirit outbreaks remain local.
```

---

# Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add note:

```text
V0.8 Asymmetric Ecology Rebase:
- Human, Beast, Spirit are no longer symmetric species.
- Human is the reproductive settlement/migration species.
- Beast is a dispersed natural recovery agent, with no natural death.
- Beast removal becomes dispersal/return-to-wild, not Spirit creation.
- Spirit mainly comes from Human death/failure and attacks isolated/edge Humans.
- Settlement cores resist Spirit.
- Prosperity migration creates visible expansion before crisis.
- WILD and Beasts are initialized and maintained in a more scattered pattern.
```

---

# Completion report

When finished, report:

```text
files changed
rules version
bug fixes
Human rule changes
Beast rule changes
Spirit rule changes
initialization changes
diagnostic changes
tests run
known issues
```
