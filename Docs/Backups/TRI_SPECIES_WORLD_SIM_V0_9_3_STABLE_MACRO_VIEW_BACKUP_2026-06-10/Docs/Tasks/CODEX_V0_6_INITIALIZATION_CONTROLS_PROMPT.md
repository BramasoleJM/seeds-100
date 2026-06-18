# CODEX_V0_6_INITIALIZATION_CONTROLS_PROMPT.md

Copy this prompt into Codex after or alongside the V0.6 fertility + migration implementation.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
CODEX_V0_6_FERTILITY_MIGRATION_PROMPT.md
```

Act as Executor.

This is an add-on / correction for V0.6.

Do not add new terrain symbols.

Do not add lore text, tarot, multi-screen map, resources, buildings, or visual polish.

---

## Why this change is needed

V0.6 changes the model:

```text
Humans = settlements and migrants guided by fertility.
Beasts = roaming fertility-restoring life-force carriers.
Spirits = manifestations around MARK / FIELD / human pressure, not normal breeding animals.
```

Therefore the old initialization is no longer valid.

Old initialization assumes:

```text
H / B / S are all normal populations.
FIELD / WILD / MARK are just color territories.
```

V0.6 needs initialization that separates:

```text
unit counts
terrain traces
fertility distribution
latent spirit conditions
```

Especially:

```text
Spirit unit count S can be 0,
but MARK traces may still exist,
allowing Spirits to manifest later.
```

---

# PART A — Custom initialization controls

Add UI controls that allow the user to freely set initial counts.

Required numeric inputs:

```text
Initial Humans
Initial Beasts
Initial Spirits
Initial FIELD patches
Initial WILD patches
Initial MARK patches
Initial BLOCK count
Random seed
```

Defaults:

```text
Initial Humans = 24
Initial Beasts = 18
Initial Spirits = 0

Initial FIELD patches = 3
Initial WILD patches = 5
Initial MARK patches = 3
Initial BLOCK count = 20
Random seed = random or editable number
```

Important:

```text
Initial Humans, Beasts, and Spirits must allow 0.
They must allow 1.
They must allow larger values.
Do not clamp minimum to 2 or more.
```

Recommended max on 40 x 25 grid:

```text
Humans max = 300
Beasts max = 300
Spirits max = 200
Terrain patches max = 20
Blocks max = 120
```

If implementing sliders, also allow manual number input.

---

# PART B — Reset behavior

Implement clear reset behavior:

```text
Reset = return to the last generated initial state.
Randomize = generate a new initial state using current UI parameters.
Apply Initial Settings = regenerate initial state from current settings.
```

This distinction matters.

Required behavior:

```text
1. Randomize reads current input values.
2. Randomize creates a new world and stores it as currentInitialWorld.
3. Reset restores currentInitialWorld exactly.
4. Step / Play then evolve from that reset state.
```

Do not make Reset randomize again.

---

# PART C — Presets

Add preset buttons or dropdown options if easy.

Recommended presets:

## 1. Balanced Fertility Test

```text
H = 24
B = 18
S = 0
FIELD patches = 3
WILD patches = 5
MARK patches = 3
```

Purpose:

```text
Default V0.6 test.
Spirits begin latent, not as a normal population.
```

## 2. No Spirit Control

```text
H = 24
B = 18
S = 0
MARK patches = 0
```

Purpose:

```text
Test Human-Beast fertility ecology without Spirit.
```

## 3. Spirit Dormant Test

```text
H = 20
B = 12
S = 0
MARK patches = 6
```

Purpose:

```text
Test whether Spirits can manifest later from MARK + Human/FIELD pressure.
```

## 4. Spirit Active Test

```text
H = 20
B = 12
S = 6
MARK patches = 5
```

Purpose:

```text
Test active Spirit pressure.
```

## 5. Human Migration Test

```text
H = 36
B = 8
S = 0
FIELD patches = 2
WILD patches = 4
MARK patches = 1
```

Purpose:

```text
Test whether crowded settlements send migrants toward fertile land.
```

## 6. Beast Recovery Test

```text
H = 0
B = 20
S = 0
FIELD patches = 0
WILD patches = 4
MARK patches = 0
```

Purpose:

```text
Test Beast roaming and fertility restoration without Human/Spirit.
```

## 7. Empty Land Fertility Test

```text
H = 0
B = 0
S = 0
FIELD patches = 0
WILD patches = 0
MARK patches = 0
```

Purpose:

```text
Test fertility drift and terrain stability without units.
```

---

# PART D — V0.6 initial state generation

Do not spawn units uniformly across the whole map by default.

Use patch-based generation.

## D1. FIELD / Human patches

For each FIELD patch:

```text
choose a patch center
create a small FIELD area radius 2-4
set fertility around 45-70
place Humans near FIELD patch according to target count
```

Humans should start in clusters, not random noise.

If Initial Humans is 0:

```text
create FIELD patches if requested,
but do not place Humans.
FIELD may decay later.
```

If Initial FIELD patches is 0:

```text
Humans may still be placed if Initial Humans > 0,
but they should be placed in small groups on EMPTY with moderate fertility.
```

## D2. WILD / Beast patches

For each WILD patch:

```text
choose a patch center
create WILD area radius 3-6
set fertility around 65-95
place Beasts as small packs near WILD patch
```

Beast packs should be sparse.

Example:

```text
pack size 2-5
```

If Initial Beasts is 0:

```text
create WILD patches if requested,
but do not place Beasts.
```

## D3. MARK / Spirit traces

MARK is not the same as Spirit population.

For each MARK patch:

```text
choose a patch center
create MARK area radius 2-4
set fertility around 35-75
```

Spirit placement depends only on Initial Spirits.

If Initial Spirits is 0:

```text
do not place any Spirit units.
MARK traces remain and may later trigger manifestations.
```

If Initial Spirits > 0:

```text
place Spirits near MARK patches,
preferably not too dense.
```

Recommended active Spirit cluster:

```text
1-3 Spirits per MARK patch, until Initial Spirits count is reached.
```

If Initial Spirits > 0 but MARK patches = 0:

```text
create tiny MARK traces under or near Spirits.
```

---

# PART E — Fertility generation

Add fertility generation independent of terrain.

Base map:

```text
Each non-BLOCK cell gets fertility 20-60.
```

Then modify by terrain:

```text
FIELD: set / blend fertility to 40-70
WILD: set / blend fertility to 65-95
MARK: set / blend fertility to 35-75
```

Optional but recommended:

```text
Add smooth fertility blobs independent of terrain.
```

For example:

```text
2-5 fertility hotspots
radius 4-8
fertility +15 to +35
```

This lets settlers discover fertile empty land.

Important:

```text
Not all fertile places should already be WILD or FIELD.
Some fertile EMPTY land should exist.
```

This is crucial for migration.

---

# PART F — Unit count exactness

When user sets Initial Humans = N:

```text
the generated world should contain exactly N Humans unless there is no available space.
```

Same for Beasts and Spirits.

If exact placement fails due to crowding:

```text
place as many as possible
show warning:
"Could only place X / N Humans"
```

Do not silently clamp counts to old defaults.

---

# PART G — Edge cases

Support these cases without crashing:

```text
H = 0, B = 0, S = 0
H = 1, B = 0, S = 0
H = 0, B = 1, S = 0
H = 0, B = 0, S = 1
H = 0, B = 20, S = 0
H = 20, B = 0, S = 0
H = 20, B = 0, S = 0, MARK patches = 5
H = 20, B = 10, S = 0, MARK patches = 5
```

Rules should naturally produce no births if required species support is absent.

Example:

```text
If H = 0, no Human births should occur.
If B = 0, no Beast births should occur unless future rules explicitly introduce beasts.
If S = 0 but MARK patches exist, Spirits may manifest later if V0.6 manifestation rules are satisfied.
```

---

# PART H — JSON export changes

Snapshot and recording JSON should include initialization settings.

Add:

```js
initialSettings: {
  initialHumans,
  initialBeasts,
  initialSpirits,
  initialFieldPatches,
  initialWildPatches,
  initialMarkPatches,
  initialBlockCount,
  randomSeed,
  presetName
}
```

Snapshot world should include:

```js
fertilityRows
```

Recording summary should include:

```js
initialSettings
```

This lets us reproduce and analyze a run.

---

# PART I — UI clarity

Add UI labels explaining:

```text
Initial Spirits = active Spirit units.
MARK patches = latent Spirit traces.
```

This distinction is important.

Add a small note:

```text
In V0.6, Spirits can start at 0. MARK traces may still allow Spirits to manifest later.
```

---

# Expected result

After this patch:

```text
User can test controlled experiments.
User can set any species to 0 or 1.
Spirit initialization matches V0.6 logic.
Reset is deterministic.
Randomize uses current settings.
Fertility hotspots can guide Human migration.
Beasts start as sparse packs.
Spirits can be latent instead of always active population.
```

---

# Test checklist

Run these tests:

```text
1. H=0, B=0, S=0, all patches 0: opens and runs without crashing.
2. H=1, B=0, S=0: one Human appears.
3. H=0, B=1, S=0: one Beast appears.
4. H=0, B=0, S=1: one Spirit appears, with tiny MARK if needed.
5. H=20, B=10, S=0, MARK patches=5: no Spirits at tick 0, possible manifestation later.
6. Press Reset after 50 ticks: exact initial state restored.
7. Press Randomize: new state generated from current settings.
8. Export Snapshot JSON: initialSettings and fertilityRows are included.
```

---

# Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add a section:

```text
Initialization and presets
```

Mention:

```text
V0.6 separates active Spirit units from MARK traces.
Initial unit counts are fully user-configurable.
Reset restores last generated initial state.
Randomize generates a new initial state from UI settings.
```

---

# Completion report

Report:

```text
files changed
new UI controls
new presets
reset/randomize behavior
edge cases tested
JSON export changes
known simplifications
```
