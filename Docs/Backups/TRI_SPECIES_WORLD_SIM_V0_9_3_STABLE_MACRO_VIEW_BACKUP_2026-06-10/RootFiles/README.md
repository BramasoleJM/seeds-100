# Tri-Species Cellular World Prototype

This is the first visual demo for the single-screen tri-species cellular automata prototype.

## How to run

Open `index.html` in a browser. The demo starts paused by default.

No framework, build step, network calls, or external libraries are required.

The current stability build uses a `40 x 25` grid and clamps Play speed to at least `100ms` per tick so the browser can open safely and run extended tests.

## What this prototype tests

The demo tests whether three visible unit types can create readable dynamics through movement, fertility, terrain rewriting, lifecycle, group behavior, conflict, conversion, reproduction, and terrain decay on one grid. V0.9 also adds an observer-only Macro World Layer that interprets the grid as places, routes, events, and map icons.

This version does not implement a Zelda-style multi-screen map, tarot mechanics, story systems, resources, villages, NPCs, quests, or save/load.

## Units

```text
H = Human
B = Beast
S = Spirit
```

## Terrain

```text
. = EMPTY, neutral ground
F = FIELD, Human-made terrain
W = WILD, Beast-made terrain
M = MARK, Spirit-made terrain
X = BORDER, temporary conflict / stalemate terrain
# = BLOCK, fixed obstacle
```

## Tick order

Each tick runs in this order:

```text
1. Movement
2. Lifecycle / natural death
3. Conflict / death / conversion
4. Terrain rewrite by surviving units
5. Reproduction and settler / manifestation events
6. Fertility dynamics
7. Terrain decay
8. Render and statistics update
```

The implementation uses synchronous updates by creating a fresh world for each phase:

```text
oldWorld -> movementWorld -> lifecycleWorld -> conflictWorld -> terrainWorld -> reproductionWorld -> settlerWorld -> fertilityWorld -> decayWorld
```

## Implemented rules

Movement uses the 8-neighborhood. Units move at most one cell per tick, cannot enter BLOCK, and cannot enter terrain forbidden by their species. If multiple units choose the same target, those moves are cancelled and the units stay in their original cells.

Each cell carries `fertility` from 0 to 100. Units carry `age` and `role`. Roles are `normal`, `settler`, `pack`, and `manifestation`.

Humans form small FIELD settlements. Settlers prefer EMPTY, then FIELD, then WILD, and avoid heavy Beast or Spirit pressure.

Beasts move as roaming packs. Near strong Human groups they prefer to flee toward safer WILD or EMPTY cells.

Spirits are temporary manifestations. They prefer isolated Human pressure, FIELD edges, MARK, then EMPTY, and avoid heavy Beast pressure.

Terrain rewrite is group/probability based:

```text
Humans make FIELD from EMPTY with Human support, and from WILD only with stronger support.
Beasts always turn FIELD/MARK to WILD, but only sometimes spread WILD onto EMPTY.
Spirits turn FIELD to MARK, sometimes mark EMPTY, and need Spirit support to mark WILD.
```

Conflict rules are implemented:

```text
2+ Humans remove unsupported Beasts.
2+ Beasts remove unsupported Spirits.
Active Spirit plus MARK pressure converts isolated Humans.
Supported Humans resist Spirit pressure.
Supported stalemates can leave BORDER.
```

Lifecycle death, fertility-driven Human decline and migration, isolation death, overcrowding death, settlement reproduction, Beast pack reproduction, Spirit manifestation, FIELD decay, WILD decay, MARK decay, BORDER decay, and permanent BLOCK behavior are implemented.

## Rules version

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

Current version split:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Influence view patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
Stability patch: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

V0.9.3 Macro View Stability:

```text
Beast recovery zones use soft scoring instead of a hard average-fertility cutoff.
Previously visible Beast recovery regions can persist briefly as quiet_habitat or fading_recovery.
Macro View uses retained macro regions to prevent green Beast/WILD areas from flickering off immediately.
Old letter/symbol macro icons are now debug-only and disabled by default.
Macro View should be read primarily through colored regions, frontier outlines, and route markings.
```

V0.9.2 Influence Macro View:

```text
Macro View now displays influence regions rather than raw terrain fragments.
Human settlement influence includes FIELD, Human units, and nearby Human-on-FIELD support.
Beast/wild recovery influence includes WILD, Beast presence, fertile EMPTY near Beasts, and nearby WILD + Beast pressure.
Beast recovery zones can appear even when pure WILD terrain is fragmented.
Spirit scars use clustered MARK influence instead of single MARK specks.
Small terrain fragments are muted in Macro View.
Cell View remains unchanged for low-level debugging.
```

V0.9.1 Macro View / Field Decay:

```text
Cell View remains the detailed simulation grid.
Macro View fades low-level noise and highlights continuous settlement, abandoned, wild recovery, scar, frontier, and route shapes.
Old FIELD without Humans in radius 2 can decay toward EMPTY.
FIELD near clustered MARK can remain briefly as ruin/scar residue or become MARK.
Beast cleansing can create small adjacent WILD recovery patches without increasing Beast reproduction.
Snapshot and recording macroWorld exports include a display mask summary.
```

V0.8.4 Readable Macro Patterns:

```text
This is a readability / pattern-shaping patch, not a conceptual rebase.
Human birth is lower and prefers FIELD core support.
Low-fertility crowded settlements more readily create crisis settlers instead of only local boom.
Dense fertile WILD persists longer as readable wild cores.
Beast relocation mildly prefers existing WILD clusters.
Isolated MARK fades faster, while clustered MARK persists as scars.
Abandoned depleted FIELD near MARK can remain briefly or become MARK, making failed settlements easier to read.
Macro routes age into old/abandoned route states.
Spirit outbreaks can transition into aftermath/scar evidence instead of staying active.
```

V0.9 Macro World Layer:

```text
This is an observer/interpreter layer, not an ecology rebase.
It detects settlements, abandoned settlements, Beast recovery zones, Spirit outbreaks, Spirit scars, migration routes, and Human/Beast frontiers.
It preserves macro ids, age, last seen tick, confidence, metrics, and state history.
It adds macroWorld to snapshot export and macroWorld / macroFrames / compact frame macro summaries to recording export.
The Show Macro Icons toggle displays simple overlay markers only; icons do not affect simulation rules.
```

V0.8.3 Beast Relocation / Spirit Incubation:

```text
This is a focused patch, not a new conceptual rebase.
New Spirit is dormant for 3 ticks.
Dormant Spirit cannot infect, chase, spread, or leave MARK trails.
Humans near dormant Spirit can flee as crisis settlers.
Human death creates Spirit less often, with early non-spirit death grace and local Spirit density caps.
Beast dispersal relocates Beasts when possible; removal only happens if no relocation target exists.
Beasts cleanse adjacent M/S, not only cells they step onto.
No Spirit Control disables death-to-Spirit and H-to-S conversion.
```

V0.8.2 Code Review Movement / Hunting Fix:

```text
This is a targeted implementation repair, not a new conceptual rebase.
Settler role suffixes are recognized consistently.
Settler movement runs before normal Human stay-in-FIELD behavior.
Founding conditions are relaxed so migration can close its loop.
Humans no longer universally fear Beasts: isolated Humans avoid, grouped Humans can hunt or drive Beasts.
Beast reproduction and EMPTY -> WILD painting are heavily braked.
Old WILD without Beast maintenance can slowly decay back to EMPTY.
```

V0.8 Asymmetric Ecology Rebase:

```text
Human, Beast, and Spirit are no longer symmetric populations.
Humans are the expansion species: supported settlements reproduce more strongly and can send visible settlers outward.
Human crisis migration is also stronger: poor support, low fertility, MARK pressure, or nearby Spirit can push people to flee.
Beasts do not die of old age. When dense Humans drive them away, they disperse back into WILD, restore fertility, and suppress nearby MARK / Spirit.
Beast dispersal never creates Spirit.
Spirit now mainly comes from Human death or failed Human stability.
Spirit threatens isolated and edge Humans, but supported settlement cores resist infection.
WILD patches and Beast starts are more scattered by default.
```

V0.7.1 Rot Containment Combined:

```text
Death now creates active Spirit directly.
Spirit movement and Spirit death leave MARK.
MARK no longer passively spawns Spirit.
MARK is passive residue: it blocks Humans, attracts Beasts, decays, and can be cleaned.
Human settlements resist infection better when supported.
Beast random walk remains visible unless dense Humans, active Spirit, or clustered MARK are nearby.
Diagnostics were corrected for nearby M/S and actual movement counters.
```

V0.7 Rot-Migration Rebase:

```text
Fertility is now a discrete 0-4 land level, not a 0-100 value.
FIELD is not fixed fertility; it inherits the land level and usually lowers it by one when created.
Human death and Beast death directly create MARK.
MARK can still be fertile, but Humans cannot use it directly.
Spirits emerge from aged MARK as short-lived plague waves.
Beasts mostly random-walk, but flee dense Humans and move toward MARK / Spirits.
Beasts clean MARK into WILD and raise fertility.
Humans use local support / demand to reproduce, migrate, or decline.
```

V0.6 fertility + migration changes:

```text
DEPLETED terrain is explicitly not implemented.
Cells store numeric fertility.
FIELD near Humans drains fertility; WILD restores fertility; MARK and EMPTY drift toward neutral values.
Human births require fertile FIELD support.
Crowded or poor-fertility Humans can become settlers without creating new population.
Settlers found FIELD only where nearby fertility is high enough.
Beasts wander as low-birth fertility carriers.
Spirits are short-lived manifestations around fertile MARK, FIELD pressure, and abandoned FIELD.
Recording frames include fertility stats, settlerDepartures, settlementFoundings, and spiritManifestations.
```

## Initialization and presets

V0.6 separates active unit counts from terrain traces:

```text
Initial Spirits = active Spirit units.
Initial MARK patches = latent Spirit traces.
```

Initial Humans, Beasts, and Spirits can each be 0, 1, or larger values. FIELD, WILD, MARK, BLOCK count, and random seed are also editable.

V0.8 presets:

```text
Balanced Asymmetric Ecology Test
No Spirit Control
Human Expansion Test
Human Migration Test
Beast Dispersion Test
Spirit Outbreak Test
```

Reset / Randomize behavior:

```text
Reset restores the last generated initial state exactly.
Randomize reads current settings, writes a new random seed, and generates a new initial state.
Apply Initial Settings regenerates from the current settings and seed.
```

Snapshot JSON includes `initialSettings` and `world.fertilityRows` as 0-4 digit strings. Recording summary includes `initialSettings`.

V0.5 lifecycle + group behavior changes:

```text
DEPLETED terrain is explicitly not implemented.
Units have age and roles.
Natural death prevents permanent saturation.
Humans reproduce in supported settlements and crowded clusters can spawn settlers.
Beasts reproduce rarely, roam as packs, and avoid strong Human groups.
Spirits manifest near MARK plus Human/FIELD pressure and fade away elsewhere.
Recording frames include naturalDeaths, conflictDeaths, settlerSpawns, and spiritManifestations.
```

## Simplifications

Movement tie-breaking uses random choice among equally preferred cells.

Conflict is applied first, then isolation death, then overcrowding death within the conflict phase.

V0.3 adds Beast- and Spirit-specific overpopulation death on top of the general overcrowding rule.

BORDER decay checks for at least two different unit types in the adjacent 8-neighborhood. The BORDER cell itself is not counted because BORDER cells cannot hold units after conflict in this prototype.

Randomize creates clustered playable starts rather than uniform noise.

## What to observe

Watch whether Humans form FIELD clusters, Beasts raid FIELD into WILD, and Spirits create MARK pressure near Humans.

Useful first tests:

```text
1. Press Step several times and check that terrain colors visibly change under units.
2. Press Play and watch whether any one species instantly dominates.
3. Toggle Movement off and compare whether reproduction/conflict alone still creates changes.
4. Lower or raise Overcrowding and observe whether clusters collapse or spread.
5. Use Randomize to test if dynamics survive different clustered starts.
```

## JSON export

Use **Export Snapshot JSON** to download the current full grid state. The snapshot includes parameters, counts, `terrainRows`, `unitRows`, and `macroWorld`; `.` in `unitRows` means no unit. In V0.9.1, `macroWorld.display` summarizes the current Macro View masks.

Use **Start Recording** before pressing Play or Step to collect tick-by-tick count frames. **Stop Recording** pauses collection, **Export Recording JSON** downloads the recording, and **Clear Recording** discards the in-memory data.

Recording stores counts, event counters, diagnostics, and compact macro summaries every tick, plus full-grid keyframes every `keyframeEvery` ticks. The default keyframe interval is `25`. Recording export also includes the latest full `macroWorld` and a compact `macroFrames` timeline.

Each recording frame includes:

```text
events.births.H / B / S
events.deaths.H / B / S
events.naturalDeaths.H / B / S
events.conflictDeaths.H / B / S
events.conversions.H_to_S
events.humanDeathsToSpirit
events.humanDeathsToMark
events.beastDispersals
events.beastDispersalWildCreated
events.beastDispersalMarksCleaned
events.beastDispersalSpiritsSuppressed
events.prosperitySettlerDepartures
events.prosperitySettlerBirths
events.crisisSettlerDepartures
events.settlerForcedExplorationMoves
events.settlerRestTicks
events.settlersLeavingRest
events.settlerBlockedByNoTarget / NoValidStep / Occupied
events.beastBirthsBlockedByDensity
events.beastBirthsBlockedBySoftBrake
events.wildCreatedByBeast
events.wildDecayedToEmpty
events.spiritWarningFlees
events.spiritSpawnBlockedByLocalDensity
events.spiritSpawnBlockedByEarlyGrace
events.beastRelocations
events.beastDispersalRemovals
events.beastAuraSpiritCleansed
events.beastAuraMarksCleaned
events.dormantSpiritSuppressedByBeast
events.activeSpiritSuppressedByBeast
events.settlerSpawns
events.spiritManifestations
diagnostics.birthCandidates / actualBirths
diagnostics.actualMoves / frontierUnits
diagnostics.borderCandidates / actualBordersCreated
diagnostics.activeProsperitySettlers / activeCrisisSettlers
diagnostics.coreHumans / edgeHumans / isolatedHumans
diagnostics.beastNeighborStats
diagnostics.activeSettlersWithValidMove / activeSettlersWithFoundingOpportunity / activeSettlersBlocked
diagnostics.beastBirthEligibleCells / beastLocalDensityBlockedCells
diagnostics.totalBeasts / totalWild
diagnostics.dormantSpirits / activeSpirits
diagnostics.humansAdjacentToDormantSpirit / humansAdjacentToActiveSpirit
diagnostics.beastsAdjacentToSpirit / beastsAdjacentToMark
```

For rule analysis, send back the exported recording JSON plus a short note with the tick range, parameters, and what looked wrong visually.
