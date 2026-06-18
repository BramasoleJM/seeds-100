# CODEX_V0_6_FERTILITY_MIGRATION_PROMPT.md

Copy this prompt into Codex to implement the V0.6 fertility + migration experiment.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Act as Executor.

This version combines the current lifecycle/group-behavior model with a new underlying fertility field.

Do not implement DEPLETED terrain.

Do not add Zelda-style multi-screen map.

Do not add tarot, lore text, villages, buildings, economy, or resource UI.

---

## Design diagnosis

The current system has started to show emergence, but it still fails the target image.

Observed issues:

```text
1. Population can still become too high.
2. Humans still expand by filling space rather than forming small settlements.
3. Settlers are not strongly guided toward meaningful new places.
4. Beasts do not yet have a clear systemic identity beyond roaming / terrain conversion.
5. Spirits still need a distinct ecological role.
```

We now introduce fertility as an invisible or lightly visualized numeric field.

The goal is:

```text
Humans settle where fertility can support them.
Humans consume and organize fertility into FIELD.
Crowded / low-fertility settlements decline or send migrants.
Beasts roam and restore fertility / life-force to land.
Spirits emerge around imbalance, abandoned fertile marks, or isolated human pressure.
```

This should produce:

```text
small human settlements
migration toward fertile land
beast roaming as ecological renewal
spirit manifestations around imbalance
fewer permanent population carpets
```

---

# PART A — Fertility field

## A1. Add fertility to every cell

Each cell should store:

```js
fertility: number
```

Range:

```text
0 to 100
```

Default initial distribution:

```text
EMPTY terrain: random 25-55
FIELD terrain: random 35-65
WILD terrain: random 65-95
MARK terrain: random 35-75
BLOCK terrain: 0
BORDER terrain: unchanged or random 20-45
```

Important design interpretation:

```text
WILD is usually more fertile than ordinary empty land.
Humans are attracted to fertility but convert it into settled FIELD.
Beasts maintain / restore fertility.
```

---

## A2. Fertility display

Add optional visualization mode:

```text
Show fertility heatmap
```

If easy, add a toggle:

```text
terrain view / fertility view / combined view
```

Minimum acceptable:

```text
show fertility value on hover
include fertility stats in JSON export
```

---

## A3. Fertility decay and recovery

Each tick, after unit actions:

### EMPTY

```text
EMPTY fertility slowly drifts toward 45.
```

Simple rule:

```js
if terrain == EMPTY:
    fertility += sign(45 - fertility) * 0.2
```

### FIELD

FIELD is productive but extracts fertility.

```text
FIELD with nearby Humans consumes fertility slowly.
FIELD without nearby Humans decays as before.
```

Rule:

```text
If FIELD has Human in current cell or neighborhood:
    fertility -= fieldUseRate
```

Default:

```text
fieldUseRate = 0.35
```

### WILD

WILD recovers fertility.

```text
If WILD:
    fertility += wildRecoveryRate
```

Default:

```text
wildRecoveryRate = 0.45
```

Cap WILD fertility at 100.

### MARK

MARK does not behave like normal soil.

```text
MARK fertility drifts slowly toward 50.
```

Default:

```text
markFertilityDrift = 0.15
```

### BLOCK

```text
BLOCK fertility = 0
```

Clamp all fertility values to 0-100.

---

# PART B — Humans use fertility

## B1. Human settlement support

A Human is supported by settlement fertility if:

```text
current cell fertility + average fertility of 8-neighborhood >= humanSupportFertility
```

Default:

```text
humanSupportFertility = 85
```

This is sum of current + average neighbor fertility, not pure current-cell fertility.

Alternative if simpler:

```text
local average fertility >= 38
```

Codex may choose the simpler implementation but should document it.

---

## B2. Human natural decline from poor fertility

If a Human is in a local area with low fertility:

```text
local average fertility < humanLowFertilityThreshold
```

then it has increased death or migration pressure.

Default:

```text
humanLowFertilityThreshold = 32
humanLowFertilityDeathChance = 0.04
```

This is not "terrain exhaustion" as a new terrain type.  
It is ordinary population support.

---

## B3. Human reproduction depends on fertility

Replace or modify Human reproduction:

```text
cell has no unit
terrain is FIELD
neighboring Human count is 2 or 3
neighboring FIELD count >= 2
neighboring Beast count == 0
spiritPressure < 2
localUnitCount <= 5
local average fertility >= humanBirthFertilityThreshold
random chance < humanBirthChance
```

Defaults:

```text
humanBirthFertilityThreshold = 42
humanBirthChance = 0.18
```

This should sharply reduce uncontrolled human growth.

---

## B4. Human terrain rewrite consumes fertility

Human on EMPTY:

```text
EMPTY -> FIELD only if:
neighboring Human count >= 1
and local average fertility >= humanFieldCreateThreshold
```

Default:

```text
humanFieldCreateThreshold = 40
```

Human on WILD:

```text
WILD -> FIELD only if:
neighboring Human count >= 2
and local average fertility >= humanWildCultivateThreshold
```

Default:

```text
humanWildCultivateThreshold = 55
```

When a Human creates FIELD:

```text
fertility -= fieldCreationCost
```

Default:

```text
fieldCreationCost = 8
```

Humans no longer paint every step into FIELD.

---

# PART C — Migration and settlements

## C1. Settler is migration, not birth

Important:

```text
Settler creation must not add population.
```

When a settlement is overcrowded or fertility-poor:

```text
select an existing Human in that cluster
change role to "settler"
```

Do not create a new Human.

If roles are not implemented, move an existing Human outward instead of spawning a new one.

---

## C2. Settlement pressure

A Human settlement has pressure if:

```text
local Human count >= 4
or local average fertility < humanLowFertilityThreshold
```

When pressure exists:

```text
with settlerDepartureChance, mark one existing Human as settler
```

Default:

```text
settlerDepartureChance = 0.08
```

---

## C3. Settler movement uses fertility gradient

Settlers score candidate cells by:

```text
score =
  fertility * 2
  + emptyBonus
  + nearbyHumanSmallGroupBonus
  - denseHumanPenalty
  - beastDangerPenalty
  - spiritDangerPenalty
```

Suggested values:

```text
emptyBonus = 15 if terrain is EMPTY
wildBonus = 8 if terrain is WILD and not near too many Beasts
nearbyHumanSmallGroupBonus = 10 if neighboring Human count is 1 or 2
denseHumanPenalty = 20 if neighboring Human count >= 4
beastDangerPenalty = 30 if neighboring Beast count >= 2
spiritDangerPenalty = 20 if neighboring Spirit count >= 1 and neighboring Human count == 0
```

Allowed settler terrain:

```text
EMPTY
FIELD
WILD
```

Forbidden:

```text
MARK
BORDER
BLOCK
```

Settlers should prefer high-fertility empty or wild edges, not just any empty tile.

---

## C4. Founding a settlement

If a settler reaches a cell where:

```text
terrain is EMPTY or WILD
local average fertility >= foundingFertilityThreshold
neighboring Human count >= 1
```

then:

```text
terrain -> FIELD
role -> normal
```

Default:

```text
foundingFertilityThreshold = 50
```

This creates new settlements as clusters, not single-person carpet expansion.

---

# PART D — Beasts as fertility carriers

## D1. Beast systemic identity

Beasts should:

```text
roam widely
avoid strong human groups
restore fertility
make WILD more fertile
reproduce rarely
die less easily from conflict
```

They are not meant to be numerous.

---

## D2. Beast fertility restoration

When a Beast stands on or moves through a cell:

```text
fertility += beastFertilityRestore
```

Default:

```text
beastFertilityRestore = 1.2
```

Also slightly restore neighboring cells:

```text
neighbor fertility += beastNeighborFertilityRestore
```

Default:

```text
beastNeighborFertilityRestore = 0.25
```

This is the main new Beast function.

---

## D3. Beast movement uses fertility and human avoidance

If near strong Humans:

```text
neighboring Human count >= 2
```

Beast flees toward:

```text
higher fertility WILD or EMPTY with fewer neighboring Humans
```

If not near strong Humans, Beast roams toward:

```text
high fertility EMPTY / WILD
FIELD edge
MARK edge
```

Beasts should not occupy every WILD cell.  
They should move through WILD like packs.

---

## D4. Beast reproduction rare and fertility-dependent

Beast birth:

```text
cell has no unit
terrain is WILD or EMPTY
local average fertility >= beastBirthFertilityThreshold
neighboring Beast count is 2 or 3
neighboring Human count == 0
localUnitCount <= 4
random chance < beastBirthChance
```

Defaults:

```text
beastBirthFertilityThreshold = 60
beastBirthChance = 0.06
```

---

## D5. Beast death

Beasts are hard to kill if they can flee.

Rule:

```text
If Beast has neighboring Human count >= 3 and no valid escape cell:
    Beast dies
```

Keep natural death but lower it:

```text
beastBaselineDeathChance = 0.002
beastOldAgeDeathChance = 0.12
beastMaxAge = 85
```

Beast population should be low-to-medium, not huge.

---

## D6. Beast terrain rewrite

Beast on FIELD:

```text
FIELD -> WILD with probability 0.55
```

Beast on EMPTY:

```text
EMPTY -> WILD with probability 0.25 if fertility >= 55
```

Beast on MARK:

```text
MARK -> WILD with probability 0.45
```

Beast on WILD:

```text
WILD remains WILD
fertility increases
```

---

# PART E — Spirits as imbalance manifestations

## E1. Spirit role

Spirits should not be a normal reproductive population.

They should appear where there is tension between:

```text
Human settlement
high fertility
MARK traces
isolation
abandoned FIELD
```

---

## E2. Spirit manifestation

For empty-unit MARK cells:

```text
if neighboring Beast count == 0
and local average fertility >= spiritManifestFertilityThreshold
and at least one:
    neighboring Human count >= 1
    neighboring FIELD count >= 1
    abandoned FIELD nearby
then random chance < spiritManifestChance:
    spawn Spirit
```

Defaults:

```text
spiritManifestFertilityThreshold = 45
spiritManifestChance = 0.10
```

Abandoned FIELD nearby means:

```text
FIELD terrain with no Human in 8-neighborhood
```

---

## E3. Spirit lifespan

Spirit remains temporary.

Defaults:

```text
spiritMaxAge = 35
spiritOldAgeDeathChance = 0.40
```

If Spirit is not near any of:

```text
Human
FIELD
MARK
```

then it disappears.

---

## E4. Spirit movement

Spirit moves toward:

```text
isolated Human
FIELD edge
high fertility MARK
```

Spirit avoids:

```text
cells with neighboring Beast count >= 2
```

---

## E5. Spirit terrain rewrite

Spirit on FIELD:

```text
FIELD -> MARK with probability 0.50
```

Spirit on EMPTY:

```text
EMPTY -> MARK with probability 0.20 if local average fertility >= 45
```

Spirit on WILD:

```text
WILD -> MARK only if neighboring Spirit count >= 2
```

Spirit on MARK:

```text
MARK remains MARK
```

This makes Spirit more situational.

---

# PART F — Population targets

Do not hard-cap populations globally.

But tune toward these visual targets on a 40 x 25 grid:

```text
Human units usually: 20-90
Beast units usually: 10-50
Spirit units usually: 0-30
```

Terrain can be larger:

```text
FIELD can have 50-200 cells
WILD can have 100-400 cells
MARK can have 20-120 cells
EMPTY should remain meaningfully present
```

Important:

```text
Units should be sparse.
Terrain can be broad.
```

---

# PART G — JSON diagnostics

Add fertility stats to every recording frame:

```js
fertility: {
  avg: number,
  min: number,
  max: number,
  avgByTerrain: {
    ".": number,
    "F": number,
    "W": number,
    "M": number
  }
}
```

Add events:

```js
events: {
  births: { H, B, S },
  naturalDeaths: { H, B, S },
  conflictDeaths: { H, B, S },
  conversions: { H_to_S },
  settlerDepartures: number,
  settlementFoundings: number,
  spiritManifestations: number,
  terrainChanges: {}
}
```

Track at minimum:

```text
settlerDepartures
settlementFoundings
spiritManifestations
naturalDeaths
births
```

Snapshot export should include fertility rows:

```js
world: {
  terrainRows,
  unitRows,
  fertilityRows
}
```

Where fertilityRows can be arrays of numbers rounded to integers.

---

# PART H — UI

Add optional display:

```text
Show fertility heatmap toggle
```

Show stats:

```text
Average fertility
Average FIELD fertility
Average WILD fertility
Average MARK fertility
```

Add sliders if easy:

```text
humanBirthChance
beastBirthChance
spiritManifestChance
fieldUseRate
wildRecoveryRate
beastFertilityRestore
```

Constants are acceptable if UI work is too much.

---

# Expected result

After V0.6:

```text
Humans should form small settlements based on fertile areas.
Large settlements should either stabilize, decline, or send migrants.
Settlers should move toward fertile empty/wild land.
Beasts should wander through the map and restore fertility.
Beasts should not fill WILD cells densely.
Spirits should appear as temporary pressure around MARK / FIELD / isolated Humans.
Unit populations should remain sparse.
Empty land should remain visible.
The system should show local cycles rather than global boom-bust.
```

---

# Test target

Run:

```text
0-400 ticks
```

Export:

```text
recording 0-400
snapshot around tick 100
snapshot around tick 250
snapshot around tick 400
```

Evaluate:

```text
1. Are Human units usually below 100?
2. Are Beast units usually below 50?
3. Are Spirit units usually below 30?
4. Are there multiple small FIELD clusters instead of one huge carpet?
5. Do settlers found new clusters in fertile locations?
6. Do Beasts restore fertility and roam without overpopulating?
7. Do Spirits appear and disappear instead of becoming stable population?
8. Does EMPTY remain significant?
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
Rules version: TRI_SPECIES_WORLD_SIM_V0.6_FERTILITY_MIGRATION
```

Add note:

```text
V0.6 introduces fertility as a numeric cell field.
Humans migrate toward fertility and form settlements.
Beasts act as roaming fertility carriers.
Spirits manifest around imbalance instead of reproducing like animals.
```

---

# Do not do

Do not add DEPLETED terrain.
Do not add new terrain symbols.
Do not add multi-screen map.
Do not add tarot.
Do not add lore text.
Do not add buildings.
Do not add resources.
Do not change art direction.

---

# Completion report

Report:

```text
files changed
data model changes
fertility rules implemented
migration rules implemented
beast fertility restoration implemented
spirit manifestation changes
JSON export changes
how to run
how to export recordings
known simplifications
```
