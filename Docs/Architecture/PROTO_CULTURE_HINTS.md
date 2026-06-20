# Proto-Culture Hints

## Scope

V0.14B Observer-Only Proto-Culture Hints add compact interpretation signals to inspected Human-related places.

This layer is not a civilization system, faction system, AI system, resource economy, building layer, NPC layer, quest layer, story-event layer, myth-event layer, or tarot mechanic. It does not change Human, Beast, or Spirit ecology.

## Data Shape

`PlaceSnapshot.protoCultureHints` is always an array. Non-Human-related places use an empty array.

```js
{
  id: "river_bound",
  score: 0.82,
  strength: "strong",
  sourceTraits: ["river_adjacent", "human_settled", "polity_owned"],
  sourceArchetype: "river_village",
  reason: "Human place is settled beside local river signals."
}
```

`PlaceMemoryAnchor.protoCultureMemory` is optional and compact.

```js
{
  version: "0.14B",
  primaryHint: "river_bound",
  stableHints: ["river_bound"],
  activeHints: ["river_bound", "spring_refuge"],
  signals: {
    river_bound: {
      score: 0.78,
      samples: 3,
      firstSeenTick: 120,
      lastSeenTick: 210,
      sourceTraits: ["river_adjacent", "human_settled", "polity_owned"]
    }
  }
}
```

## Human-Related Place Gate

Proto-culture hints may be produced only when a snapshot is Human-related.

A snapshot is Human-related when `semanticTraits` include at least one of:

```text
human_settled
human_seat
human_old_seat
human_outpost
human_remnant
human_domain
polity_owned
lineage_continuity
```

Snapshots with `humanMemory` or `rememberedHumanIdentity` also pass the gate.

Ordinary Spring, Great Forest, Beast range, River, Rot Source, or Spirit scar places do not produce proto-culture hints unless they are connected to Human memory, remembered Human identity, or Human semantic traits.

## Hint IDs

V0.14B allows only these hint ids:

```text
river_bound
forest_edge
memory_bound
scar_bound
frontier_adapted
monument_centered
spring_refuge
split_lineage
seatless_drift
```

`river_bound` reads river adjacency, river center/crossing, and `river_village`.

`forest_edge` reads Great Forest, Beast habitat, and `forest_edge_settlement`.

`memory_bound` reads old seats, remnants, lineage continuity, inherited or collapsed memory, remembered Human identity, `old_seat`, and `haunted_remnant`.

`scar_bound` reads Spirit pressure, Spirit scars, MARK corrosion, Rot Source context, `haunted_remnant`, `spirit_scar`, and `pressured_seat`.

`frontier_adapted` reads Human outposts, frontier outpost archetypes, mixed pressure, Beast pressure, Spirit pressure, and pressured polity state.

`monument_centered` reads Monument context plus current Human settlement, seat, lineage, or polity signals.

`spring_refuge` reads Spring context, fertility recovery, and `fertile_refuge`.

`split_lineage` reads split polity, lineage continuity, ancestry depth, and remembered prior polity or lineage identity.

`seatless_drift` reads seatless polity, old seat, recent abandonment, `seatless_polity_center`, and `old_seat`.

## Scoring

Scoring is deterministic and compact.

Scores start at 0, add fixed weights for matching trait and archetype signals, clamp to 0..1, and round to two decimals.

Strength thresholds:

```text
score < 0.35       weak
0.35 <= score < 0.65 emerging
score >= 0.65      strong
```

Each hint keeps a capped `sourceTraits` list so exports stay small.

## Memory

`protoCultureMemory` updates only when an anchor is inspected or resampled through the wake observation path.

Update rules:

```text
existing signal score *= 0.85
current hint score contributes hint.score * 0.35
scores clamp to 0..1 and round to two decimals
samples increment only when a hint appears
firstSeenTick is set once
lastSeenTick updates when the hint appears
signals below 0.15 are dropped
at most 8 signals are retained
activeHints require score >= 0.35
stableHints require score >= 0.65 and samples >= 2
primaryHint is the highest stable hint, then highest active hint, then null
```

## Integration

`snapshotPlace` derives `protoCultureHints` after `semanticTraits`, `placeArchetype`, and `interpretationHints`.

`inspectPlaceTarget` updates `PlaceMemoryAnchor.protoCultureMemory` from the new current snapshot.

`completeSleepObservation` updates `protoCultureMemory` for watched anchors, but wake reports remain sparse and do not show entries solely because proto-culture memory changed.

`computePlaceChange` exposes `protoCultureHints` and `protoCultureMemory` in `llmContext` for export/context use.

Snapshot and recording exports include `currentSnapshot.protoCultureHints` and anchor `protoCultureMemory` through compact Place Memory export.

## V0.14B.1 Readability Audit Summary

V0.14B.1 adds export-derived `placeMemory.protoCultureSummary` to snapshot and recording exports.

The summary is compact audit data only. It is derived during export and is not stored as live mutable simulation state.

Core fields:

```text
version
totalAnchors
anchorsWithHints
anchorsWithMemory
primaryHintCounts
stableHintCounts
activeHintCounts
anchorTypeCounts
anchorTypeWithHintCounts
nonHumanAnchorWithHints
nonHumanAnchorExamples
strongestExamplesByHint
```

`primaryHintCounts` counts each anchor `protoCultureMemory.primaryHint`.
`stableHintCounts` counts entries in `protoCultureMemory.stableHints`.
`activeHintCounts` counts entries in `protoCultureMemory.activeHints`.

`nonHumanAnchorWithHints` audits anchors whose type is not one of:

```text
village
seat
old_seat
outpost
remnant
domain
```

This is an audit label only. It does not change the Human-related proto-culture gate.

`strongestExamplesByHint` keeps up to three compact strongest anchors per allowed hint id using existing hint or memory scores.

V0.14B.1 does not tune `protoCultureHints`, `protoCultureMemory`, Human-related gates, semantic traits, place archetypes, wake report sparsity, or simulation rules.

## V0.14B.2 Lightweight Export And Audit Helper

V0.14B.2 adds a Recording-panel **Export Proto-Culture Summary JSON** control.

The lightweight export is compact:

```text
type: tri_species_proto_culture_summary
version: 0.14B.2
tick
sourceRecordingRange
placeMemory.protoCultureSummary
placeMemory.compactAnchors
```

`compactAnchors` keeps only anchor id/type/name, position, place archetype, primary/stable/active/current hints, and capped signal data.

The lightweight export excludes:

```text
frames
keyframes
terrainRows
unitRows
full snapshots
```

V0.14B.2 also adds `runProtoCultureSummaryAuditForSeedsForTest`, a deterministic test/audit helper for collecting compact proto-culture summaries across multiple seeds.

The helper is observer/audit tooling only. It does not change `protoCultureHints`, `protoCultureMemory`, Human-related gates, semantic traits, place archetypes, wake report sparsity, movement, terrain, units, fertility, POI behavior, river blockers, or any H/B/S ecology rules.

## V0.14C Human Culture Candidate Rollup

V0.14C adds `placeMemory.humanCultureCandidateSummary` to snapshot exports, recording exports, lightweight proto-culture summary exports, current place reviews, and multi-seed audit results.

The rollup is derived from Place Memory anchors, current / remembered Human polity and lineage identity, and existing `protoCultureMemory`.

Only Human polity or Human lineage owners can own candidate signals. Context places can support evidence but cannot own candidates:

```text
POIs
scars
rivers
springs
forests
Beast ranges
ordinary places
```

Only these candidate statuses exist:

```text
emerging
candidate
```

V0.14C does not change `protoCultureHints`, proto-culture scoring, Human-related gates, `protoCultureMemory` update rules, semantic traits, place archetypes, wake report sparsity, movement, terrain, units, fertility, POI behavior, river blockers, Explore movement, or any H/B/S ecology rules.

V0.14C does not implement civilization modules, civilization gameplay, unlock effects, AI, tarot, story events, myth events, resources, buildings, NPCs, quests, new terrain, new units, save/load, network calls, or multi-screen maps.

## V0.14C.1 Candidate Maturity And Dominance Audit

V0.14C.1 adds maturity and dominance audit fields to `placeMemory.humanCultureCandidateSummary`.

It reads existing `protoCultureMemory` and V0.14C candidate signals, then derives:

```text
ownerLifecycleClass
candidateUse
dominantCandidate
secondaryCandidates
candidateDominance
dominanceScore
evidenceSummary
maturityReason
```

This does not change `protoCultureHints`, proto-culture scoring, Human-related gates, `protoCultureMemory` update rules, semantic traits, place archetypes, wake report sparsity, movement, terrain, units, fertility, POI behavior, river blockers, Explore movement, or any H/B/S ecology rule.

Context-only anchors remain context-only and cannot own Human culture candidates.

## Future Use

Future civilization modules may read these hints as candidate signals, but V0.14B does not implement civilization modules or gameplay behavior.
