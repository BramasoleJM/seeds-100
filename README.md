# Tri-Species Cellular World Prototype

This is the first visual demo for the single-screen tri-species cellular automata prototype.

## How to run

Open `index.html` in a browser. The demo starts paused by default.

No framework, build step, network calls, or external libraries are required.

The current stability build uses a `40 x 25` grid and clamps Play speed to at least `100ms` per tick so the browser can open safely and run extended tests.

## What this prototype tests

The demo tests whether three visible unit types can create readable dynamics through movement, fertility, terrain rewriting, lifecycle, group behavior, conflict, conversion, reproduction, and terrain decay on one grid. V0.9 also adds an observer-only Macro World Layer that interprets the grid as places, routes, events, and map icons. V0.10.7.1 makes Macro View read primarily as population evolution shapes. V0.10.9.1 keeps the observer-only slow memory trace layer selective. V0.11 adds a Human Lineage overlay that tracks whether current Human settlement shapes continue or descend from older Human settlement shapes. V0.11.1 makes that layer visible from the main controls and adds a compact status readout. V0.11.2 replaces old debug icons with sparse Semantic Tags anchored to population shapes, lineage memory, and POIs. V0.11.3 separates Human domain from stable Human seat anchors. V0.11.4 declutters Semantic Tags so the map shows only the most useful labels by default. V0.11.5 adds conservative Human outposts so far Human domains appear as `H outpost` before they can become `H seat`. V0.11.6 groups Human seats, outposts, and villages into observer-only Human polities. V0.11.7 gives Human polity tags stable color accents and detailed hover identity. V0.11.8 makes visible semantic tags clickable and opens a compact info panel. V0.13.1 adds editable map seeds, river map features, inspected-place memory, and an Explore sleep wake report. V0.13.1.2 makes place memory structured, suppresses unchanged player text, and prevents current Human village anchors from occupying river cells. V0.14A adds observer-only semantic traits, place archetypes, and interpretation hints to Place Memory snapshots and change context. V0.14A.1 tightens `contested_poi`, adds `settled_village`, and lets inspected Human places retain compact remembered identity without claiming current ownership. V0.14B adds observer-only `protoCultureHints` and anchor-level `protoCultureMemory` for inspected Human-related places. V0.14B.1 adds an export-only `protoCultureSummary` for audit readability.

This version does not implement a Zelda-style multi-screen map, tarot mechanics, story systems, resources, villages, NPCs, quests, or save/load.

## Map seeds and place memory

The Map Seed Editor stores compact initialization data:

```text
units, mountains, rivers, POIs
```

Mountains become `#` BLOCK terrain. Rivers are `mapFeatures`, not terrain and not units. River cells block H/B/S movement and Explore movement through the existing blocker checks, render as water, and weakly restore nearby fertility up to level 3.

Map Seed Editor paints live: clicking or drag-painting Mountain, River, Human, Beast, Spirit, or Erase immediately updates the current world and synced seed JSON. POI brushes place on click. Generate Random Preset creates an editable seed with mountains, a river, POIs, and small H/B/S starts. Clear Seed returns to an empty editable seed.

In Explore View, Space can inspect nearby POIs, river cells, Human villages, seats, old seats, outposts, remnants, scars, Beast ranges, and domains. Inspected places create place-memory anchors with numeric snapshots, structured `placeState`, compact Human polity / lineage memory, V0.14A `semanticTraits`, one `placeArchetype`, compact `interpretationHints`, V0.14A.1 `rememberedHumanIdentity` when a previously learned Human polity / lineage identity is no longer current, and V0.14B `protoCultureHints` for Human-related places. Sleeping in Explore advances 30 ticks and wakes with a "While You Slept" report for inspected places with meaningful visible changes only.

Place state, Human memory, remembered Human identity, semantic traits, place archetypes, interpretation hints, proto-culture hints, and proto-culture memory are deterministic heuristics for readability and future interpretation. They do not change simulation rules or gameplay behavior.

## V0.14B Proto-Culture Hints

Place Memory snapshots for Human-related places can include `protoCultureHints`.
Place Memory anchors can accumulate `protoCultureMemory`.
These are deterministic observer-only candidate signals for future interpretation.
They are not civilizations, factions, AI, resources, buildings, NPCs, story events, myth events, quests, tarot mechanics, or gameplay rules.
They do not change ecology, movement, fertility, POI behavior, terrain, units, tick order, river blockers, or Explore movement.

## V0.14B.1 Proto-Culture Readability Audit

Recording and snapshot exports include compact `protoCultureSummary` inside `placeMemory`.
The summary counts primary, stable, and active proto-culture hints, anchor types, and non-Human-labeled anchors with proto-culture hints.
This is export-only and observer-only.
It does not change `protoCultureHints`, `protoCultureMemory`, Place Memory update timing, wake reports, or simulation rules.

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

Each cell carries discrete `fertility` from 0 to 4. Units carry `age` and `role`. Roles are `normal`, `settler`, `pack`, and `manifestation`.

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
Rules version: TRI_SPECIES_WORLD_SIM_V0.14B.1_PROTO_CULTURE_READABILITY_AUDIT
```

Current version split:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Influence view patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
Stability patch: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
Regional substrate: TRI_SPECIES_WORLD_SIM_V0.10_REGIONAL_SUBSTRATE
Screen-cell substrate: TRI_SPECIES_WORLD_SIM_V0.10.1_SCREEN_CELL_REGIONAL_SUBSTRATE
Terrain readability / occlusion: TRI_SPECIES_WORLD_SIM_V0.10.2_TERRAIN_READABILITY_AND_OCCLUSION
Performance / macro throttling: TRI_SPECIES_WORLD_SIM_V0.10.3_PERFORMANCE_AND_MACRO_THROTTLING
Regression repair: TRI_SPECIES_WORLD_SIM_V0.10.4_REGRESSION_REPAIR
Macro timeline / rule audit: TRI_SPECIES_WORLD_SIM_V0.10.5_MACRO_TIMELINE_AND_RULE_AUDIT
Macro visual communication: TRI_SPECIES_WORLD_SIM_V0.10.6_MACRO_VISUAL_COMMUNICATION
Visual weight / panel usability: TRI_SPECIES_WORLD_SIM_V0.10.6.1_VISUAL_WEIGHT_PANEL_USABILITY
Macro terrain material layer: TRI_SPECIES_WORLD_SIM_V0.10.6.2_MACRO_TERRAIN_MATERIAL_LAYER
Pale base macro ecology readability: TRI_SPECIES_WORLD_SIM_V0.10.6.3_PALE_BASE_MACRO_ECOLOGY_READABILITY
Spirit corrosion / substrate unit hide: TRI_SPECIES_WORLD_SIM_V0.10.6.4_SPIRIT_CORROSION_SUBSTRATE_UNIT_HIDE
Population evolution macro view: TRI_SPECIES_WORLD_SIM_V0.10.7_POPULATION_EVOLUTION_MACRO_VIEW
Macro population visual primary: TRI_SPECIES_WORLD_SIM_V0.10.7.1_MACRO_POPULATION_VISUAL_PRIMARY
Initial POI world anchors: TRI_SPECIES_WORLD_SIM_V0.10.8_INITIAL_POI_WORLD_ANCHORS
POI ecology anchor rebalance: TRI_SPECIES_WORLD_SIM_V0.10.8.1_POI_ECOLOGY_ANCHOR_REBALANCE
POI blocking and visual priority: TRI_SPECIES_WORLD_SIM_V0.10.8.2_POI_BLOCKING_VISUAL_PRIORITY
Rot source inner ring hardening: TRI_SPECIES_WORLD_SIM_V0.10.8.3_ROT_SOURCE_INNER_RING_HARDENING
Macro memory slow trace: TRI_SPECIES_WORLD_SIM_V0.10.9_MACRO_MEMORY_SLOW_TRACE
Macro memory tuning: TRI_SPECIES_WORLD_SIM_V0.10.9.1_MACRO_MEMORY_TUNING
Human lineage memory: TRI_SPECIES_WORLD_SIM_V0.11_HUMAN_LINEAGE_MEMORY_PROTOTYPE
Human lineage visibility: TRI_SPECIES_WORLD_SIM_V0.11.1_HUMAN_LINEAGE_VISIBILITY_PASS
Semantic macro tags: TRI_SPECIES_WORLD_SIM_V0.11.2_SEMANTIC_MACRO_TAGS
Human seat / domain anchors: TRI_SPECIES_WORLD_SIM_V0.11.3_HUMAN_SEAT_DOMAIN_ANCHORS
Semantic tag declutter: TRI_SPECIES_WORLD_SIM_V0.11.4_SEMANTIC_TAG_DECLUTTER
Human outpost / seat promotion: TRI_SPECIES_WORLD_SIM_V0.11.5_HUMAN_OUTPOST_SEAT_PROMOTION
Human polity / village layer: TRI_SPECIES_WORLD_SIM_V0.11.6_HUMAN_POLITY_VILLAGE_LAYER
Polity visual identity: TRI_SPECIES_WORLD_SIM_V0.11.7_POLITY_VISUAL_IDENTITY
Clickable tag info panel: TRI_SPECIES_WORLD_SIM_V0.11.8_CLICKABLE_TAG_INFO_PANEL
Ancestry chain / polity split dedup: TRI_SPECIES_WORLD_SIM_V0.11.9_ANCESTRY_CHAIN_POLITY_SPLIT_DEDUP
Polity lifecycle / domain ownership: TRI_SPECIES_WORLD_SIM_V0.11.10_POLITY_LIFECYCLE_DOMAIN_OWNERSHIP
Polity ownership consistency / remnants: TRI_SPECIES_WORLD_SIM_V0.11.11_POLITY_OWNERSHIP_CONSISTENCY_REMNANTS
Polity ownership hardening final: TRI_SPECIES_WORLD_SIM_V0.11.12_POLITY_OWNERSHIP_HARDENING_FINAL
Polity plurality repair: TRI_SPECIES_WORLD_SIM_V0.11.13_POLITY_PLURALITY_REPAIR
Collapsed polity seat rebind repair: TRI_SPECIES_WORLD_SIM_V0.11.14_COLLAPSED_POLITY_SEAT_REBIND_REPAIR
Human village stability pass: TRI_SPECIES_WORLD_SIM_V0.11.15_HUMAN_VILLAGE_STABILITY_PASS
Local explore view: TRI_SPECIES_WORLD_SIM_V0.12_LOCAL_EXPLORE_VIEW
Explore view correction: TRI_SPECIES_WORLD_SIM_V0.12.1_EXPLORE_VIEW_CORRECTION
Map seed / place memory / wake report: TRI_SPECIES_WORLD_SIM_V0.13.1_MAP_SEED_PLACE_MEMORY_WAKE_REPORT
Map seed editor usability: TRI_SPECIES_WORLD_SIM_V0.13.1.1_MAP_SEED_EDITOR_USABILITY_PATCH
Place memory semantics / river village guard: TRI_SPECIES_WORLD_SIM_V0.13.1.2_PLACE_MEMORY_SEMANTICS_RIVER_VILLAGE_GUARD
Semantic place layer: TRI_SPECIES_WORLD_SIM_V0.14A_SEMANTIC_PLACE_LAYER
Semantic place tuning: TRI_SPECIES_WORLD_SIM_V0.14A.1_SEMANTIC_PLACE_TUNING
Proto-culture hints: TRI_SPECIES_WORLD_SIM_V0.14B_PROTO_CULTURE_HINTS
Proto-culture readability audit: TRI_SPECIES_WORLD_SIM_V0.14B.1_PROTO_CULTURE_READABILITY_AUDIT
```

V0.14A Semantic Place Layer:

```text
Place Memory snapshots include semanticTraits, placeArchetype, and interpretationHints.
computePlaceChange llmContext includes semanticTraits, placeArchetype, interpretationHints, displayName, and visibleToPlayer.
The semantic layer is deterministic and observer-only.
It does not change movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, river blockers, terrain decay, terrain types, unit types, or tick order.
```

Known simplification: V0.14A semantic traits and archetypes are compact deterministic interpretations of existing snapshot, map feature, POI, placeState, and Human memory data. They do not call AI and do not affect ecology or movement rules.

V0.14A.1 Semantic Place Tuning:

```text
contested_poi requires stronger conflict or corruption signals; Beast habitat alone does not make Spring or Great Forest contested.
Human place anchors can retain rememberedHumanIdentity after current polity / lineage identity disappears.
settled_village labels ordinary Human villages with current polity ownership or lineage continuity.
```

Known simplification: rememberedHumanIdentity is compact observer memory only. It is exported for interpretation but never used as current ownership or simulation state.

V0.14B Proto-Culture Hints:

```text
Place Memory snapshots for Human-related places can include protoCultureHints.
Place Memory anchors can accumulate protoCultureMemory.
These are deterministic observer-only candidate signals for future interpretation.
They are not civilizations, factions, AI, resources, buildings, NPCs, story events, myth events, quests, tarot mechanics, or gameplay rules.
They do not change ecology, movement, fertility, POI behavior, terrain, units, tick order, river blockers, or Explore movement.
```

Known simplification: V0.14B scoring is compact and deterministic. Hint source traits and memory signals are capped for export size, and the Human-related gate prevents ordinary POIs, Beast ranges, River places, Great Forest places, Springs, Rot Sources, or Spirit scars from becoming proto-culture candidates unless Human memory or identity is present.

V0.14B.1 Proto-Culture Readability Audit:

```text
Recording and snapshot exports include compact protoCultureSummary inside placeMemory.
The summary counts primary, stable, and active proto-culture hints, anchor types, and non-Human-labeled anchors with proto-culture hints.
This is export-only and observer-only.
It does not change protoCultureHints, protoCultureMemory, Place Memory update timing, wake reports, or simulation rules.
```

Known simplification: V0.14B.1 derives summary examples from current Place Memory export data and caps non-Human audit examples and strongest hint examples for readability.

Known simplification: V0.13.1.2 place state and Human memory are deterministic interpretation heuristics for readability. Anchor-center terrain state changes are treated as meaningful place-state changes even when the surrounding aggregate terrain delta is below the normal threshold. These interpretation records do not change ecology or movement rules.

V0.12.1 Explore View Correction:

```text
Explore View now uses local Macro View visual semantics instead of raw Cell View styling.
The player observer uses continuous x/y coordinates and a separate overlay marker.
Held WASD / arrow keys move the observer smoothly through passable terrain.
BLOCK, BORDER, and hard POI blockers are sampled against the player radius.
Space interaction searches visible tags plus raw POIs, villages, seats, old seats, and outposts.
E sleep auto-advances world time when Play was stopped and avoids double-stepping when Play was already running.
```

Known simplification: continuous movement is lightweight viewport-space movement and collision sampling. It still does not add combat, inventory, fog of war, minimap, dynamic POIs, player effects on ecology, or a multi-screen map.

V0.12 Local Explore View:

```text
Explore View adds a player observer that is independent of H/B/S units.
Explore renders only a 15 x 11 local viewport around the observer.
WASD / arrow keys move the observer through passable cells.
BLOCK, BORDER, and hard POI blockers stop observer movement.
H/B/S units do not block the observer and are not affected by the observer.
Space inspects the nearest important POI / semantic trace in range.
E toggles sleep/wake: sleep shows the global macro view while the world continues updating.
Snapshot and recording exports include compact playerObserver state.
```

Known simplification: V0.12 is a view/input layer. It does not add fog of war, explored-cell memory, combat, inventory, quests, NPCs, new terrain, new species, save/load, or a multi-screen map.

V0.11.15 Human Village Stability Pass:

```text
Human villages reuse nearby existing village ids before creating new ids.
Local village drift keeps firstSeenTick and memorySeed.
Young villages with nearby support persist for a short minimum lifetime instead of immediately fading.
Older unmatched villages fade through a small missing-sample grace window.
village_found and village_faded events are throttled to reduce repeated macro-frame spam.
Village summaries export compact missingSamples alongside firstSeenTick and lastSeenTick.
```

Known simplification: V0.11.15 is observer-only. It stabilizes Human village markers and events, but it does not change H/B/S movement, conflict, reproduction, terrain rewrite, fertility, POI behavior, polity seat ownership, or terrain decay.

V0.11.14 Collapsed Polity Seat Rebind Repair:

```text
Collapsed Human polities are historical only and are never returned as current lineage polity owners.
If an active lineage currentSeat points to a collapsed polity, the lineage is rebound to a spatially plausible non-collapsed polity or to a new successor polity.
New successor polities preserve a compact splitFromPolityId reference to the collapsed historical polity.
Repeated polity_seat_established spam for the same lineage seat is suppressed.
Collapsed currentSeat and collapsed current tag invariants remain unchanged.
```

Known simplification: V0.11.14 is observer-only. It repairs Human polity memory binding and export/tag consistency, but it does not change H/B/S movement, conflict, reproduction, terrain rewrite, fertility, POI behavior, or terrain decay.

V0.11.13 Polity Plurality Repair:

```text
Human polity currentSeat now records an authoritative source: lineage or outpost.
Lineage-source seats are valid only when backed by an active lineage currentSeat.
Outpost-source seats are valid when backed by an owned promoted/promotable outpost within distance 1.
Seat uniqueness is checked by seatSource + sourceId, so a root lineage polity and a distant outpost-derived split polity can coexist.
Seatless polities with active village or outpost support remain visible longer without creating fake H seat tags.
Village assignment now prefers spatially plausible seat/outpost ownership before falling back to root lineage ownership.
```

Known simplification: V0.11.13 is observer-only. It changes Human polity interpretation, tag/export ownership, and diagnostics, but it does not change H/B/S movement, conflict, reproduction, terrain rewrite, fertility, POI behavior, or terrain decay.

V0.10 Regional Substrate:

```text
Each cell now has hidden regionBias: none, basin, refuge, or hollow.
The current random seed generates varied basin/refuge/hollow blobs plus short BLOCK ridges with gaps.
basin softly favors FIELD / Human settlement.
refuge softly favors WILD / Beast recovery.
hollow softly preserves MARK / scar traces.
Substrate + Macro View shows the regional substrate under existing macro regions, routes, and frontiers.
Runtime Intervention lets you choose Off / H / B / S, then click a non-BLOCK grid cell to place or replace a unit.
BLOCK cells reject intervention placement.
Snapshot and recording exports include regionBiasRows, regionBiasCounts, and intervention metadata.

V0.10.1 Screen-Cell Regional Substrate:

The single 40 x 25 world is internally divided into a 4 x 3 logical screen-cell layout. This is only a generator scaffold; the demo still runs as one screen with one grid. Each logical cell exports id, bounds, archetype, regionBias, and matching north/south/west/east exits.

Substrate generation now paints readable large-cell geography first, then lets the existing ecology run on top. BLOCK forms borders, pockets, ridges, and choke passages instead of only scattered noise. Substrate + Macro View shows stronger basin/refuge/hollow tints and subtle large-cell boundary lines.

Initial placement now uses multiple candidate centers across same-bias screen cells, so two basin cells can both matter for Human/FIELD placement, and the same applies to refuge and hollow cells.

Known simplification: the logical screen cells are not separate gameplay screens. The row heights are 8, 8, and 9 cells because 25 does not divide evenly by 3. BLOCK still represents abstract hard geography, not final mountain or river terrain.

V0.10.2 Terrain Readability And Occlusion:

Macro View and Substrate + Macro View now keep BLOCK geography visible above macro colors, so passages and choke points are easier to read. Substrate view keeps the large-cell boundary lines and uses more translucent macro colors.

Medium-range strategic sensing is now BLOCK-aware through reachable radius flood fill. Adjacent conflict/contact checks remain simple 8-neighborhood checks, but settler target search, Beast rot attraction, and radius-based hunting pressure no longer treat an unbroken BLOCK wall as transparent.

Screen-cell archetypes now paint more varied blocker silhouettes using jittered ridges, corner masses, pockets, and carved openings. Snapshot and recording export keep `regionalSubstrate`, now with `version: "0.10.2"` and per-cell `blockCount` for debugging.

Known simplification: reachability is radius-limited flood fill, not true visual line-of-sight. BLOCK and BORDER stop this sensing pass.

V0.10.3 Performance And Macro Throttling:

Macro View and Substrate + Macro View no longer force full macroWorld analysis on every render. During normal play, macroWorld updates on `MACRO_ANALYSIS_INTERVAL` while the grid's unit and terrain display still updates every tick. Switching into Macro/Substrate view, reset, runtime intervention, snapshot export, and recording export can refresh macroWorld once when useful.

Macro display masks are cached by macro analysis tick and view mode. This makes Macro View and Substrate + Macro View smoother, with the simplification that macro colors/routes/frontiers can lag the live grid by up to one macro interval.

Recording frames are now compact. They keep counts, fertility stats, event counters, diagnostics, interventions, and compact macro summaries. Full grid rows remain in snapshot exports and recording keyframes. `regionalSubstrate` is stored once at recording top level instead of being repeated inside every recorded frame.

V0.10.4 Regression Repair:

V0.10.4 keeps the compact V0.10.3 recording format but repairs overblocking and sparse macro feedback. Default generated screen-cell maps now avoid regularly exceeding 180 BLOCK cells, limit `choke_pass` / `barrier_edge` overuse, and keep at least a few spacious cells for visible ecology.

Reachable sensing remains BLOCK-aware, but hot paths are cheaper: settler target search uses bounded radius 6 reachability, and Beast rot attraction only performs reachable flood fill after a cheap nearby rot check. Refuge still helps Beast/WILD, but its protection is milder; hollow MARK persistence is slightly stronger so scars remain readable longer.

V0.10.5 Macro Timeline And Rule Audit:

V0.10.5 separates three macro concerns. The normal simulation still runs every tick. Heavy semantic `macroWorld` analysis stays throttled at `MACRO_ANALYSIS_INTERVAL = 25`. A lightweight macro display frame refreshes every `MACRO_DISPLAY_INTERVAL = 5`, so Macro View and Substrate + Macro View can visibly evolve without forcing full macro analysis every tick.

Macro Timeline recording is separate from normal recording. Use **Start Macro Timeline**, **Stop Macro Timeline**, **Export Macro Timeline JSON**, and **Clear Macro Timeline** to collect compact visual macro frames every `MACRO_TIMELINE_SAMPLE_INTERVAL = 5` plus heavier `analysisFrames` at the macro analysis cadence. Timeline frames do not store full `terrainRows` or `unitRows`; `regionalSubstrate` and interventions are exported once at top level.

V0.10.6 Macro Visual Communication:

V0.10.6 is display-only. Macro View and Substrate + Macro View now use a clearer hierarchy: regional substrate is the base geography, fertility lightly modulates empty ground, ecological FIELD/WILD/MARK influence sits above it with softer grid edges, and BLOCK/routes/frontiers remain crisp reading aids.

Macro View shows basin / refuge / hollow more subtly. Substrate + Macro View remains the strongest geography-reading mode. Fertility level classes are visual-only and do not change fertility rules.

V0.10.6.1 Visual Weight And Panel Usability:

V0.10.6.1 is display/UI-only. Macro View now makes ecological Human / Beast / Spirit land influence the primary visual signal again, with basin / refuge / hollow reduced to quiet undertones. Substrate + Macro View keeps clearer geography while preserving readable ecological evolution.

The right panel is organized as an observation tool: common controls, View Mode, Runtime Intervention, Status, and Stats stay near the top; Initial Settings, Recording, Macro Timeline, Legend, and Advanced / Debug are native collapsible groups. On desktop the grid stays visible while the panel scrolls internally.

Visual test: open `index.html`, select Macro View, and run 200-400 ticks. The first thing you should read is changing settlement / wild recovery / scar material. Then switch to Substrate + Macro View; geography should be clearer, but not hide FIELD / WILD / MARK evolution.

Future topic: map scale and less regular region generation should be discussed separately because it may affect performance, macro analysis, recording size, and UI layout.

V0.10.6.2 Macro Terrain Material Layer:

V0.10.6.2 is display-only. Macro View now prioritizes the real FIELD / WILD / MARK terrain material, so ecological change stays visible even when a cell is not part of a settlement, wild recovery, or scar macro mask.

Substrate + Macro View remains the geography-reading mode, but FIELD / WILD / MARK material is layered above the regional substrate so ecology and geography can be read together. V0.10.6.2 does not change rules, map generation, timeline export shape, recording export shape, or snapshot export shape.

V0.10.6.3 Pale Base Macro Ecology Readability:

V0.10.6.3 is display-only. Macro View is now the ecology-evolution reading mode: it uses a pale map base, faint regional undertones, stronger FIELD / WILD / MARK material, and reduced fringe so emergent shapes stay readable.

Substrate + Macro View remains the geography-plus-ecology reading mode. It keeps regional geography clearer than Macro View while preserving FIELD / WILD / MARK visibility.

V0.10.6.4 Spirit Corrosion And Substrate Unit Hide:

V0.10.6.4 is display-only. MARK / scar now reads as corrosion or abnormal space in macro modes, with sharper purple treatment instead of the same soft transition language used by FIELD and WILD.

Substrate + Macro View hides H / B / S letters so color-only geography and ecology readability can be judged. Cell View still shows unit letters, and exports are unchanged.

V0.10.7 Population Evolution Macro View:

V0.10.7 is display-only. Macro View now groups raw FIELD/H, WILD/B, and MARK/S signals into stable population evolution shapes with core/body/edge/memory overlays. Tiny isolated noise is filtered, and short fading memory keeps recently disappeared shapes recognizable between refreshes.

Substrate + Macro View keeps regional geography and screen-cell structure readable while showing the same population shapes more softly. This is a foundation for later memory or point-of-interest work, but V0.10.7 does not add POIs, new terrain, or new simulation rules.

V0.10.7.1 Macro Population Visual Primary:

V0.10.7.1 is display-only. Macro View is now the primary Population Evolution View: it hides unit letters visually, removes regional substrate classes from Macro View, mutes raw FIELD/WILD/MARK terrain material, and makes population core/body/edge/memory overlays the dominant map signal.

Substrate + Macro View remains the geography + ecology comparison mode. It keeps basin/refuge/hollow and screen-cell structure readable while showing population shapes more softly. Macro Timeline frame top-level keys stay stable, and `macroSummary.populationEvolution` adds compact shape counts, active area, memory area, dominant id, and trend.

V0.10.8 Initial POI World Anchors:

V0.10.8 adds an independent POI layer with exactly three initial static anchors: monument, rot source, and spring. They do not occupy terrain or unit cells, and they do not add new terrain, species, quests, NPCs, buildings, save/load, or multi-screen gameplay.

POIs are visible in Macro View and Substrate + Macro View. Their first-pass effects are intentionally strong for readability testing: monument supports fertility and FIELD persistence nearby, rot source keeps local MARK/corrosion pressure, and spring restores fertility nearby. Snapshot, Recording, and Macro Timeline exports include compact top-level `pointsOfInterest`; Macro Timeline frame keys stay stable and `macroSummary.poiSummary` stores compact POI counts.

V0.10.8.1 POI Ecology Anchor Rebalance:

V0.10.8.1 keeps POIs as initially existing static world anchors, but rebalance them into four clearer ecology anchors: monument for Human/FIELD memory, great forest for Beast/WILD habitat and origin, rot source for Spirit/MARK corruption, and spring as a neutral fertility amplifier.

Spring no longer behaves like a hidden Human monument. It restores fertility without changing terrain, caps FIELD support lower than WILD/Beast-adjacent recovery, and does not protect FIELD decay or cleanse MARK. Great forest preserves a readable WILD/Beast region, reduces WILD decay, can lightly repopulate Beasts under density caps, and prevents ordinary Human rewrite from domesticating its core. Rot source now has core / inner / outer display semantics and contested Human/Beast/Spirit hints so the source remains visible even when population colors touch it.

V0.10.8.2 POI Blocking And Visual Priority:

V0.10.8.2 keeps the same four initial POIs but clarifies their physical and visual priority. BLOCK walls stay visually dominant and do not receive POI influence or center classes. Spring center is a blocked source cell for movement, runtime placement, and reachable sensing, without adding a new terrain type; its surrounding cells still keep the fertility recovery halo.

Great Forest now uses a more unified dense-canopy visual language instead of per-cell circular icon markers. Rot Source center and inner ring have stronger source styling that wins over population colors and contest hints, while the outer ring can still show Human / Beast / Spirit interaction.

V0.10.8.3 Rot Source Inner Ring Hardening:

V0.10.8.3 keeps spring, great forest, monument, terrain types, species, grid size, and exports stable. It only hardens the rot source: the center and radius 1 now become MARK deterministically unless the cell is BLOCK or BORDER, without deleting any unit on that cell. Radius 2-4 remains a contested outer ecology instead of becoming solid purple.

V0.10.9 Macro Memory Slow Trace:

V0.10.9 adds an observer-only macro memory layer. It tracks slow traces for Human/FIELD, Beast/WILD, rot/MARK, fertility recovery, and recurring conflict. Fast one-tick specks stay below visible thresholds, while repeated patterns become faint or strong memory in Macro View. Macro Timeline frames include compact `macroSummary.macroMemory` and `macroSummary.poiStates`; Recording export includes top-level `macroMemorySummary`. Full trace rows are not exported per frame.

V0.10.9.1 Macro Memory Tuning:

V0.10.9.1 lowers memory gains, raises strong-memory thresholds, and tightens conflict memory so historical Human/Beast overlap alone does not paint broad conflict zones. POI state labels now warm up conservatively before showing dramatic states. Exports keep the same compact memory summaries and still avoid full trace rows.

V0.11 Human Lineage Memory Prototype:

V0.11 is observer-only. It reads Human population evolution shapes, matches them across macro updates, and records compact Human lineage summaries with origin, centroid path, state, descendant links, and recent lineage events. Turn on **Show Human Lineage** in Advanced / Debug to see the dominant lineage origin, current point, path, memory, and descendant hint on Macro View. Snapshot and Recording exports include top-level `humanLineageMemorySummary`, and Macro Timeline frames include compact `macroSummary.humanLineage`.

Known simplifications: lineage is based on macro shapes, not individual Human units; descendant detection is heuristic spatial continuity, not biological genealogy; only Human lineage is implemented; the visual overlay is selective so it does not drown out current population shapes.

V0.11.1 Human Lineage Visibility Pass:

V0.11.1 changes visibility/usability only. **Show Human Lineage** now sits near View Mode and defaults on so the feature is discoverable during Macro View testing. A compact Human Lineage status panel shows lineages, active/collapsed counts, descendant links, dominant lineage id, and the most recent lineage event. The overlay still shows one dominant lineage by default, and lineage remains observer-only.

V0.11.2 Semantic Macro Tags:

V0.11.2 is a visual/semantic overlay pass. **Show Semantic Tags** replaces the old Macro Debug Icons label and uses current population shapes, Human lineage memory, and POI centers instead of legacy macro icon centers. Tags are sparse and selective: major population shapes, the dominant Human lineage origin/current/path/old/descendant landmarks, and the four POI anchors. `macroSummary.semanticTags` stores a compact capped tag list for timeline/debug analysis.

Known simplifications: tags are observer-only; tags are not a full annotation of every region; Human lineage tags show the dominant lineage only; tag placement uses representative cells rather than raw centroid placement.

V0.11.3 Human Seat / Domain Anchors:

V0.11.3 is observer-only. `H domain` now labels the Human-controlled macro shape, while `H seat` marks a stable center inside that domain after a candidate remains supported for several macro samples. `H old seat` preserves abandoned seats, and `H path` prefers origin / old-seat / current-seat anchors over raw moving centroids. Snapshot, Recording, and Macro Timeline summaries include compact seat counts and recent seat events.

Known simplifications: Human seat is not a building; Human domain is derived from population shapes, not a terrain layer; seat establishment and abandonment are heuristic; only Human seats are implemented; seat-to-seat continuity is preferred over raw centroid paths.

V0.11.4 Semantic Tag Declutter:

V0.11.4 is display-only. Default `semanticTags` now represent visible map labels, not every possible annotation. The map shows `H seat`, `H old seat`, `H domain`, major POIs, and at most one `B range` / `S scar`. Helper labels such as `H now`, `H origin`, `H path`, `H old`, and `H descendant` are hidden by default to reduce overlap; their underlying lineage data remains in summaries and events. Same-cell and near-cell collisions suppress lower-priority tags deterministically instead of offsetting them.

V0.11.5 Human Outpost / Seat Promotion:

V0.11.5 is observer-only. `H seat` placement is stricter: the seat cell must be FIELD and must not be MARK, BORDER, BLOCK, a hard POI blocker, or inside the rot-source inner ring. A current seat that becomes MARK warns immediately and is abandoned quickly if corruption persists. Far Human domains are first recorded as `H outpost`; only stable, supported, low-pressure outposts can promote to `H seat` when no valid current seat remains. `humanLineageMemorySummary` and macro timeline summaries include compact outpost counts and recent outpost events.

Known simplifications: `H outpost` is not a building or gameplay object; outpost promotion is heuristic; only Human outposts are implemented; old-seat tags are filtered to the dominant/mainline chain by default.

V0.11.6 Human Polity / Village Layer:

V0.11.6 is observer-only. `Human polity` groups Human seats, old seats, outposts, and villages into compact macro identities such as `human_polity_001`. `H village` marks short-lived local settlement points inside Human domains and belongs to a polity, but it is not a building or gameplay object. Pressured seats can appear as `H pressured seat`, and remote mature outposts can be interpreted as split polities when a parent seat is still active. Snapshot, Recording, and Macro Timeline exports include compact `humanPolitySummary` / `macroSummary.humanPolity`.

Known simplifications: Human polity is not an AI faction system; villages do not inherit long-term memory; split/inheritance is heuristic; only Human polity/village interpretation exists in V0.11.6.

V0.11.7 Polity Visual Identity:

V0.11.7 is observer-only. Human semantic tags now carry compact polity fields such as `polityId`, `polityState`, `polityColorIndex`, `lineageId`, `state`, `support`, and `pressure` where applicable. Rendered Human tags expose matching `data-*` attributes, use stable polity color accent classes, and include richer native hover titles. POI tags do not need polity fields.

Known simplifications: polity color applies to tags only, not terrain/domain fills; hover uses native browser titles; village flicker is not addressed in V0.11.7; polity identity remains analysis/display only.

V0.11.8 Clickable Tag Info Panel:

V0.11.8 is display-only. Visible Semantic Tags are keyboard-focusable and clickable. Clicking a tag opens a compact panel over the simulation shell with the tag identity, polity / lineage relation where available, state, support / pressure metrics, position, and a short interpretation. POI tags explain their role, such as Rot Source, Spring, Great Forest, or Monument. Close and Escape hide the panel, and Reset clears the selection.

Known simplifications: the info panel shows the clicked tag snapshot and may not live-update if that tag disappears while the simulation runs; native title remains as fallback; the panel uses existing semantic tag fields and does not query historical records deeply.

V0.11.9 Ancestry Chain / Polity Split Dedup:

V0.11.9 is observer-only data cleanup. Human lineage summaries now export compact `lineageAncestryIds`, `rootAncestorId`, `ancestorDepth`, and capped `seatAncestry`. Human polity summaries now export compact `polityAncestryIds`, `rootPolityId`, `splitDepth`, `splitKey`, and capped seat ancestry. Village summaries snapshot lineage / polity ancestry and store a deterministic `memorySeed`. Repeated polity split candidates reuse an existing split polity when the parent, root lineage, and outpost/location identity match.

Known simplifications: ancestry chains are compact snapshots, not full biographies; `memorySeed` is stored only and does not trigger ancestral-memory behavior; split dedup uses deterministic heuristics; polity ancestry remains observer-only.

V0.11.10 Polity Lifecycle / Domain Ownership:

V0.11.10 is observer-only lifecycle cleanup. Human polities now resync `currentSeat` from authoritative lineage / promoted-outpost seats, clear stale seats into compact `oldSeats`, and progress through active / pressured / seatless / declining / collapsed states using compact counters. Collapsed polities remain only as compact ancestry/reference history and are capped. `H domain` semantic tags infer polity ownership when a Human population shape has a clear owner, and stay unassigned when ownership is unclear.

Known simplifications: polity lifecycle is heuristic; collapsed polities are retained compactly only for ancestry/reference; H domain ownership is inferred and may remain unassigned when ambiguous or distant; no gameplay rules are affected.

V0.11.11 Polity Ownership Consistency / Remnants:

V0.11.11 is observer-only ownership cleanup. Active lineage seats now resolve to one active polity owner; losing duplicate owners clear `currentSeat` and become seatless/declining. Collapsed polities no longer emit normal current `H village`, `H outpost`, or `H domain` tags. Villages left by collapsed polities are inherited by a nearby active descendant polity when clear, otherwise become compact `H remnant` markers while FIELD/Human support remains.

Known simplifications: `H remnant` is observer-only; inherited village behavior has no gameplay effect; outpost transfer is simplified to suppressing normal tags for collapsed polity outposts; ownership conflict resolution is heuristic.

V0.11.12 Polity Ownership Hardening Final:

V0.11.12 is a strict consistency hardening pass. Collapsed polities forcibly clear `currentSeat` and preserve the cleared seat in `oldSeats` with `reason: "polity_collapsed"`. Current semantic tags have a final guardrail that drops impossible collapsed-polity `H seat`, `H pressured seat`, `H village`, `H outpost`, and `H domain` tags. Active current seats are checked after polity updates so a lineage currentSeat has only one active polity owner, stale lineage seats are cleared, and losing polities retain compact old seat history.

Known simplifications: ownership conflict resolution is deterministic but heuristic; losing polities keep ancestry and old seat history; this pass adds no gameplay behavior.
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

Recording stores counts, event counters, diagnostics, fertility stats, interventions, and compact macro summaries every tick, plus full-grid keyframes every `keyframeEvery` ticks. The default keyframe interval is `25`. Recording export also includes one top-level `regionalSubstrate`, the latest full `macroWorld`, and a compact `macroFrames` timeline.

Use **Start Macro Timeline** before Play or Step to collect a lighter macro-history file. **Export Macro Timeline JSON** downloads:

```text
type: tri_species_macro_timeline
frames: compact counts, maskCounts, maskRows, and macroSummary
analysisFrames: macroWorld snapshots at analysis cadence
regionalSubstrate: one top-level substrate object
interventions: one top-level intervention list
```

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
