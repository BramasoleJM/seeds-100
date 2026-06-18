# CODEX_V0_7_ROT_MIGRATION_REBASE_PROMPT.md

Copy this prompt into Codex to implement the next practical version.

---

Read these files first if they exist:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
CODEX_V0_6_FERTILITY_MIGRATION_PROMPT.md
CODEX_V0_6_INITIALIZATION_CONTROLS_PROMPT.md
```

Act as Executor.

This is a conceptual rebase, not a small tuning pass.

Set rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.7_ROT_MIGRATION_REBASE
```

---

# High-level design

We are replacing the previous V0.6 / V0.6.1 direction with a simpler and more legible system.

The current goal is not:

```text
three species fighting for territory
```

The new goal is:

```text
Fertile land attracts human settlement.
Human settlement consumes fertility.
Death leaves rot / spirit-marked ground.
Spirit spreads briefly from rot like plague.
Beasts wander randomly, but are attracted to rot/spirit, eat it, and restore fertile wild land.
Humans migrate away from exhausted or haunted settlements toward beast-restored fertile land.
```

Core cycle:

```text
WILD high fertility
→ Humans settle and create FIELD
→ FIELD supports population but is consumed
→ overcrowding / low fertility / spirit pressure causes migration or death
→ death directly creates MARK
→ MARK produces short-lived SPIRIT waves
→ Beasts are attracted to MARK / SPIRIT and clean them into WILD
→ WILD fertility rises
→ humans eventually migrate there again
```

Do not add a corpse overlay.

Death directly creates MARK.

Do not add a new visible terrain type.

Do not add DEPLETED terrain.

Do not add tarot, lore text, buildings, resources, economy, multi-screen maps, or visual polish.

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

New / revised hidden fields:

```js
fertilityLevel[y][x]  // integer 0-4
unitAge[y][x]         // integer, for H/B/S lifespan
unitRole[y][x]        // optional: "normal" | "settler_seeking" | "settler_resting"
terrainAge[y][x]      // useful for MARK / FIELD / WILD timing
```

Fertility levels:

```text
0 = barren
1 = poor
2 = ordinary
3 = fertile
4 = abundant
```

Important:

```text
fertilityLevel is the underlying land condition.
terrain is how the land is currently being used / marked.
FIELD is not a fixed fertility value.
FIELD inherits the previous fertilityLevel and usually reduces it by 1 when created.
MARK does not necessarily mean low fertility; it means the land is unavailable / rotten / spirit-marked.
```

---

# Part A — Fertility: use discrete 0-4 levels

Replace 0-100 fertility with 0-4 fertilityLevel.

If existing code already stores 0-100 fertility, either:

```text
Option 1: replace it with fertilityLevel 0-4 directly.
Option 2: keep internal 0-100 but expose and use only tier 0-4.
```

Prefer option 1 for clarity.

## A1. Initial fertility by terrain

When generating world:

```text
EMPTY: random 1-2, with some hotspots at 3
FIELD: random 2-3
WILD: random 3-4
MARK: random 2-3
BORDER: random 1-2
BLOCK: 0
```

Also create some independent fertility hotspots:

```text
2-5 blobs of fertility 3-4 placed on EMPTY/WILD cells
```

This is important so that migrants have something to discover.

## A2. Fertility drift

Each tick, apply slow simple rules.

EMPTY:

```text
If fertilityLevel > 2 and no WILD/Beast nearby:
    very slowly drift down toward 2.
If fertilityLevel < 1:
    very slowly drift up toward 1.
```

WILD:

```text
WILD tends to maintain fertility 3.
If Beast passes through, it may become 4.
```

FIELD:

```text
FIELD fertility changes based on settlement pressure.
Do not auto-decrease every tick regardless of context.
```

MARK:

```text
MARK keeps its fertilityLevel.
It is not useful to humans until beasts clean it.
```

BLOCK:

```text
fertilityLevel = 0
```

---

# Part B — FIELD creation and meaning

FIELD is human-organized land. It is not inherently fertile.

## B1. Human creates FIELD

Human can create FIELD only from EMPTY or WILD.

Rules:

```text
If H / settler is on WILD and fertilityLevel >= 3:
    terrain -> FIELD
    fertilityLevel -= 1

If H / settler is on EMPTY and fertilityLevel >= 3:
    terrain -> FIELD
    fertilityLevel -= 1

If H / settler is on EMPTY and fertilityLevel == 2:
    terrain -> FIELD
    fertilityLevel = 1
    this is a weak field, cannot support reproduction

If fertilityLevel <= 1:
    cannot create stable FIELD
```

Do not create FIELD on MARK.

Do not create FIELD on BLOCK/BORDER.

## B2. FIELD states by fertility

Interpretation:

```text
FIELD 3 = rich field, supports growth
FIELD 2 = stable field, supports existing people
FIELD 1 = poor field, creates migration pressure
FIELD 0 = failed field, decays or rots
```

FIELD with fertility 0:

```text
If no Human nearby:
    FIELD -> EMPTY
If death / MARK / Spirit nearby:
    FIELD -> MARK
```

---

# Part C — Humans: settlement, balance, migration

Humans are not a flood-fill species.

They should form small settlements, consume fertility, and send migrants when support is no longer balanced.

## C1. Human roles

Use unitRole for Humans if possible:

```text
normal
settler_seeking
settler_resting
```

If role implementation is hard, approximate with a boolean:

```js
isSettler[y][x]
```

## C2. Settlement support and demand

Use a local approximation first. Full connected-component settlement detection is optional.

For each Human, compute local settlement support in radius 2 or 3:

```text
support =
    sum fertilityLevel of FIELD cells in radius
  + 0.5 * sum fertilityLevel of WILD / EMPTY cells in outer radius
  - 2 * count MARK cells in radius
  - 3 * count Spirit units in radius
```

Demand:

```text
demand = local Human count in radius * 2
```

Then classify local condition:

```text
support >= demand * 1.3:
    surplus

support >= demand * 0.8 and support < demand * 1.3:
    balanced

support >= demand * 0.5 and support < demand * 0.8:
    pressured

support < demand * 0.5:
    collapse
```

If floating multipliers are annoying, implement with integer thresholds approximately.

## C3. Human reproduction

Human birth should be sparse.

A new Human can be born only if:

```text
target cell has no unit
target terrain is FIELD
target fertilityLevel >= 2
neighboring Human count is 2 or 3
neighboring Beast count == 0
neighboring Spirit count == 0
local condition is surplus
random < humanBirthChance
```

Default:

```text
humanBirthChance = 0.12
```

No birth in balanced / pressured / collapse conditions.

This avoids population carpet growth.

## C4. Human normal movement

Normal Humans prefer to stay in FIELD settlements.

Movement priority for normal H:

```text
1. Stay on FIELD if local condition is balanced or surplus.
2. Move within nearby FIELD if current cell is threatened by S/M.
3. Avoid MARK.
4. Avoid adjacent Spirit unless supported by 2+ Humans.
5. Avoid cells adjacent to 2+ Beasts.
```

Do not let normal Humans wander randomly like beasts.

## C5. Migration trigger

A Human may become settler if:

```text
local condition is pressured or collapse
or current FIELD fertilityLevel <= 1
or nearby MARK count >= 2
or nearby Spirit count >= 1
```

In pressured condition:

```text
settlerDepartureChance = 0.06
```

In collapse condition:

```text
settlerDepartureChance = 0.18
```

Important:

```text
Settler departure must NOT create a new Human.
It changes an existing Human's role.
```

If local group has enough Humans, optionally mark 2 Humans as settlers to create small migration parties.

Default:

```text
migrationPartySize = 1
```

Optional:

```text
if local Human count >= 5, migrationPartySize may be 2
```

## C6. Settler seeking

Settlers have two modes:

```text
settler_seeking
settler_resting
```

Seeking behavior:

```text
Look within radius 5 for target cells:
    terrain WILD or EMPTY
    fertilityLevel >= 3
    no MARK
    no Spirit nearby
    neighboring Beast count <= 1
Prefer WILD 4, then EMPTY 4, then WILD 3, then EMPTY 3.
Move one step toward best target.
```

If no good target is visible:

```text
move toward nearby EMPTY with fertilityLevel 1-2
enter settler_resting
```

## C7. Settler resting

Resting behavior:

```text
If on EMPTY fertility 1-2:
    stay for a few ticks
    consume fertility slowly
```

Implement simply:

```text
Each 5 ticks while resting:
    fertilityLevel -= 1, min 0
```

When fertilityLevel reaches 0:

```text
role -> settler_seeking
continue migration
```

If while resting a high-fertility WILD/EMPTY target appears within radius 5:

```text
role -> settler_seeking
move toward it
```

## C8. Settlement founding

A settler can found the first FIELD alone.

Founding condition:

```text
terrain is WILD or EMPTY
fertilityLevel >= 3
no Spirit adjacent
no MARK adjacent
neighboring Beast count <= 1
settler has been seeking/resting for at least settlerMinAge
```

Default:

```text
settlerMinAge = 4
```

On founding:

```text
terrain -> FIELD
fertilityLevel -= 1
role -> normal
settlementFoundings += 1
```

Important:

```text
Founding can be single-person.
Growth after founding still requires local support and neighboring Humans.
```

---

# Part D — Death directly creates MARK

Do not add corpse.

When H or B dies:

```text
terrain at death cell -> MARK
terrainAge = 0
fertilityLevel remains unchanged, or decreases by 0/1 depending on cause
```

Suggested:

```text
natural death: keep fertilityLevel
spirit/plague death: fertilityLevel = max(fertilityLevel - 1, 0)
conflict death: keep fertilityLevel
```

If death occurs on BLOCK, ignore terrain conversion.

If death occurs on BORDER, convert to MARK unless blocked.

Human death creates MARK.

Beast death creates MARK.

Spirit death does not necessarily create extra MARK because Spirit already spreads MARK while alive.

---

# Part E — MARK

MARK represents corpse / rot / spirit-marked land / plague trace.

It is not low fertility by default.

It means:

```text
The land may still contain life-force, but humans cannot directly use it.
Beasts are attracted to it and can clean it.
Spirits can emerge from it.
```

## E1. MARK persistence

MARK should not disappear immediately.

Default:

```text
markMinLifetime = 30
markPassiveDecayChance = 0.005 after min lifetime
```

Unsupported MARK can eventually fade:

```text
If terrainAge > markMinLifetime
and no Spirit nearby
and no Human nearby
and no recent death nearby
then with markPassiveDecayChance:
    MARK -> EMPTY
```

But preferred cleaning path is Beast:

```text
Beast enters MARK -> WILD
```

## E2. MARK effect on humans

Humans avoid MARK.

Settlers cannot found on MARK.

If H has MARK neighbors:

```text
increase migration pressure
```

If H has 2+ MARK neighbors and local condition is not surplus:

```text
increase natural/plague death chance slightly
```

Default:

```text
markHumanStressDeathChance = 0.03
```

Only apply if not supported by 2+ neighboring Humans.

---

# Part F — Spirits: short-lived plague wave from MARK

Spirit is not a stable population.

Spirit is a short-lived activity emerging from MARK.

## F1. Spirit spawn from MARK

Each tick, for empty-unit MARK cells:

```text
if terrainAge >= spiritSpawnMinMarkAge
and no Beast in 8-neighborhood
and nearby MARK count >= 1
and random < spiritSpawnChance:
    spawn S
```

Defaults:

```text
spiritSpawnMinMarkAge = 4
spiritSpawnChance = 0.04
```

Increase chance if:

```text
nearby Human count >= 1
or nearby FIELD count >= 1
```

Optional:

```text
+0.03 chance if H/FIELD nearby
```

## F2. Spirit lifespan

Spirit age starts at 0.

Default:

```text
spiritMaxAge = random 6-10
```

Each tick:

```text
age += 1
if age >= spiritMaxAge:
    Spirit disappears
```

If 2+ Beast neighbors:

```text
Spirit disappears immediately or loses 3 age.
```

Default:

```text
if neighboring Beast count >= 2: remove Spirit
if neighboring Beast count == 1: age += 2
```

## F3. Spirit movement / spread

Spirit should spread from inside MARK outward.

Each S per tick:

```text
1. Prefer adjacent Human if isolated.
2. Otherwise prefer adjacent non-MARK cell bordering MARK.
3. Otherwise random adjacent valid cell.
```

When S moves into or affects a cell:

```text
terrain -> MARK
terrainAge = 0
```

Limit:

```text
Each Spirit can convert at most 1 terrain cell per tick.
```

S cannot enter BLOCK.

S should avoid cells with Beast neighbors.

## F4. Spirit refresh / chain

Spirit can continue only if it finds fuel.

If S contacts another S:

```text
age = max(age - 2, 0)
```

If S infects / kills / converts a Human:

```text
age = 0
```

This means:

```text
Without new hosts or spirit clusters, S dies quickly.
With isolated humans nearby, plague can chain.
```

## F5. Spirit effect on Humans

If H has adjacent S:

Compute support:

```text
neighboring Human count
local condition
```

Rules:

```text
If neighboring Human count == 0:
    infectionChance = 0.45

If neighboring Human count == 1:
    infectionChance = 0.25

If neighboring Human count >= 2:
    infectionChance = 0.08

If local condition is surplus:
    infectionChance *= 0.5

If local condition is collapse:
    infectionChance *= 1.5
```

On infection:

```text
H is removed or converted to S.
terrain at H cell -> MARK.
If converted to S, new S age = 0.
conversions.H_to_S += 1
```

If not infected but S/M nearby:

```text
increase migration pressure.
```

This makes settlements resistant but not immune.

---

# Part G — Beasts: random walk + attracted to rot

Beast default behavior should be random walk.

Do not make Beast a complex optimizing AI.

## G1. Beast movement priority

Each tick for B:

```text
1. If neighboring Human count >= 2:
       flee from Humans.
2. Else if MARK or Spirit visible within radius 4:
       move toward nearest MARK/S.
3. Else:
       random walk.
```

Random walk:

```text
choose a random valid adjacent cell
prefer WILD/EMPTY, but allow FIELD/MARK
avoid BLOCK
avoid occupied cells
```

Optional weighting:

```text
WILD weight 3
EMPTY weight 3
FIELD weight 1
MARK weight 4 if visible target
```

## G2. Beast cleans MARK

When B enters MARK:

```text
MARK -> WILD
fertilityLevel = min(fertilityLevel + 1, 4)
markCleaned += 1
```

If B is adjacent to S:

```text
S age increases / S removed if 2+ Beasts nearby
```

If B enters a cell with S, remove S.

## G3. Beast restores fertility

When B moves through EMPTY or WILD:

```text
with probability beastRestoreChance:
    fertilityLevel += 1, max 4
```

Default:

```text
beastRestoreChance = 0.35
```

When B moves through FIELD:

```text
with probability beastTrampleFieldChance:
    FIELD -> WILD
    fertilityLevel = min(fertilityLevel + 1, 4)
```

Default:

```text
beastTrampleFieldChance = 0.25
```

## G4. Beast reproduction

Beast birth should be rare.

Condition:

```text
target cell empty
terrain WILD or EMPTY
fertilityLevel >= 3
neighboring Beast count is 2 or 3
neighboring Human count == 0
random < beastBirthChance
```

Default:

```text
beastBirthChance = 0.035
```

## G5. Beast death

Beasts are hard to kill.

Human kill rule:

```text
If Beast has neighboring Human count >= 3
and no valid escape cell:
    Beast dies, terrain -> MARK
```

Natural death:

```text
beastMaxAge = 90
beastOldAgeDeathChance = 0.08 after max age
beastBaselineDeathChance = 0.001
```

Beast population should remain low-to-medium.

---

# Part H — Human death / natural aging

Humans should not live forever, but should not collapse too fast.

Defaults:

```text
humanMaxAge = 100
humanOldAgeDeathChance = 0.10 after max age
humanBaselineDeathChance = 0.001
```

Additional death pressure:

```text
If local condition is collapse:
    +0.03 death chance

If adjacent S:
    infection logic handles it

If 2+ MARK neighbors and neighboring Human count < 2:
    +0.03 death chance
```

When H dies:

```text
terrain -> MARK
```

This creates plague/rot sources.

---

# Part I — Terrain decay / transition summary

EMPTY:

```text
neutral land
can be temporary resting point for settlers
can become FIELD if fertilityLevel >= 2/3 and H founds
can become WILD if Beast restores it
can become MARK if Spirit spreads into it or death happens
```

FIELD:

```text
human land
inherits fertility from previous land minus 1 on creation
supports Humans depending on fertility and local support
can become EMPTY if abandoned and fertility 0
can become MARK by death / Spirit / rot pressure
can become WILD if Beast tramples / cleans it
```

WILD:

```text
beast-restored fertile land
usually fertility 3-4
attracts settlers
can become FIELD through human founding
can become MARK by death or Spirit spread
```

MARK:

```text
death/rot/spirit-marked land
humans cannot use it
spawns S
attracts beasts
Beast entering MARK turns it into WILD and increases fertility
```

SPIRIT:

```text
short-lived plague wave from MARK
spreads MARK outward
infects isolated Humans
is suppressed by Beasts
```

---

# Part J — Initialization controls

Keep and update custom initialization controls.

Required:

```text
Initial Humans
Initial Beasts
Initial Spirits
Initial FIELD patches
Initial WILD patches
Initial MARK patches
Initial BLOCK count
Random seed
Preset
```

Important:

```text
Initial Spirits may be 0.
Initial MARK patches may be >0.
Initial unit counts must allow 0, 1, and larger values.
```

Update presets:

## Balanced Rot Cycle Test

```text
H = 24
B = 18
S = 0
FIELD patches = 3
WILD patches = 5
MARK patches = 2
BLOCK count = 20
```

## No Spirit Control

```text
H = 24
B = 18
S = 0
MARK patches = 0
```

## Rot Outbreak Test

```text
H = 36
B = 8
S = 2
FIELD patches = 4
WILD patches = 2
MARK patches = 4
```

## Beast Cleansing Test

```text
H = 0
B = 20
S = 0
FIELD patches = 0
WILD patches = 3
MARK patches = 8
```

## Human Migration Test

```text
H = 36
B = 10
S = 0
FIELD patches = 2
WILD patches = 5
MARK patches = 1
```

## Empty Fertility Test

```text
H = 0
B = 0
S = 0
FIELD patches = 0
WILD patches = 0
MARK patches = 0
```

Reset behavior:

```text
Reset restores the last generated initial state exactly.
Randomize creates a new initial state using current UI settings.
Apply Initial Settings regenerates with current values.
```

---

# Part K — JSON export diagnostics

Update snapshot / recording export.

Each frame should include:

```js
counts: {
  units: { H, B, S },
  terrains: { ".", F, W, M, X, "#" }
}
```

Fertility:

```js
fertility: {
  levels: { "0": count, "1": count, "2": count, "3": count, "4": count },
  avgByTerrain: { ".": number, "F": number, "W": number, "M": number }
}
```

Events:

```js
events: {
  births: { H, B, S },
  deaths: { H, B, S },
  naturalDeaths: { H, B, S },
  conflictDeaths: { H, B, S },
  spiritDeaths: { S },
  conversions: { H_to_S: 0 },

  settlerDepartures: 0,
  settlerMoves: 0,
  settlerRestStops: 0,
  settlementFoundings: 0,

  marksCreatedByDeath: 0,
  marksCreatedBySpirit: 0,
  marksCleanedByBeast: 0,

  fieldCreated: 0,
  fieldDecayed: 0,
  fieldTrampled: 0,

  beastRandomMoves: 0,
  beastFleeMoves: 0,
  beastAttractedMoves: 0,

  spiritSpawnsFromMark: 0,
  spiritSpreadActions: 0,
  spiritSuppressedByBeast: 0
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
  activeSettlers: 0,
  activeRestingSettlers: 0,
  avgHumanSupport: number,
  avgHumanDemand: number,
  markCellsNearHumans: number,
  beastVisibleMarkTargets: number
}
```

Snapshot world should include:

```js
world: {
  terrainRows,
  unitRows,
  fertilityRows
}
```

For fertilityRows:

```text
Use digits 0-4 as strings, one row per map row.
```

Example:

```js
"fertilityRows": [
  "1122333444...",
  "1122223334..."
]
```

---

# Part L — UI display

Minimum UI requirements:

```text
Show fertility level 0-4 by color or digit overlay.
Show counts for H/B/S and terrain.
Show preset / seed.
```

Optional but useful:

```text
toggle terrain view / fertility view / combined view
show current events per tick
show active settlers
show marks cleaned by beasts
```

Do not spend much time on visual polish.

---

# Part M — Expected behavior

After V0.7:

```text
Humans should form small FIELD clusters, not one giant carpet.
Humans should not migrate constantly when support is balanced.
Human migration should occur when fertility/support is low or MARK/S pressure rises.
Settlers should sometimes rest in low-fertility EMPTY areas, then continue seeking.
Settlers should found new FIELD on fertile WILD/EMPTY.
Beasts should mostly random-walk.
Beasts should visibly change behavior near MARK/S or dense Humans.
Beasts should clean MARK into WILD and restore fertility.
Spirits should be short-lived waves from MARK.
Spirits should threaten isolated Humans more than settlement cores.
MARK should appear after deaths and be cleaned by beasts.
The world should show local cycles, not global boom-bust.
```

---

# Part N — Test checklist

Run and export recordings.

## Test 1: Balanced Rot Cycle Test, 0-300 ticks

Success indicators:

```text
H survives at least 200 ticks in some seeds.
B survives and remains roughly 10-60.
S appears occasionally but does not become permanent large population.
M appears after deaths and is cleaned by beasts.
settlementFoundings > 0 in at least some seeds.
EMPTY remains meaningful.
```

## Test 2: No Spirit Control, 0-200 ticks

Success indicators:

```text
No S if no MARK/death-generated conditions create it.
Human-Beast fertility cycle can run without initial Spirit.
```

Note:

```text
If death creates MARK, Spirit may eventually appear even with initial S=0.
That is acceptable if MARK exists and spawn conditions are met.
```

## Test 3: Beast Cleansing Test, 0-150 ticks

Success indicators:

```text
Beasts random walk.
Beasts are attracted to MARK.
M decreases over time.
WILD and fertility increase where beasts clean.
```

## Test 4: Rot Outbreak Test, 0-150 ticks

Success indicators:

```text
S spreads briefly.
S threatens isolated Humans.
Settlement cores resist better than isolated Humans.
Beasts suppress outbreak if they arrive.
```

## Test 5: Human Migration Test, 0-250 ticks

Success indicators:

```text
settlerDepartures > 0
settlerRestStops > 0
settlementFoundings > 0 in some seeds
new FIELD appears near fertility 3-4 WILD/EMPTY
```

---

# Part O — Things not to do

Do not add corpse overlay.

Do not add new visible terrain.

Do not add DEPLETED terrain.

Do not keep 0-100 fertility for rules.

Do not make Beast a goal-optimizing AI except:
```text
flee Humans
move toward MARK/S
otherwise random walk
```

Do not make Spirit a normal reproducing species.

Do not make Humans wander randomly when settlement is balanced.

Do not make Reset randomize.

Do not hard-code global population caps.

Do not remove custom initial counts.

---

# Part P — Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add sections:

```text
V0.7 Rot-Migration Rebase
Fertility levels 0-4
Field creation and field support
Death creates MARK
Spirit as short-lived plague wave
Beast random walk and cleansing behavior
Human settlement support/demand and migration
Initialization presets
JSON diagnostics
```

Documentation should clearly state:

```text
FIELD is not a fixed fertility value.
FIELD inherits land fertility and usually reduces it by 1 when created.
MARK can still be fertile, but it is unavailable to Humans.
Beasts clean MARK back into WILD and restore fertility.
Spirits emerge from MARK, spread briefly, and threaten isolated Humans.
```

---

# Completion report

When finished, report:

```text
files changed
data model changes
fertility changes
human settlement/migration rules
beast random-walk/cleansing rules
spirit/mark rules
initialization changes
JSON export changes
tests run
known simplifications
```
