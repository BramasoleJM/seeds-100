# Object Schema

This document lists current real objects and their compact export role.

## Cell

Lives in: `world[y][x]`.
Created by: `createCell`, world initialization, map seed rebuilds.
Read by: all simulation and observer layers.
Mutates simulation: yes.
Observer-only: no.
Export shape: terrain rows, unit rows, fertility rows, roles, optional metadata in tests.
Future notes: keep terrain/unit vocabulary fixed unless a rule task changes it.

## MapSeed

Lives in: `activeMapSeed`.
Created by: default seed, JSON import, brush editor, random preset.
Read by: seed editor and reset/apply paths.
Mutates simulation: yes when applied.
Observer-only: no.
Export shape: `version`, `name`, `width`, `height`, `units`, `mountains`, `rivers`, `pois`.
Future notes: validate compactly; do not make it a multi-screen map here.

## MapFeature: River

Lives in: `mapFeatures.rivers`.
Created by: map seed rivers, river brush, editable random seed preset, and generated/random world initialization.
Read by: movement blockers, Explore blockers, rendering, fertility restore, place snapshots.
Mutates simulation: yes through existing blocker and fertility restore rules.
Observer-only: no.
Export shape: compact `{ x, y }` river cells.
V0.14B.2 note: generated rivers are continuous-ish paths that avoid BLOCK/mountains where practical and remain map features, not terrain.
Future notes: river is not terrain and not a unit.

## POI

Lives in: `worldPOIs`.
Created by: seed POIs and POI brushes.
Read by: POI effects, blockers, tags, Place Memory.
Mutates simulation: yes through existing POI effects and hard blockers.
Observer-only: no.
Export shape: compact id/type/x/y/radius/state.
Future notes: keep POI behavior rule-bound.

## MacroWorld

Lives in: `macroWorld`.
Created by: `analyzeMacroWorldNow`.
Read by: exports, display masks, summaries.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact regions, routes, events, memories, visible icons.
Future notes: detectors can be added as observer-only summaries.

## MacroObject

Lives in: arrays inside `macroWorld`.
Created by: macro detector functions.
Read by: macro display, exports, semantic tags.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact id/type/state/center/cells summary depending on object kind.
Future notes: keep raw cell arrays capped or summarized in exports.

## PopulationShape

Lives in: `populationEvolutionFrame.shapes`.
Created by: `buildPopulationEvolutionShapes`.
Read by: display masks, semantic tags, Human ownership inference.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact type/state/area/center/confidence and limited cell summaries.
Future notes: use confidence rather than gameplay effects.

## MacroMemory

Lives in: `macroMemory`.
Created by: `createEmptyMacroMemory`, updated by `updateMacroMemory`.
Read by: macro analysis, display, exports.
Mutates simulation: no.
Observer-only: yes.
Export shape: trace summaries and compact POI states.
Future notes: trace tuning should remain display/analysis only.

## HumanLineage

Lives in: `humanLineageMemory.lineages`.
Created by: `updateHumanLineageMemory`.
Read by: polity layer, semantic tags, place snapshots, exports.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact lineage summary with ancestry, seat, path, state, confidence.
Future notes: lineage identity is not a faction or AI.

## HumanOutpost

Lives in: `humanLineageMemory.humanOutposts`.
Created by: lineage/outpost detection.
Read by: polity layer, tags, Explore targets, place snapshots.
Mutates simulation: no.
Observer-only: yes.
Export shape: id, lineage/polity ids, position, state, support, pressure.
Future notes: outpost is not a building.

## HumanPolity

Lives in: `humanPolityMemory.polities`.
Created by: `updateHumanPolityMemory`.
Read by: villages, tags, place snapshots, exports.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact id, state, ancestry, seat, oldSeats, villages/outposts.
Future notes: polity is interpretation, not civilization simulation.

## HumanVillage

Lives in: `humanPolityMemory.villages`.
Created by: Human village detection.
Read by: tags, Explore targets, place snapshots, exports.
Mutates simulation: no.
Observer-only: yes.
Export shape: id, polityId, lineageId, x/y, state, support, pressure, memorySeed, timing.
Future notes: river cells are invalid for active villages.

## SemanticTag

Lives in: derived arrays from `createSemanticTags`.
Created by: semantic tag helper functions.
Read by: renderer, info panel, Explore interaction.
Mutates simulation: no.
Observer-only: yes.
Export shape: included inside macro summaries where applicable.
Future notes: keep tags sparse and clickable.

## PlaceMemory

Lives in: `placeMemory`.
Created by: `createEmptyPlaceMemory`.
Read by: inspection, sleep/wake, exports.
Mutates simulation: no.
Observer-only: yes.
Export shape: `version`, `anchors`, `wakeReports`, optional/export-derived `protoCultureSummary`.
V0.14B.1 export-derived field: `protoCultureSummary` stores compact counts and examples for proto-culture audit readability. It is derived during snapshot/recording export and is not live Place Memory state.
Future notes: add compact fields only.

## PlaceMemoryAnchor

Lives in: `placeMemory.anchors`.
Created by: `inspectPlaceTarget`.
Read by: wake observation, exports, info panel.
Mutates simulation: no.
Observer-only: yes.
Export shape: id, type, displayName, position, sourceRef, inspected ticks, snapshots, changes.
V0.14A.1 optional field: `rememberedHumanIdentity` stores compact last-known Human polity / lineage identity without claiming current ownership.
V0.14B optional field: `protoCultureMemory` stores compact observer-only accumulated hint signals. It does not change simulation, Human identity, or player-visible wake report rules.
Future notes: sourceRef should stay compact and deterministic.

## PlaceSnapshot

Lives in: anchor `currentSnapshot` and `previousSnapshot`.
Created by: `snapshotPlace`.
Read by: `computePlaceChange`, exports, tests.
Mutates simulation: no.
Observer-only: yes.
Export shape: tick, position, center, terrain/unit/fertility/ecology summaries, placeState, optional humanMemory, optional V0.14A.1 `rememberedHumanIdentity`, V0.14A `semanticTraits`, `placeArchetype`, `interpretationHints`.
V0.14B field: `protoCultureHints`, derived from semanticTraits, placeArchetype, humanMemory, and rememberedHumanIdentity. Non-Human-related places export an empty array.
Future notes: do not add large raw cell arrays.

## PlaceChange

Lives in: anchor change fields and wake report entries.
Created by: `computePlaceChange`.
Read by: info panel, wake reports, exports.
Mutates simulation: no.
Observer-only: yes.
Export shape: category, subject, direction, intensity, ticks, metricsDelta, playerText, llmContext.
V0.14B note: `llmContext` may include `protoCultureHints` and `protoCultureMemory` for observer/export consumers.
Future notes: no-significant-change remains quiet to the player.

## ProtoCultureSummary

Lives in: derived export data at `placeMemory.protoCultureSummary`.
Created by: Place Memory export serialization.
Read by: snapshot/recording audit consumers.
Mutates simulation: no.
Observer-only: yes.
Export shape: version, anchor totals, hint count maps, anchor type count maps, capped non-Human-labeled examples, and capped strongest examples by allowed hint id.
V0.14B.2 lightweight export: `createProtoCultureSummaryExport` emits `type: tri_species_proto_culture_summary`, version `0.14B.2`, tick/range metadata, `protoCultureSummary`, and capped `compactAnchors` without frames, keyframes, full snapshots, terrain rows, or unit rows.
V0.14B.2 audit helper: `runProtoCultureSummaryAuditForSeedsForTest` returns compact per-seed summaries and aggregate hint counts/examples for tests/tools.
Future notes: keep compact and deterministic; do not use as live state or gameplay input.

## HumanCultureCandidateSummary

Lives in: derived export / review data at `placeMemory.humanCultureCandidateSummary`.
Created by: Place Memory export serialization and audit helpers.
Read by: snapshot, recording, lightweight proto-culture summary, current place review, and multi-seed audit consumers.
Mutates simulation: no.
Observer-only: yes.
Export shape: version `0.14C`, owner totals, candidate type counts, capped `byPolity`, capped `byLineage`, and capped `contextOnlySignals`.
V0.14C.1 export fields: owner records include `ownerLifecycleClass`, `dominantCandidate`, `secondaryCandidates`, and `candidateDominance`; candidate signals include `candidateUse`, `ownerLifecycleClass`, `dominanceScore`, `evidenceSummary`, and `maturityReason`.
V0.14C.1 aggregate fields: `dominantCandidateTypeCounts`, `secondaryCandidateTypeCounts`, `candidateUseCounts`, `ownerLifecycleCounts`, `ambiguousOwnerCount`, and `highScoreEmergingCount`.
Owner rule: only Human polity ids and Human lineage ids can own candidate signals.
Context-only rule: POIs, scars, rivers, springs, forests, Beast ranges, and ordinary places can support evidence but cannot create candidates without Human subject evidence.
Statuses: only `emerging` and `candidate`.
Future notes: no civilization module, dominance unlock, or gameplay effect is implemented; do not use this summary to mutate Human identity, proto-culture scoring, ecology, movement, terrain, fertility, POI behavior, river blockers, Explore movement, tick order, or wake report visibility.

## PlayerObserver

Lives in: `playerObserver`.
Created by: `createPlayerObserver`.
Read by: Explore movement, viewport, sleep.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact x, y, facing, isSleeping.
Future notes: observer does not occupy the unit layer.

## RecordingFrame / MacroTimelineFrame

Lives in: `recording.frames`, `macroTimeline.frames`.
Created by: recording helpers.
Read by: export helpers.
Mutates simulation: no.
Observer-only: yes.
Export shape: compact counts, events, diagnostics, masks, macro summaries, with full keyframes only at intervals.
Future notes: keep macro timeline frame top-level keys stable unless explicitly changed.
