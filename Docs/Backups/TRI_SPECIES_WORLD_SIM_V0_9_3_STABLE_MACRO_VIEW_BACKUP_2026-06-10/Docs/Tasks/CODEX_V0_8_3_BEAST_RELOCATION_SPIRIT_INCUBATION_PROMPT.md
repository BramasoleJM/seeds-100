# CODEX_V0_8_3_BEAST_RELOCATION_SPIRIT_INCUBATION_PROMPT.md

Copy this prompt into Codex.

This is a focused V0.8.3 patch based on the current `sim.js`.

Do not treat this as a conceptual rebase.

The current version already has some emergence:
- Settlers can move and found.
- Beast birth is no longer explosively high.
- MARK no longer spawns Spirit.
- Beast death does not create Spirit.

But two problems remain:
1. Beasts can disappear too easily, so the stable purification loop collapses.
2. Spirit is still too immediate: once S appears, it can affect / kill / convert Humans too quickly.

Set rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
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

Do not restore 0-100 fertility.

Do not make Beast naturally die.

Do not make Beast create Spirit.

Do not make MARK spawn Spirit.

Do not add economy/resources/buildings/multi-screen map/tarot/lore text.

---

# Design goal

The goal is:

```text
Beast = stable mobile purifier / natural recovery force.
Spirit = delayed outbreak with warning time, not instant killer.
Human = can flee during Spirit incubation.
```

Current behavior to fix:

```text
Beast dispersal removes B from the world too often.
S appears and can immediately infect/convert Humans.
```

New desired loop:

```text
Human death / corruption creates immature Spirit.
Immature Spirit has a few warning ticks.
Nearby Humans may flee or become crisis settlers.
Beasts can cleanse immature Spirit before it matures.
If Spirit survives incubation, it becomes active and can spread / infect.
Beasts remain stable by relocating when driven away instead of disappearing.
```

---

# Part A — Add Spirit incubation

Add constant near Spirit constants:

```js
const SPIRIT_INCUBATION_TICKS = 3;
```

Meaning:

```text
A Spirit with age < SPIRIT_INCUBATION_TICKS is dormant / incubating.
It is visible as S, but not yet fully active.
```

Add helper:

```js
function isDormantSpirit(cell) {
  return cell.unit === UNIT.SPIRIT && (cell.age || 0) < SPIRIT_INCUBATION_TICKS;
}

function isActiveSpirit(cell) {
  return cell.unit === UNIT.SPIRIT && (cell.age || 0) >= SPIRIT_INCUBATION_TICKS;
}
```

Use these helpers consistently.

---

# Part B — Dormant Spirit behavior

Dormant Spirit should not act like a mature plague.

For S with age < SPIRIT_INCUBATION_TICKS:

```text
1. It does not infect Human.
2. It does not convert Human to Spirit.
3. It does not create MARK trails through movement.
4. It should not actively chase Humans.
5. It can be cleansed by nearby Beasts more easily.
6. It creates warning / retreat pressure for nearby Humans.
```

Implementation options:

## B1. Movement

Simplest:

```text
Dormant S does not move.
```

In `chooseMove()`:

```js
if (unit === UNIT.SPIRIT && isDormantSpirit(source[y][x])) {
  return { x, y };
}
```

This is recommended.

Alternative if you want subtle motion:

```text
Dormant S may move with 0.1 chance, but does not leave MARK trail.
```

But first implement no movement.

## B2. No MARK trail from dormant S

In `planMovements()`, when S moves and old cell becomes MARK, add:

```js
if (didMove && plan.unit === UNIT.SPIRIT && !isDormantSpirit(source[plan.fromY][plan.fromX])) {
  // leave MARK trail
}
```

If dormant S is not moving, this still guards future changes.

## B3. No Human infection from dormant S

All Human infection / conversion checks must only count active Spirit, not dormant Spirit.

Add helpers:

```js
function countActiveSpiritNeighbors(source, x, y) {
  let count = 0;
  for (const n of getNeighbors(x, y)) {
    if (isActiveSpirit(source[n.y][n.x])) count += 1;
  }
  return count;
}
```

Use this in Human infection logic.

Important places:
- `applyLifecycleDeath()`
- `applyPrimaryConflict()`
- any logic using `units.S` for Human infection / conversion

Dormant S may create warning pressure but should not infect.

---

# Part C — Human warning / escape during incubation

Dormant Spirit should give Humans a chance to escape.

Add helper:

```js
function countDormantSpiritNeighbors(source, x, y) {
  let count = 0;
  for (const n of getNeighbors(x, y)) {
    if (isDormantSpirit(source[n.y][n.x])) count += 1;
  }
  return count;
}
```

When a Human is adjacent to dormant S:

```text
core Human:
    very low chance to become crisis settler or retreat

edge Human:
    moderate chance to become crisis settler / move away

isolated Human:
    high chance to become crisis settler / flee
```

Recommended implementation in `applySettlerSpawns()`:

Add to pressure checks:

```js
const dormantSpiritPressure = countDormantSpiritNeighbors(source, x, y) > 0;
```

Then:

```js
if (dormantSpiritPressure) {
  if exposure === "isolated": chance 0.45
  if exposure === "edge": chance 0.25
  if exposure === "core": chance 0.08
}
```

If triggered:

```js
next[y][x].role = "settler_seeking_crisis";
currentTickEvents.crisisSettlerDepartures += 1;
currentTickEvents.spiritWarningFlees += 1;
```

Add event:

```js
spiritWarningFlees: 0
```

Also in `movementScore()` / `chooseMove()` for normal Humans:

```text
If adjacent dormant S and not core, prefer moves away from dormant S.
```

Keep this simple. The key is to make dormant S a warning, not instant damage.

---

# Part D — Remove direct Human -> Spirit conversion from primary conflict

This is critical.

Current `applyPrimaryConflict()` still has direct conversion:

```js
if (cell.unit === UNIT.HUMAN && units.S >= 1 && spiritPressure >= 2) {
  if (units.H < 2) {
    next[y][x].unit = UNIT.SPIRIT;
    ...
    trackConversion(UNIT.HUMAN, UNIT.SPIRIT);
  }
}
```

This bypasses the more nuanced lifecycle infection system.

Replace it with:

```text
No direct H -> S conversion in applyPrimaryConflict.
```

Instead:

```text
If active Spirit pressure is nearby:
    mark warning / retreat pressure only.
```

All actual Spirit infection must happen in `applyLifecycleDeath()`.

In `applyLifecycleDeath()`, infection must use only active Spirit:

```js
const activeSpiritNeighbors = countActiveSpiritNeighbors(source, x, y);
if (activeSpiritNeighbors > 0 && !dies) {
  // infection logic
}
```

Do not use dormant S for infection.

---

# Part E — Lower Human death -> Spirit probability

Current `resolveHumanDeathAt()`:

```js
const spiritChance = cause === "spirit" ? 0.4 : cause === "natural" ? 0.2 : 0.25;
```

This is too high.

Change to:

```js
let spiritChance = cause === "spirit" ? 0.25 : cause === "natural" ? 0.05 : 0.10;
```

Add local Spirit density cap:

```js
if (countUnitInRadius(target, x, y, UNIT.SPIRIT, 4, 3) >= 3) {
  spiritChance = 0;
}
```

Add early death protection:

```js
if (tick < 10 && cause !== "spirit") {
  spiritChance = 0;
}
```

Interpretation:

```text
Early initialization deaths should not immediately create a Spirit outbreak.
Spirit infection can create Spirit, but with lower chance.
If the local area already has several Spirits, new deaths become MARK instead.
```

Update diagnostics if needed:

```js
humanDeathsToSpirit
humanDeathsToMark
spiritSpawnBlockedByLocalDensity
spiritSpawnBlockedByEarlyGrace
```

---

# Part F — Beast dispersal should relocate first, remove only if necessary

Current `disperseBeastAt()` removes the Beast:

```js
cell.unit = null;
```

This makes Beast too unstable.

Change behavior:

```text
When Beast is dispersed by Humans or overcrowding:
    keep purification effect at original cell.
    then try to relocate the Beast to a nearby valid WILD / EMPTY fertility >= 3 cell.
    only remove Beast if no relocation target exists.
```

Add helper:

```js
function findBeastRelocationTarget(source, x, y) {
  // Search radius 4-8.
  // Prefer WILD fertility 4, WILD fertility 3, EMPTY fertility 4, EMPTY fertility 3.
  // Avoid occupied cells, BLOCK, BORDER, adjacent 2+ Humans, adjacent 2+ Beasts.
}
```

Suggested scoring:

```text
WILD fertility 4: best
WILD fertility 3
EMPTY fertility 4
EMPTY fertility 3
farther from dense Humans
not too close to other Beasts
```

Then in `disperseBeastAt(target, source, x, y)`:

```text
1. Clear original cell.
2. Original cell becomes WILD, fertility = 4.
3. Clean adjacent M/S as currently implemented.
4. Try to place B at relocation target.
5. If relocated:
      targetCell.unit = B
      targetCell.age = 0 or original age
      targetCell.role = "pack"
      beastRelocations += 1
   Else:
      Beast is removed
      beastDispersalRemovals += 1
```

Add events:

```js
beastRelocations: 0,
beastDispersalRemovals: 0
```

Important:

```text
Do not duplicate Beast.
Do not leave B at original cell if relocating.
Do not create Spirit from Beast dispersal.
```

---

# Part G — Beast should cleanse adjacent M/S, not only when stepping on them

Add stable purification pass.

Implement either as a small function after movement or inside terrain rewrite:

```js
function applyBeastAuraCleansing(source) { ... }
```

Recommended place:

```text
After applyConflict() and before applyTerrainRewrite(), or inside applyTerrainRewrite().
```

Rules:

For each Beast:

```text
If adjacent active or dormant S:
    choose one adjacent S.
    If S is dormant:
        70% remove S.
    If S is active:
        S age += 2, and 35% remove S.
    If removed:
        terrain -> WILD
        fertility += 1
        spiritSuppressedByBeast += 1
        beastAuraSpiritCleansed += 1

Else if adjacent MARK:
    choose one adjacent MARK.
    45% MARK -> WILD
    fertility += 1
    marksCleanedByBeast += 1
    beastAuraMarksCleaned += 1
```

Add events:

```js
beastAuraSpiritCleansed: 0,
beastAuraMarksCleaned: 0
```

This makes Beasts reliable purifiers.

Important:

```text
Do not require Beast to step exactly onto M/S.
```

---

# Part H — Spirit lifecycle with incubation

In `applyLifecycleDeath()` for Spirit:

Current logic:

```js
adjustedAge = age + (units.B === 1 ? 2 : 0)
dies = units.B >= 2 || adjustedAge >= maxAge
```

Change to account for dormant S:

```text
Dormant S:
    age += 1 normally.
    If adjacent Beast:
        very high suppression chance.
    Does not infect.
    Does not move.

Active S:
    age += 1.
    If adjacent Beast:
        age += 2.
    If 2+ adjacent Beasts:
        remove.
```

Recommended:

```js
if (cell.unit === UNIT.SPIRIT) {
  const maxAge = cell.maxAge || spiritMaxAge();
  const dormant = age < SPIRIT_INCUBATION_TICKS;

  if (dormant && units.B >= 1 && Math.random() < 0.7) {
     dies = true;
     currentTickEvents.spiritSuppressedByBeast += 1;
  } else {
     const adjustedAge = age + (!dormant && units.B >= 1 ? 2 : 0);
     dies = units.B >= 2 || adjustedAge >= maxAge;
  }
}
```

When dormant S dies:

```text
It may disappear without leaving MARK, or leave weaker MARK.
```

I recommend:

```text
Dormant S suppressed by Beast -> terrain WILD, no MARK.
Dormant S natural timeout -> MARK.
Active S death -> MARK.
```

This makes Beast prevention feel good.

---

# Part I — No Spirit Control preset

Currently `No Spirit Control` can still produce Spirit because Human death creates S.

Choose one of two approaches.

Recommended:

```text
Rename No Spirit Control to No Initial Spirit Test if you want death->S enabled.
```

But for debugging, add a true no-spirit mode:

```text
If presetName === "No Spirit Control":
    disable death -> S
    disable H_to_S conversion
```

Simpler:

```js
function isNoSpiritControlMode() {
  return currentInitialSettings?.presetName === "No Spirit Control";
}
```

Then:

```js
if (isNoSpiritControlMode()) {
  spiritChance = 0;
}
```

Also skip conversion in lifecycle infection.

This gives a clean control group.

---

# Part J — Diagnostics additions

Add to `createEmptyEvents()` and `cloneEvents()`:

```js
spiritWarningFlees: 0,
spiritSpawnBlockedByLocalDensity: 0,
spiritSpawnBlockedByEarlyGrace: 0,

beastRelocations: 0,
beastDispersalRemovals: 0,

beastAuraSpiritCleansed: 0,
beastAuraMarksCleaned: 0,

dormantSpiritSuppressedByBeast: 0,
activeSpiritSuppressedByBeast: 0
```

Add to diagnostics if useful:

```js
dormantSpirits: 0,
activeSpirits: 0,
humansAdjacentToDormantSpirit: 0,
humansAdjacentToActiveSpirit: 0,
beastsAdjacentToSpirit: 0,
beastsAdjacentToMark: 0
```

Update `updateStateDiagnostics()` to count dormant/active S.

---

# Part K — Expected behavior

After this patch:

```text
Spirit should no longer instantly kill or convert Humans on birth.
Humans adjacent to newborn Spirit should have a short window to flee.
Beasts should cleanse newborn Spirit before it matures if nearby.
Beasts should not disappear too easily; dispersal should usually relocate them.
M/S cleansing by Beasts should be visible and stable.
No Spirit Control should be a true control if implemented.
```

Success signs:

```text
beastRelocations > beastDispersalRemovals
beastAuraSpiritCleansed > 0 when S appears near Beasts
spiritWarningFlees > 0 when dormant S appears near Humans
H_to_S decreases significantly
early tick 1-5 Spirit outbreaks are less catastrophic
B does not go extinct quickly in normal tests
```

Failure signs:

```text
S still converts many Humans immediately after creation.
B still goes extinct by early/mid run.
beastDispersals mostly remove B.
No Spirit Control still creates S if true control mode is intended.
```

---

# Test checklist

Run and export:

```text
Balanced Asymmetric Ecology Test 0-200
Human Migration Test 0-200
Human Expansion Test 0-200
No Spirit Control 0-150
Spirit Outbreak Test 0-150
```

Check:

```text
1. Dormant S exists for 3 ticks before active infection.
2. Humans near dormant S can flee / become crisis settlers.
3. Beast aura cleansing suppresses some S/M.
4. Beast dispersal relocates most Beasts instead of deleting them.
5. H_to_S is lower.
6. Early tick 1-5 Human deaths do not immediately create huge S outbreaks.
7. Beasts remain present as stable purification force.
8. No Spirit Control behaves as expected.
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
V0.8.3 introduces Spirit incubation:
- New Spirit is dormant for 3 ticks.
- Dormant Spirit cannot infect or spread.
- Humans can flee during incubation.
- Beasts can cleanse dormant Spirit more easily.

V0.8.3 also changes Beast dispersal:
- Beast dispersal relocates Beasts when possible.
- Beast removal only happens if no relocation target exists.
- Beasts now cleanse adjacent M/S, not only cells they step onto.
```

---

# Completion report

When finished, report:

```text
files changed
rules version
Spirit incubation implementation
Human warning/flee behavior
removed direct conflict H->S conversion
death->Spirit probability changes
Beast relocation implementation
Beast aura cleansing implementation
diagnostic additions
tests run
known issues
```
