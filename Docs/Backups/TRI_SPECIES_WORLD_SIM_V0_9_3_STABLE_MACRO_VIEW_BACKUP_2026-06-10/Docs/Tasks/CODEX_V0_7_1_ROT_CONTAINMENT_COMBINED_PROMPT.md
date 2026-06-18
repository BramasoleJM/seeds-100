# CODEX_V0_7_1_ROT_CONTAINMENT_COMBINED_PROMPT.md

Copy this single prompt into Codex.

This prompt combines:

```text
CODEX_V0_7_1_CONTAINMENT_AND_SETTLEMENT_FIX_PROMPT.md
CODEX_V0_7_1_SPIRIT_FROM_DEATH_ADDENDUM_PROMPT.md
```

The addendum rule is already integrated here:

```text
Death creates active Spirit directly.
Spirit movement / death creates MARK.
MARK does not passively spawn Spirit.
```

---

# Read first

Read these files first if they exist:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
CODEX_V0_7_ROT_MIGRATION_REBASE_PROMPT.md
```

Act as Executor.

This is a V0.7.1 containment and settlement-stability patch.

Do not add new visible terrain.

Do not add corpse overlay.

Do not add DEPLETED terrain.

Do not add tarot, lore text, buildings, economy, resources, or multi-screen map.

Set rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.7.1_ROT_CONTAINMENT_COMBINED
```

---

# Core design correction

V0.7 produced the wrong behavior:

```text
MARK became a persistent substrate.
MARK kept spawning Spirit.
Spirit created more MARK.
The map became M/S dominated.
Humans died too quickly.
Beasts became over-attracted to M/S and random walk disappeared.
```

V0.7.1 should change the causal chain.

Old broken chain:

```text
Death -> MARK
MARK -> Spirit
Spirit -> more MARK
MARK -> more Spirit
```

New intended chain:

```text
Death -> active Spirit
Spirit moves / dies -> MARK trail
MARK is passive rot residue
Beast cleans Spirit / MARK into WILD
Human settlements resist Spirit when supported
```

In short:

```text
S = active short-lived rot / plague wave.
M = passive trail / residue left by S.
M does not normally create S.
```

---

# High-level target loop

The intended world loop is:

```text
WILD high fertility
→ Humans settle and create FIELD
→ FIELD supports population but is consumed
→ overcrowding / low fertility / Spirit pressure causes migration or death
→ death creates short-lived Spirit
→ Spirit moves briefly and leaves MARK trails
→ MARK blocks Human use and attracts Beasts
→ Beasts clean S/M into WILD and restore fertility
→ WILD fertility rises
→ Humans eventually migrate there again
```

Expected world feel:

```text
Spirit outbreaks should be local pulses, not map takeover.
MARK should be a trail / residue, not a spawning nest.
Beasts should mostly random-walk, but react to nearby S or clustered M.
Human settlements should have resistant cores and vulnerable edges.
Migration should matter before Human extinction.
```

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
unitAge[y][x]         // integer, for H/B/S
unitRole[y][x]        // "normal" | "settler_seeking" | "settler_resting"
terrainAge[y][x]      // especially useful for MARK decay
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
terrain is how land is currently being used / marked.
FIELD is not a fixed fertility value.
FIELD inherits previous fertilityLevel and usually reduces it by 1 when created.
MARK can still be fertile, but it is unavailable / rotten / spirit-marked for Humans.
```

---

# Part A — Diagnostics / likely bugs to fix first

Before tuning behavior, fix likely diagnostic bugs.

## A1. Nearby MARK / Spirit diagnostics

In the previous recording, `markCellsNearHumans` stayed 0 even while Humans were converted by Spirit.

Fix / verify:

```text
markCellsNearHumans = count MARK cells within radius 2 around all Humans.
spiritCellsNearHumans = count S units within radius 2 around all Humans.
humansAdjacentToSpirit = count Humans with adjacent S.
humansAdjacentToMark = count Humans with adjacent MARK.
```

These values must become nonzero when H is near M/S.

## A2. Settler move counter

In previous recordings, `settlerMoves` was high even when `activeSettlers = 0`.

Fix:

```text
Only increment settlerMoves when a Human with role settler_seeking or settler_resting actually moves.
Do not count normal Human moves as settlerMoves.
```

Add:

```js
humanNormalMoves
```

## A3. Beast movement counters

Ensure:

```text
beastRandomMoves
beastFleeMoves
beastAttractedMoves
```

count actual executed moves, not candidates or desired moves.

Add if useful:

```js
beastBlockedMoves
beastAttractedCandidates
beastStallBreakMoves
```

---

# Part B — Fertility remains 0-4 discrete levels

Do not return to 0-100 fertility as rule basis.

Initial terrain fertility:

```text
EMPTY: random 1-2, with some hotspots at 3
FIELD: random 2-3
WILD: random 3-4
MARK: random 2-3
BORDER: random 1-2
BLOCK: 0
```

Add independent fertility hotspots:

```text
2-5 blobs of fertility 3-4 placed on EMPTY/WILD cells
```

Drift rules:

```text
EMPTY above 2 slowly drifts down toward 2 if no WILD/Beast nearby.
EMPTY below 1 slowly drifts up toward 1.
WILD tends to maintain 3.
Beast can raise WILD/EMPTY to 4.
FIELD changes through settlement pressure.
MARK keeps fertility but is unavailable to Humans until cleaned.
BLOCK stays 0.
```

---

# Part C — FIELD creation and meaning

FIELD is Human-organized land.

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

Never create FIELD on:

```text
MARK
BLOCK
BORDER
```

FIELD states:

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

Do not let Spirit instantly convert large amounts of FIELD.

---

# Part D — Human settlement support and demand

Previous support was too generous: Humans were classified as surplus even while FIELD collapsed.

Use stricter support.

For each Human, compute local support in radius 2:

```text
support =
    2.0 * sum fertilityLevel of FIELD cells in radius 2
  + 0.25 * sum fertilityLevel of adjacent WILD / EMPTY cells in radius 2
  - 4 * count MARK cells in radius 2
  - 6 * count Spirit units in radius 2
```

Do not count far WILD as strong settlement support.

Interpretation:

```text
WILD is attractive for migration.
WILD is not already usable settlement support.
FIELD is the settlement core.
```

Demand:

```text
demand = local Human count in radius 2 * 2
```

Classify condition:

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

Surplus requires FIELD core:

```text
A Human can be classified as surplus only if:
    FIELD count in radius 2 >= 3
    and average FIELD fertility >= 2
```

Otherwise, max condition is balanced.

---

# Part E — Human reproduction

Human birth should be sparse.

Birth condition:

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

No Human birth in:

```text
balanced
pressured
collapse
```

This prevents carpet growth.

---

# Part F — Human movement and migration

Normal Humans prefer to stay in FIELD settlements.

Normal H movement priority:

```text
1. Stay on FIELD if local condition is balanced or surplus.
2. Move within nearby FIELD if current cell is threatened by S/M.
3. Avoid MARK.
4. Avoid adjacent Spirit unless supported by 2+ Humans.
5. Avoid cells adjacent to 2+ Beasts.
```

Do not let normal Humans wander randomly like Beasts.

## F1. Migration trigger

A Human may become settler if:

```text
local condition is pressured or collapse
or current FIELD fertilityLevel <= 1
or average FIELD fertility in local radius <= 2
or nearby MARK count >= 2
or nearby Spirit count >= 1
```

This should trigger before total collapse.

Departure chances:

```text
pressured: 0.06
collapse: 0.18
MARK/S pressure: 0.10
```

Important:

```text
Settler departure must not create a new Human.
It changes an existing Human's role.
```

Optional migration party:

```text
if local Human count >= 5, migrationPartySize may be 2
otherwise 1
```

## F2. Settler seeking

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

A single nearby Beast should not block founding.

Avoid:

```text
adjacent S
MARK
2+ Beast neighbors
```

## F3. Settler resting

If no good target is visible:

```text
move toward nearby EMPTY with fertilityLevel 1-2
enter settler_resting
```

Resting:

```text
Each 5 ticks while resting:
    fertilityLevel -= 1, min 0
```

When resting cell reaches fertility 0:

```text
role -> settler_seeking
continue migration
```

If high-fertility WILD/EMPTY target appears within radius 5:

```text
role -> settler_seeking
move toward it
```

## F4. Settlement founding

A settler can found the first FIELD alone.

Condition:

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

Additionally, to give the settlement a small seed:

```text
if adjacent EMPTY with fertility >= 2 and no M/S:
    with probability 0.35 create 1 extra FIELD
```

Do not spawn extra Humans.

---

# Part G — Death creates active Spirit directly

This overrides all previous death -> MARK -> S logic.

When H or B dies:

```text
remove H/B
place S on the death cell if possible
S age = 0
S maxAge = random 4-7
```

Do not create MARK immediately on death.

If death cell cannot hold S due to implementation constraints:

```text
terrain -> MARK
```

but preferred behavior is:

```text
unit = S
terrain remains as previous terrain until S moves/leaves/dies
```

Track:

```js
spiritsCreatedByDeath += 1
spiritsCreatedByHumanDeath += 1
spiritsCreatedByBeastDeath += 1
```

Optional later variation:

```text
Human death creates S with 80% probability, otherwise MARK.
Beast death creates S with 50% probability, otherwise MARK.
```

But first implement the simple version:

```text
All H/B deaths create S.
```

---

# Part H — Spirit behavior: short-lived plague wave

Spirit is not a stable population.

Spirit does not reproduce normally.

Spirit does not spawn from MARK.

Spirit is active rot.

## H1. Spirit lifespan

Defaults:

```text
spiritMaxAge = random 4-7
```

Each tick:

```text
S age += 1
if age >= maxAge:
    S dies
    current terrain -> MARK
    remove S
    spiritDiedIntoMark += 1
```

## H2. Spirit refresh

Refresh only on successful Human infection:

```text
if S converts/kills H:
    S age = 0
```

Do not refresh because S touches another S.

If two S touch:

```text
no refresh
```

Optional density reduction:

```text
if two S overlap / collide, one may disappear.
```

## H3. Spirit movement creates MARK

When S moves from cell A to cell B:

```text
cell A terrain -> MARK
cell A terrainAge = 0
S moves to B
spiritTrailMarksCreated += 1
```

S can move at most once per tick.

Do not additionally convert another neighboring cell unless moving into it.

Movement priority:

```text
1. Adjacent isolated Human
2. Adjacent FIELD edge
3. Adjacent non-MARK cell near existing MARK
4. Random valid adjacent cell
```

Restrictions:

```text
Avoid cells adjacent to 2+ Beasts.
Avoid WILD with fertilityLevel >= 3 unless adjacent Human/FIELD exists.
Do not enter BLOCK.
```

## H4. MARK no longer spawns Spirit

Disable:

```text
empty MARK cell randomly spawns S
```

Set:

```text
spiritSpawnChanceFromMark = 0
```

or remove that rule entirely.

If rare haunting fallback remains in code:

```text
rareMarkReactivationEnabled = false
rareMarkReactivationChance = 0.002
```

Default:

```text
MARK does not create new S.
```

This is the most important containment change.

---

# Part I — Spirit infection of Humans

If S adjacent to H:

```text
humanNeighborCount = neighboring H around that Human
```

Base infection chance:

```text
humanNeighborCount == 0: 0.28
humanNeighborCount == 1: 0.12
humanNeighborCount >= 2: 0.02
```

Modifiers:

```text
if local condition is surplus or balanced:
    chance *= 0.5

if local condition is collapse:
    chance *= 1.5

if adjacent MARK count >= 3:
    chance += 0.05

cap chance at 0.35
```

If infection succeeds:

```text
70%: H dies / is removed, H cell terrain -> MARK, no new S
30%: H converts to S, new S age = 0, H cell terrain -> MARK
```

Track:

```js
spiritKillsHumanToMark
conversions.H_to_S
spiritsCreatedByConversion
```

If infection fails:

```text
increase migration pressure / retreat pressure
```

Supported Humans should retreat/migrate before conversion.

Add optional counters:

```js
spiritRepelledBySettlement
humanRetreatsFromSpirit
```

---

# Part J — MARK lifecycle

MARK is passive residue.

It should:

```text
block Human founding
increase Human migration pressure
attract Beasts
eventually fade if untouched
```

MARK should not spawn S.

MARK persistence:

```text
markMinLifetime = 20
markPassiveDecayChance = 0.03 after min lifetime
```

MARK low-fertility decay:

```text
if terrain == MARK
and fertilityLevel <= 1
and terrainAge >= 10
and no Spirit nearby:
    MARK -> EMPTY with chance 0.08
```

Track:

```js
marksDecayed
```

Human effect:

```text
Humans avoid MARK.
Settlers cannot found on MARK.
MARK near Humans increases migration pressure.
If H has 2+ MARK neighbors and is not supported by 2+ H:
    add death / infection stress.
```

Default stress death chance:

```text
markHumanStressDeathChance = 0.03
```

---

# Part K — Beast behavior: random walk + S/M cleaning

Beast default behavior should be random walk.

Do not make Beast a complex optimizing AI.

Previous issue:

```text
M/S targets became everywhere.
Beasts were over-attracted.
random walk disappeared.
Some beasts looked frozen.
```

## K1. Beast movement priority

Each tick for B:

```text
1. If neighboring Human count >= 2:
       flee from Humans.
2. Else if adjacent S:
       move into / attack S if possible.
3. Else if visible S within radius 4:
       60% move toward S, 40% random walk.
4. Else if clustered MARK within radius 2:
       60% move toward MARK, 40% random walk.
5. Else:
       random walk.
```

Clustered MARK condition:

```text
A MARK target counts only if there are at least 2 MARK cells within radius 1 of that target.
```

Random walk:

```text
choose random valid adjacent cell
prefer WILD/EMPTY, but allow FIELD/MARK
avoid BLOCK
avoid occupied cells
```

Optional weights:

```text
WILD weight 3
EMPTY weight 3
FIELD weight 1
MARK weight 4 only if visible target
```

## K2. Anti-stall

If Beast has no actual move for 2 consecutive ticks:

```text
force a random valid move if any exists
```

Track:

```js
beastStallBreakMoves
beastBlockedMoves
```

## K3. Beast cleans active Spirit

When B enters a cell with S:

```text
remove S
terrain -> WILD
fertilityLevel = min(fertilityLevel + 2, 4)
spiritSuppressedByBeast += 1
```

If B is adjacent to S:

```text
S age += 3
if S reaches max age, remove S and mark spiritSuppressedByBeast
```

If neighboring Beast count around S >= 2:

```text
remove S
spiritSuppressedByBeast += 1
```

## K4. Beast cleans MARK

When B enters MARK:

```text
MARK -> WILD
fertilityLevel = min(fertilityLevel + 2, 4)
marksCleanedByBeast += 1
```

## K5. Beast restores fertility

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

## K6. Beast reproduction

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

## K7. Beast death

Beasts are hard to kill.

Human kill rule:

```text
If Beast has neighboring Human count >= 3
and no valid escape cell:
    Beast dies
    death creates S according to Part G
```

Natural death:

```text
beastMaxAge = 90
beastOldAgeDeathChance = 0.08 after max age
beastBaselineDeathChance = 0.001
```

---

# Part L — Human aging and death

Humans should not live forever, but should not collapse too fast.

Defaults:

```text
humanMaxAge = 100
humanOldAgeDeathChance = 0.10 after max age
humanBaselineDeathChance = 0.001
```

Additional pressure:

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
death creates S according to Part G
```

---

# Part M — Terrain transition summary

EMPTY:

```text
neutral land
temporary resting point for settlers
can become FIELD if fertilityLevel >= 2/3 and H founds
can become WILD if Beast restores it
can become MARK if S passes through / dies there
```

FIELD:

```text
human-organized land
inherits fertility from previous land minus 1 on creation
supports Humans depending on fertility and local support
can become EMPTY if abandoned and fertility 0
can become MARK by Spirit trail/death
can become WILD if Beast tramples/cleans it
```

WILD:

```text
beast-restored fertile land
usually fertility 3-4
attracts settlers
can become FIELD through Human founding
can become MARK if Spirit passes through / dies there
but high-fertility WILD resists Spirit spread unless near H/FIELD
```

MARK:

```text
passive death/rot/spirit trail
Humans cannot use it
does not spawn S
attracts Beasts if clustered
Beast entering MARK turns it into WILD and restores fertility
can decay naturally
```

SPIRIT:

```text
short-lived plague wave created by death
moves and leaves MARK trails
infects isolated Humans
is suppressed by Beasts
does not reproduce normally
does not spawn from MARK
```

---

# Part N — Initialization controls

Keep custom initialization controls.

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

Presets:

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

Note:

```text
Even if initial S=0 and MARK=0, future deaths can create S.
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

# Part O — JSON diagnostics

Update export.

Each frame:

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

  conversions: { H_to_S: 0 },
  spiritKillsHumanToMark: 0,

  spiritsCreatedByDeath: 0,
  spiritsCreatedByHumanDeath: 0,
  spiritsCreatedByBeastDeath: 0,
  spiritsCreatedByConversion: 0,

  spiritTrailMarksCreated: 0,
  spiritDiedIntoMark: 0,
  spiritSuppressedByBeast: 0,

  marksCreatedBySpirit: 0,
  marksCreatedByDeath: 0,
  marksCleanedByBeast: 0,
  marksDecayed: 0,

  settlerDepartures: 0,
  humanNormalMoves: 0,
  settlerMoves: 0,
  settlerRestStops: 0,
  settlementFoundings: 0,

  fieldCreated: 0,
  fieldDecayed: 0,
  fieldTrampled: 0,

  beastRandomMoves: 0,
  beastFleeMoves: 0,
  beastAttractedMoves: 0,
  beastBlockedMoves: 0,
  beastStallBreakMoves: 0
}
```

Deprecated / should be 0 by default:

```js
spiritSpawnsFromMark: 0,
spiritManifestations: 0
```

Diagnostics:

```js
diagnostics: {
  markCellsNearHumans: 0,
  spiritCellsNearHumans: 0,
  humansAdjacentToSpirit: 0,
  humansAdjacentToMark: 0,

  humanLocalConditions: {
    surplus: 0,
    balanced: 0,
    pressured: 0,
    collapse: 0
  },

  activeSettlers: 0,
  activeRestingSettlers: 0,
  avgHumanSupport: 0,
  avgHumanDemand: 0,

  beastVisibleMarkTargets: 0,
  beastVisibleSpiritTargets: 0,
  beastStalledCount: 0,

  markCellsWithNearbyBeast: 0,
  clusteredMarkTargets: 0
}
```

Snapshot world:

```js
world: {
  terrainRows,
  unitRows,
  fertilityRows
}
```

For fertilityRows:

```text
Use digits 0-4 as strings.
```

---

# Part P — Expected behavior

After this combined V0.7.1 patch:

```text
Spirit appears immediately after deaths.
Spirit moves briefly and leaves MARK trails.
Spirit does not respawn from old MARK.
MARK is passive and cleanable.
M should not monotonically cover the map in normal balanced runs.
Beasts should clean active S and passive M.
Beasts should still show random walk when no nearby S / clustered M exists.
Human settlement cores should resist Spirit better than isolated Humans.
Humans should not consistently die out before tick 100.
Migration should create new FIELD before old FIELD collapses.
```

A good outbreak:

```text
Death creates S.
S moves 3-6 steps.
S leaves a short M trail.
S infects an isolated Human or dies.
Beast may eat S/M and return it to WILD.
```

A bad outbreak:

```text
M keeps producing S forever.
S covers hundreds of cells.
Humans extinct before migration matters.
```

---

# Part Q — Test checklist

Run and export:

```text
Balanced Rot Cycle Test 0-250
Rot Outbreak Test 0-150
Beast Cleansing Test 0-150
Human Migration Test 0-250
No Spirit Control 0-200
```

Check:

```text
1. spiritSpawnsFromMark should be 0 unless rare reactivation is explicitly enabled.
2. spiritsCreatedByDeath should be nonzero after deaths.
3. spiritTrailMarksCreated should be nonzero when S moves.
4. S population should pulse and usually fall back.
5. M should not monotonically grow to 300+ in balanced runs.
6. beasts should clean S/M visibly.
7. spiritSuppressedByBeast should become nonzero in outbreak/cleansing tests.
8. beastRandomMoves should remain nonzero when no nearby S/clustered M exists.
9. markCellsNearHumans / humansAdjacentToSpirit should be nonzero when conditions exist.
10. activeSettlers should only count actual settlers.
11. settlerMoves should only count actual settler moves.
12. Humans should not consistently extinct before tick 100.
```

---

# Part R — Things not to do

Do not add corpse overlay.

Do not add new terrain.

Do not add DEPLETED terrain.

Do not keep 0-100 fertility as rule basis.

Do not make MARK spawn Spirit by default.

Do not make Spirit a normal reproducing species.

Do not make Beast a complex goal optimizer except:

```text
flee dense Humans
move toward active S
move toward clustered MARK
otherwise random walk
```

Do not make Humans wander randomly when settlement is balanced.

Do not make Reset randomize.

Do not hard-code global population caps.

Do not remove custom initial counts.

---

# Part S — Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add note:

```text
V0.7.1 combined patch:
- Death now creates active Spirit directly.
- Spirit movement/death leaves MARK.
- MARK no longer passively spawns Spirit.
- MARK is passive residue, blocks Humans, attracts Beasts, and decays/gets cleaned.
- Human settlements resist infection when supported.
- Beast random walk remains visible.
- Diagnostics are corrected for migration, nearby M/S, and Beast movement modes.
```

Documentation should clearly state:

```text
FIELD is not a fixed fertility value.
FIELD inherits land fertility and usually reduces it by 1 when created.
MARK can still be fertile, but it is unavailable to Humans.
S is active short-lived rot created by death.
M is the passive trail left by S.
Beasts clean both S and M back into WILD.
```

---

# Completion report

When finished, report:

```text
files changed
bugs fixed
rule changes
parameter changes
diagnostic fixes
tests run
remaining issues
```
