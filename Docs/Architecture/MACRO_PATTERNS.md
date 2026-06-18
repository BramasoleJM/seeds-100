# Macro Patterns

This document describes existing macro patterns from code. V0.14A does not convert detectors to data-driven tables.

## settlement

Source: Human population shape and Human lineage/polity detectors.
Input signals: Human units, FIELD cells, support, continuity, confidence.
State values: active, pressured, stable, expanding through shape metrics.
Confidence / visibility: visible when shape confidence and area pass thresholds.
Export path: `macroWorld`, `humanLineageMemorySummary`, `humanPolitySummary`, semantic tags.
Semantic tag relation: `H domain`, `H seat`, `H village`.
Future notes: observer-only identity can be enriched without changing Human rules.

## abandoned_settlement

Source: macro memory and Human memory state transitions.
Input signals: lost FIELD support, old seats, remnants, fading villages.
State values: abandoned, lost, remnant, fading.
Confidence / visibility: old/remnant markers are capped and filtered.
Export path: macro memory, lineage seat history, polity old seats/remnants.
Semantic tag relation: `H old seat`, `H remnant`.
Future notes: no ruins or buildings are created.

## beast_recovery_zone

Source: Beast/WILD macro and population shape detection.
Input signals: WILD cells, Beast units, fertility, Great Forest POI support.
State values: active habitat, quiet habitat, fading recovery.
Confidence / visibility: low confidence zones are hidden or retained briefly.
Export path: macro regions, population shapes, macro masks.
Semantic tag relation: `B range`.
Future notes: no Beast resource economy.

## human_beast_frontier

Source: macro frontier/contact analysis.
Input signals: Human/FIELD regions near Beast/WILD regions.
State values: frontier/contact region, mixed pressure.
Confidence / visibility: visible when both sides have enough local signal.
Export path: macroWorld regions/events and display masks.
Semantic tag relation: may contribute to `H domain`, `B range`, and V0.14A `mixed_pressure`.
Future notes: no combat layer is added.

## migration_route

Source: lineage centroid paths, macro routes, old/current Human seat anchors.
Input signals: Human lineage movement, settlement transitions, seat continuity.
State values: current route, old route, abandoned route.
Confidence / visibility: routes are compact and capped.
Export path: macroWorld routes, lineage summaries.
Semantic tag relation: older helper path tags are hidden by default; identity appears in place memory.
Future notes: no pathfinding or road terrain.

## spirit_outbreak

Source: Spirit/MARK macro detection and rot pressure.
Input signals: Spirit units, MARK clusters, rot source influence.
State values: active outbreak, contested/corrupted placeState.
Confidence / visibility: stronger clusters are more visible.
Export path: macro regions/events, place snapshots.
Semantic tag relation: can produce `S scar` after active pressure fades.
Future notes: no story or plague system.

## spirit_scar

Source: MARK trace, macro memory, population Spirit shape.
Input signals: MARK cells, Spirit residue, hollow/rot memory.
State values: scar, fading scar, corrupted local placeState.
Confidence / visibility: one visible `S scar` tag is usually enough.
Export path: macro memory, population shapes, semantic tags, place memory snapshots.
Semantic tag relation: `S scar`.
Future notes: V0.14A maps this to `spirit_scarred` and `spirit_scar`.

## former_settlement memory

Source: Human lineage seat history, polity old seats, remnant villages.
Input signals: old seat records, previous polity id, inherited/remnant fields.
State values: old, remnant, inherited, collapsed reference.
Confidence / visibility: current collapsed polities cannot own active seats; remnants are capped.
Export path: `humanLineageMemorySummary`, `humanPolitySummary`, `placeMemory`.
Semantic tag relation: `H old seat`, `H remnant`.
Future notes: memory remains compact and observer-only.
