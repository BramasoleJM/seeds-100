# Architecture Map

This document describes the current single-screen prototype layers. All layers live in `sim.js`.

## Core Simulation Layer

Purpose: Runs H/B/S cellular ecology on the 40 x 25 grid.
Key state variables: `world`, `tick`, `currentInitialWorld`, `currentInitialSettings`.
Key functions: `stepWorld`, `runStepSafely`, `planMovements`, `applyLifecycleDeath`, `applyConflict`, `applyTerrainRewrite`, `applyReproduction`, `applyPOIEffects`, `applyTerrainDecay`.
Inputs: grid cells, controls, random seed, active map seed.
Outputs: updated cells, counts, event counters, diagnostics.
Changes simulation rules: yes.
Dependencies: terrain, unit, fertility, POI, river blockers.
Safe future extension points: add observer-only diagnostics or tests around phase outputs.

## Map Seed / Map Feature / POI Layer

Purpose: Builds editable initial maps with units, mountains, rivers, and POIs.
Key state variables: `activeMapSeed`, `mapFeatures`, `worldPOIs`.
Key functions: `normalizeMapSeed`, `applyMapSeedToWorld`, `applyMapSeedBrush`, `generateRandomMapSeedPreset`, `isRiverCell`, `isPOIHardBlocker`.
Inputs: seed JSON, brush edits.
Outputs: initialized world, river feature list, POI list.
Changes simulation rules: yes for river blockers and POI effects already defined by rules.
Dependencies: core grid, movement blocker helpers, Explore passability.
Safe future extension points: add seed validation or compact new observer metadata.

## Macro Analysis Layer

Purpose: Interprets live grid into settlement, frontier, scar, route, and recovery regions.
Key state variables: `macroWorld`, `macroDisplayWorld`, `macroDisplayFrame`.
Key functions: `analyzeMacroWorldNow`, `ensureMacroAnalysis`, `buildMacroDisplayMasks`, `macroSummary`.
Inputs: world cells, macro memory, POIs, population shapes.
Outputs: compact macro regions, routes, events, memories, masks.
Changes simulation rules: no.
Dependencies: core grid, macro memory, population evolution.
Safe future extension points: add new observer-only detectors with compact exports.

## Population Evolution Layer

Purpose: Tracks current population shapes for Human, Beast, and Spirit display.
Key state variables: `populationEvolutionFrame`, recent shape memory constants.
Key functions: `refreshPopulationEvolutionFrame`, `buildPopulationEvolutionShapes`, `buildPopulationEvolutionDisplayMasks`.
Inputs: world cells and display mode.
Outputs: compact shapes and masks used by Macro View and tags.
Changes simulation rules: no.
Dependencies: core grid, macro display.
Safe future extension points: add display-only confidence fields.

## Macro Memory Layer

Purpose: Preserves slow traces of human, beast, rot, fertility, conflict, and POI signals.
Key state variables: `macroMemory`.
Key functions: `updateMacroMemory`, `createEmptyMacroMemory`, `derivePOIStates`, `addPOITraceSignals`.
Inputs: world cells, POIs, macro/population signals.
Outputs: decaying trace arrays and compact POI states.
Changes simulation rules: no.
Dependencies: macro analysis, POI layer.
Safe future extension points: tune trace thresholds or add compact observer traces.

## Human Lineage Layer

Purpose: Tracks Human settlement continuity, current seats, old seats, and outposts.
Key state variables: `humanLineageMemory`, `humanLineageSerial`.
Key functions: `updateHumanLineageMemory`, `createHumanLineageSummary`, `humanLineageById`, `dominantHumanLineage`.
Inputs: Human population shapes and historical lineage memory.
Outputs: lineage records, seat history, outposts, lineage events.
Changes simulation rules: no.
Dependencies: population evolution, macro analysis.
Safe future extension points: add compact identity fields that do not affect H/B/S behavior.

## Human Polity / Village / Outpost Layer

Purpose: Groups Human seats, villages, outposts, remnants, and domains into observer-only polities.
Key state variables: `humanPolityMemory`, `humanPolitySerial`.
Key functions: `updateHumanPolityMemory`, `createHumanPolitySummary`, `findHumanPolityById`, `findHumanPolityForLineage`, `validateHumanPolityOwnership`.
Inputs: lineage memory, population shapes, villages, outposts.
Outputs: polity records, village records, remnant records, ownership summaries.
Changes simulation rules: no.
Dependencies: Human lineage, map features for river village guard.
Safe future extension points: add display-only polity interpretation fields.

## Semantic Tag Layer

Purpose: Places sparse clickable labels over important macro traces and POIs.
Key state variables: visible tag arrays are derived on demand.
Key functions: `createSemanticTags`, `addHumanPolitySemanticTags`, `addHumanLineageSemanticTags`, `addPOISemanticTags`, `addPopulationSemanticTags`, `formatSemanticTagInfo`.
Inputs: macro/population/Human memory, POIs, map features.
Outputs: visible tags and info-panel rows.
Changes simulation rules: no.
Dependencies: macro analysis, Human memory, POI layer.
Safe future extension points: add sparse observer-only tag categories.

## Explore View Layer

Purpose: Lets an independent player observer move locally, inspect traces, and sleep.
Key state variables: `playerObserver`, `currentSleepObservation`, `sleepTicksRemaining`.
Key functions: `ensurePlayerObserver`, `updatePlayerObserverContinuous`, `isExploreCellPassable`, `findExploreInteractionTarget`, `enterExploreSleep`, `wakeExploreSleep`.
Inputs: keyboard state, map blockers, visible traces.
Outputs: local viewport model, last interaction, sleep/wake state.
Changes simulation rules: no.
Dependencies: map features, POI blockers, semantic tags, place memory.
Safe future extension points: add observer UI only.

## Place Memory / Sleep Report Layer

Purpose: Stores inspected place anchors and compares snapshots after sleep or inspection.
Key state variables: `placeMemory`.
Key functions: `snapshotPlace`, `inspectPlaceTarget`, `computePlaceChange`, `completeSleepObservation`, `formatPlaceMemoryInfo`, `deriveSemanticTraits`, `derivePlaceArchetype`, `derivePlaceInterpretationHints`.
Inputs: inspection target, world cells, POIs, rivers, Human memory.
Outputs: place anchors, snapshots, structured changes, wake reports, V0.14A semantic fields.
Changes simulation rules: no.
Dependencies: Explore view, map features, POIs, Human memory.
Safe future extension points: add compact observer-only interpretation fields.

## Export / Recording / Test Hook Layer

Purpose: Serializes snapshots, recordings, macro timelines, and exposes test helpers.
Key state variables: `recording`, `macroTimeline`.
Key functions: `createSnapshotExport`, `createRecordingExport`, `createMacroTimelineExport`, `window.__triSpeciesSim`.
Inputs: current world and observer memories.
Outputs: JSON exports and test-accessible functions.
Changes simulation rules: no.
Dependencies: all layers that export compact state.
Safe future extension points: add serializable summaries without changing frame top-level keys unless a task requires it.
