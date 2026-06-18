# CODEX_V0_8_2_CODE_REVIEW_MOVEMENT_HUNTING_FIX_PROMPT.md

Copy this prompt into Codex.

This is a code-review-based fix after inspecting the current implementation files:

```text
index.html
sim.js
style.css
```

This is not a new conceptual rebase.

This is a targeted implementation repair for the current V0.8 code.

Set rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.8.2_CODE_REVIEW_MOVEMENT_HUNTING_FIX
```

---

# Read first

Read these files first:

```text
sim.js
index.html
style.css
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

If docs conflict with this prompt, follow this prompt.

Act as Executor.

Do not add new visible terrain.

Do not add corpse overlay.

Do not add DEPLETED terrain.

Do not restore 0-100 fertility as rule basis.

Do not make Beast naturally die.

Do not make Beast create Spirit.

Do not make MARK spawn Spirit.

Do not add economy/resources/buildings/multi-screen map/tarot/lore text.

---

# Core problem

The current simulation has two major implementation problems:

```text
1. Humans appear not to move, especially settlers.
2. Beasts reproduce and spread WILD far too quickly.
```

After code review, the Human movement problem is not mainly a design issue.

It is caused by implementation bugs:

```text
A. Settler role names do not match across systems.
B. Settlers are intercepted by normal Human stay-in-FIELD logic before they can move.
C. Founding logic does not recognize role names with suffixes like settler_seeking_crisis.
D. Founding conditions are too strict and block new settlements.
E. Humans still treat Beasts mostly as danger, but the intended rule is: isolated Humans avoid Beasts; groups of Humans can hunt/drive off Beasts.
```

Current role creation:

```js
next[y][x].role = prosperityPressure ? "settler_seeking_prosperity" : "settler_seeking_crisis";
```

But current movement/founding checks often use exact comparisons like:

```js
role === "settler_seeking"
role === "settler_resting"
role === "settler"
```

This causes diagnostics to count active settlers while movement/founding does not treat them as settlers.

Fix this first.

---

# Part A — Add role helper functions

Add these helpers near the unit/terrain helper functions:

```js
function isSettlerRole(role) {
  return typeof role === "string" && role.startsWith("settler");
}

function isRestingSettlerRole(role) {
  return typeof role === "string" && role.startsWith("settler_resting");
}

function isSeekingSettlerRole(role) {
  return typeof role === "string" && role.startsWith("settler_seeking");
}

function isProsperitySettlerRole(role) {
  return typeof role === "string" && role.includes("prosperity");
}

function isCrisisSettlerRole(role) {
  return typeof role === "string" && role.includes("crisis");
}
```

Then replace all exact settler role checks with these helpers.

Must update at least:

```text
updateStateDiagnostics()
movementScore()
chooseMove()
applyTerrainRewrite()
planMovements()
applySettlerSpawns()
any logic that checks activeSettlers / activeRestingSettlers / activeProsperitySettlers / activeCrisisSettlers
```

Examples:

```js
if ((cell.role || "").startsWith("settler"))
```

can remain, but prefer:

```js
if (isSettlerRole(cell.role))
```

Do not leave mixed checks.

---

# Part B — Settler movement must run before normal Human stay logic

Currently `chooseMove()` has normal Human stay-in-FIELD logic before any dedicated settler handling.

This makes settlers stay in the settlement if they are still on FIELD.

Fix `chooseMove()` order.

At the start of `chooseMove(source, x, y)`:

```js
const unit = source[y][x].unit;
const role = source[y][x].role || "normal";

if (unit === UNIT.HUMAN && isSettlerRole(role)) {
  return chooseSettlerMove(source, x, y);
}
```

Only after this should normal Human stay-in-FIELD logic run.

This is mandatory.

If a Human is a settler, it should not be intercepted by:

```js
if (unit === UNIT.HUMAN && source[y][x].terrain === TERRAIN.FIELD && local.h >= 1 && !onFrontier) {
  ...
  return { x, y };
}
```

---

# Part C — Implement explicit chooseSettlerMove()

Add a dedicated function:

```js
function chooseSettlerMove(source, x, y) { ... }
```

Do not rely only on generic `movementScore()` for settlers.

## C1. Settler priorities

For a settler:

```text
1. If current cell can found, stay and let terrainRewrite found this tick.
2. Search for a high-fertility target.
3. Move toward target.
4. If no target, make exploratory move.
5. If exploration impossible, rest briefly.
6. If truly blocked, record a blocked reason.
```

## C2. Founding opportunity check

Add helper:

```js
function canFoundSettlementHere(source, x, y) {
  const cell = source[y][x];
  if (cell.unit !== UNIT.HUMAN) return false;
  if (!isSettlerRole(cell.role)) return false;
  if (cell.terrain !== TERRAIN.WILD && cell.terrain !== TERRAIN.EMPTY) return false;
  if (cell.fertility < 3) return false;
  if (cell.terrain === TERRAIN.MARK || cell.terrain === TERRAIN.BLOCK || cell.terrain === TERRAIN.BORDER) return false;
  if (countNeighborUnits(source, x, y).S > 0) return false;
  if ((cell.age || 0) < 2) return false;
  return true;
}
```

Important:

```text
Do not block founding because of adjacent MARK.
Do not block founding because of one nearby Beast.
Do not require neighboring Humans.
```

If `canFoundSettlementHere` is true, `chooseSettlerMove()` should return `{x, y}` and allow `applyTerrainRewrite()` to found.

Track diagnostic:

```js
activeSettlersWithFoundingOpportunity += 1
```

## C3. Target search

Vision:

```text
settlerVisionRadius = 8
```

Target priority:

```text
1. WILD fertility 4
2. WILD fertility 3
3. EMPTY fertility 4
4. EMPTY fertility 3
5. EMPTY fertility 2 as temporary rest target
```

Hard avoid only:

```text
target is BLOCK
target is occupied
target has Spirit
target terrain is MARK
```

Soft avoid:

```text
adjacent Spirit
2+ Beast neighbors
```

But do not make soft avoid always block movement. If no perfect target exists, allow risky exploration.

## C4. Movement toward target

Pick adjacent step that reduces distance to target.

Valid step:

```text
not BLOCK
not occupied
not Spirit
```

Prefer:

```text
WILD / EMPTY / FIELD
```

Avoid MARK if possible, but if all paths are blocked and settler has been stuck, allow MARK crossing with risk later.

If a move is executed:

```js
currentTickEvents.settlerMoves += 1
```

But avoid double-counting in `planMovements()` if it already increments.

Choose one place to increment actual settler movement.

## C5. Forced exploration fallback

If no target found:

```text
choose a random valid adjacent WILD / EMPTY / FIELD cell
prefer cells with fertility >= current fertility
prefer cells farther from nearby dense Human settlement if easy
```

Track:

```js
settlerForcedExplorationMoves += 1
settlerMoves += 1
```

If no valid movement exists:

```js
settlerBlockedByNoValidStep += 1
```

## C6. Resting behavior

If no target and current cell is EMPTY with fertility 1-2:

```text
role -> settler_resting
```

Resting should last max 3 ticks.

If there is no per-unit rest counter, use age modulo or add `restAge` only if simple.

Simpler implementation:

```text
If role is settler_resting and tick % 3 != 0:
    stay, record settlerRestTicks.
If tick % 3 == 0:
    fertility -= 1, min 0
    role -> settler_seeking_crisis or settler_seeking_prosperity depending previous role
```

Do not allow indefinite resting.

Track:

```js
settlerRestStops
settlerRestTicks
settlersLeavingRest
```

---

# Part D — Fix founding in applyTerrainRewrite()

Current founding logic uses exact role check and over-strict conditions.

Replace:

```js
const isSettler = cell.role === "settler_seeking" || cell.role === "settler_resting" || cell.role === "settler";
```

with:

```js
const isSettler = isSettlerRole(cell.role);
```

Then use `canFoundSettlementHere(source or next, x, y)` logic, or duplicate the relaxed condition carefully.

Founding condition:

```text
unit is Human
role is any settler role
terrain is WILD or EMPTY
fertilityLevel >= 3
no adjacent Spirit
age >= 2
```

Do not require:

```text
no adjacent MARK
no adjacent Beast
neighboring Beast <= 1
neighboring Human
```

On founding:

```js
terrain = FIELD
fertility = Math.max(fertility - 1, 1)
role = "normal"
settlementFoundings += 1
fieldCreated += 1
```

Seed field bonus:

```text
Try up to 2 adjacent cells.
If adjacent cell is EMPTY/WILD, fertility >= 2, no Spirit, not BLOCK:
    with probability 0.6 convert to FIELD
    fertility = max(fertility - 1, 1)
```

Do not spawn extra Humans during founding.

---

# Part E — Humans should not universally fear Beasts

Conceptual change:

```text
Isolated Humans avoid Beasts.
Human groups can hunt / drive off Beasts.
Settlers in groups should not be blocked by one Beast.
```

## E1. Remove hard Human Beast avoidance

In `movementScore()` for Human, remove or weaken:

```js
if (targetUnits.B >= 2) return -1;
```

Replace with group-dependent logic.

Compute:

```js
const ownGroup = currentUnits.H;
```

Rules:

```text
If ownGroup <= 1 and target has Beast:
    apply penalty.

If ownGroup >= 2 and target has one Beast nearby:
    allow movement.

If ownGroup >= 3 and target has Beast nearby:
    apply small positive hunting/drive-off score.
```

Example scoring:

```js
if (targetUnits.B >= 1) {
  if (currentUnits.H <= 1) score -= 20;
  else if (currentUnits.H === 2) score += 4;
  else if (currentUnits.H >= 3) score += 12;
}
```

Do not let Humans step into an occupied Beast cell unless the engine supports attack movement.

The hunting effect can be indirect: Humans move adjacent to Beasts, then conflict/dispersal handles Beast removal.

## E2. Settlers and Beasts

For settlers:

```text
One Beast nearby should not block founding or movement.
2+ Beasts nearby should be a risk penalty, not absolute block unless Spirit/MARK is also present.
```

Settler movement should prioritize finding land over avoiding all Beasts.

## E3. Human hunting pressure

Keep existing rule:

```js
if (cell.unit === UNIT.BEAST && units.H >= 3) {
  disperseBeastAt(...)
}
```

This is good.

But with the movement change, Humans can actually approach Beasts in groups, so hunting becomes visible.

Optional improvement:

```text
If Beast has 2 Human neighbors and no escape to WILD/EMPTY, also disperse with lower probability.
```

Example:

```js
if (cell.unit === UNIT.BEAST && units.H >= 2 && !hasBeastEscapeCell(source, x, y, units.H) && Math.random() < 0.35) {
  disperseBeastAt(...)
}
```

Do not create Spirit from Beast dispersal.

---

# Part F — Beast reproduction brake

Current constants are too high for immortal Beasts:

```js
BEAST_BIRTH_CHANCE = 0.02
BEAST_RESTORE_CHANCE = 0.35
BEAST_TRAMPLE_FIELD_CHANCE = 0.25
```

Change to:

```js
const BEAST_BIRTH_CHANCE = 0.003;
const BEAST_RESTORE_CHANCE = 0.18;
const BEAST_TRAMPLE_FIELD_CHANCE = 0.08;
```

## F1. Strict Beast birth conditions

Current Beast birth allows:

```js
units.B === 1 || units.B === 2
```

Change to:

```js
units.B === 1
```

Also require:

```js
countUnitInRadius(source, x, y, UNIT.BEAST, 3, 4) <= 3
countUnitInRadius(source, x, y, UNIT.BEAST, 5, 7) <= 6
```

Add soft global brake:

```js
const totalBeasts = countWorld(source).units.B;
let effectiveBeastBirthChance = BEAST_BIRTH_CHANCE;
if (totalBeasts >= 50) effectiveBeastBirthChance *= 0.25;
if (totalBeasts >= 80) effectiveBeastBirthChance *= 0.05;
if (totalBeasts >= 120) effectiveBeastBirthChance = 0;
```

Use `effectiveBeastBirthChance`.

Track:

```js
beastBirthsBlockedByDensity
beastBirthsBlockedBySoftBrake
```

## F2. Optional cooldown

If easy:

```text
Add Beast breed cooldown.
Parent cooldown = 40 ticks.
Newborn cooldown = 60 ticks.
```

If not easy, skip cooldown for now but implement density + soft brake.

---

# Part G — Reduce Beast WILD painting

Current Beast terrain rewrite paints WILD too aggressively:

```js
if (EMPTY && fertility >= 3) terrain = WILD;
```

inside `BEAST_RESTORE_CHANCE = 0.35`.

Change logic:

```text
Beast can increase fertility somewhat often.
But EMPTY -> WILD should be rare.
```

Implementation:

```js
if (cell.unit === UNIT.BEAST) {
  if (cell.terrain === TERRAIN.MARK) {
    cell.terrain = TERRAIN.WILD;
    cell.terrainAge = 0;
    cell.fertility = clampFertility(cell.fertility + 2);
    currentTickEvents.marksCleanedByBeast += 1;
  } else if (cell.terrain === TERRAIN.FIELD && Math.random() < BEAST_TRAMPLE_FIELD_CHANCE) {
    cell.terrain = TERRAIN.WILD;
    cell.terrainAge = 0;
    cell.fertility = clampFertility(cell.fertility + 1);
    currentTickEvents.fieldTrampled += 1;
  } else if (cell.terrain === TERRAIN.EMPTY || cell.terrain === TERRAIN.WILD) {
    if (Math.random() < BEAST_RESTORE_CHANCE) {
      cell.fertility = clampFertility(cell.fertility + 1);
    }

    if (cell.terrain === TERRAIN.EMPTY) {
      const wildChance = cell.fertility >= 4 ? 0.05 : cell.fertility >= 3 ? 0.015 : 0;
      if (Math.random() < wildChance) {
        cell.terrain = TERRAIN.WILD;
        cell.terrainAge = 0;
        currentTickEvents.wildCreatedByBeast += 1;
      }
    }
  }
}
```

Add `wildCreatedByBeast` to events.

## G2. WILD decay without Beast maintenance

Add in terrain decay:

```text
If terrain == WILD
and no Beast within radius 2
and terrainAge > 30:
    with probability 0.015, WILD -> EMPTY
    fertility = max(fertility - 1, 2)
```

Track:

```js
wildDecayedToEmpty
```

This prevents WILD from becoming permanent green paint.

---

# Part H — Diagnostics to add

Add to `createEmptyEvents()` and cloneEvents:

```js
settlerForcedExplorationMoves: 0,
settlerRestTicks: 0,
settlersLeavingRest: 0,
settlersLostRoleWithoutFounding: 0,

settlerBlockedByOccupied: 0,
settlerBlockedByNoTarget: 0,
settlerBlockedByDanger: 0,
settlerBlockedByTerrain: 0,
settlerBlockedByNoValidStep: 0,

beastBirthsBlockedByDensity: 0,
beastBirthsBlockedBySoftBrake: 0,

wildCreatedByBeast: 0,
wildDecayedToEmpty: 0
```

Add to diagnostics if useful:

```js
activeSettlersWithValidMove: 0,
activeSettlersWithFoundingOpportunity: 0,
activeSettlersBlocked: 0,
beastBirthEligibleCells: 0,
beastLocalDensityBlockedCells: 0,
totalBeasts: 0,
totalWild: 0
```

Important invariant:

```text
If activeSettlers > 0 for many ticks:
    settlerMoves + settlementFoundings + settlerRestStops + blocked counters must also be > 0.
```

No silent settler inactivity.

---

# Part I — Step order

Current step order is:

```text
movement
lifecycleDeath
conflict
terrainRewrite
border
reproduction
settlerSpawns
fertility
decay
```

This is acceptable for now.

Do not change step order unless necessary.

But note:

```text
settlerSpawns happens after movement, so a newly created settler moves next tick.
```

That is fine after fixing role recognition and settler priority.

---

# Part J — Expected behavior after this patch

In Balanced / Human Migration tests:

```text
activeSettlers should visibly move.
settlerMoves should rise significantly.
settlementFoundings should become >0 in many seeds.
Humans should not appear completely static.
Groups of Humans should be able to pressure / hunt Beasts.
One nearby Beast should not prevent founding.
```

For Beasts:

```text
B should not explode from 18 to 245 by tick 140.
WILD should not rise from ~100 to 900 by tick 140.
beastRandomMoves should remain high.
beastBirths should be much lower.
```

Failure signs:

```text
activeSettlers > 10 but settlerMoves near 0.
settlementFoundings = 0 across migration tests.
B > 150 by tick 100.
WILD > 800 by tick 100.
spiritsCreatedByBeastDeath > 0.
spiritSpawnsFromMark > 0.
```

---

# Test checklist

Run and export recordings:

```text
Balanced Asymmetric Ecology Test 0-200
Human Migration Test 0-200
Human Expansion Test 0-200
Beast Dispersion Test 0-150
```

Check:

```text
1. settler role names work with suffixes.
2. activeSettlers produce movement/founding/rest/blocked counters.
3. settlementFoundings > 0 in at least some Human Migration / Expansion seeds.
4. Humans can move toward Beasts in groups.
5. Beast dispersal still does not create Spirit.
6. Beast births are much lower.
7. WILD spread is slower and can decay.
8. No MARK -> Spirit spawning.
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
V0.8.2 is a code-review fix:
- Settler role suffixes are now recognized consistently.
- Settler movement runs before normal Human stay behavior.
- Founding conditions are relaxed so migration can close its loop.
- Humans no longer universally fear Beasts; isolated Humans avoid, grouped Humans can hunt/drive Beasts.
- Beast reproduction and WILD painting are heavily braked.
```

---

# Completion report

When finished, report:

```text
files changed
rules version
settler role fixes
settler movement fixes
founding changes
human-beast hunting changes
beast reproduction changes
WILD spread/decay changes
diagnostic additions
tests run
remaining issues
```
