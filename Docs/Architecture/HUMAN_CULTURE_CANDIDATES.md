# Human Culture Candidates

V0.14C adds observer-only Human culture candidate summaries. V0.14C.1 adds maturity and dominance audit fields. V0.15 adds observer-only civilization candidate maturity gates.

This is not a civilization module. It does not add civilization gameplay, unlocks, factions, AI, resources, buildings, NPCs, quests, story events, myth events, tarot mechanics, terrain, units, save/load, network calls, or a multi-screen map.

## Scope

`humanCultureCandidateSummary` rolls up place-level `protoCultureMemory` and current / remembered Human identity into compact Human polity and lineage candidate signals.

Only Human polity or Human lineage owners can own candidate signals.

Context places can support evidence, but cannot own candidates:

```text
POIs
scars
rivers
springs
forests
Beast ranges
ordinary places
```

## Statuses

Only these statuses exist:

```text
emerging
candidate
```

These candidate statuses are still separate from V0.15 maturity stages. There is no unlocked, active civilization, or gameplay effect status.

## Export Shape

Exports may include:

```js
humanCultureCandidateSummary: {
  version: "0.14C",
  civilizationMaturityVersion: "0.15",
  totalPolities: 0,
  totalLineages: 0,
  politiesWithCandidates: 0,
  lineagesWithCandidates: 0,
  candidateTypeCounts: {},
  dominantCandidateTypeCounts: {},
  secondaryCandidateTypeCounts: {},
  candidateUseCounts: {},
  ownerLifecycleCounts: {},
  ambiguousOwnerCount: 0,
  highScoreEmergingCount: 0,
  maturityStageCounts: {},
  readinessCounts: {},
  maturityByCandidateType: {},
  readyCandidateTypeCounts: {},
  ripeCandidateTypeCounts: {},
  volatileRipeCandidateTypeCounts: {},
  legacySeedCandidateTypeCounts: {},
  blockedCandidateTypeCounts: {},
  notReadyCandidateTypeCounts: {},
  ownerLifecycleMaturityCounts: {},
  ambiguousMaturityCounts: {},
  byPolity: [],
  byLineage: [],
  contextOnlySignals: []
}
```

The summary is derived at export / review time. It is not live mutable simulation state and must not feed back into proto-culture scoring, Human identity, ecology, movement, terrain, fertility, POI behavior, river blockers, Explore movement, tick order, or wake report visibility.

V0.14C.1 / V0.15 owner records include:

```text
ownerLifecycleClass
dominantCandidate
secondaryCandidates
candidateDominance
topCandidates
candidateSignals
maturedCandidate
readyCandidates
ripeCandidates
volatileRipeCandidates
legacySeedCandidates
blockedCandidates
notReadyCandidates
maturitySummary
```

V0.14C.1 / V0.15 candidate signals include:

```text
candidateUse
ownerLifecycleClass
dominanceScore
evidenceSummary
maturityReason
maturityStage
maturityScore
readiness
maturityReasons
maturityBlockers
```

## Candidate Types

V0.14C allows only:

```text
river_bound_polity
memory_bound_lineage
monument_centered_polity
forest_edge_polity
frontier_outpost_polity
split_lineage_polity
```

These are audit signals for future review only.

## Owner Resolution

Candidate signals can be owned only by Human polity or Human lineage ids already present in existing observer memory.

The resolver reads, in priority order:

```text
current snapshot Human polity id
current snapshot Human lineage id
snapshot remembered Human polity / lineage id
anchor remembered Human polity / lineage id
clear Human village / outpost source references
clear Human polity / lineage source ids
```

It must not invent ids. If no Human owner can be resolved, the anchor cannot own a candidate.

## Evidence Roles

Subject evidence can create a Human owner candidate only when it resolves to a Human polity or lineage:

```text
seat
village
domain
outpost
old_seat
remnant
```

Context evidence can support an existing Human owner candidate but cannot own one:

```text
poi
scar
beast_range
river
ordinary_place
```

Human-looking anchors without a resolved owner are kept in `contextOnlySignals` for audit visibility, but they do not provide context bonus to another owner.

## Scoring

Scoring is deterministic and compact.

The helper reads the top Human subject scores from the candidate type's allowed proto-culture hints, then applies small bonuses:

```text
coverage bonus for multiple Human subject anchors
stable bonus for at least one stable Human subject signal
context bonus from valid context anchors only when subject evidence exists
```

Status thresholds:

```text
emerging: score >= 0.35 and at least 1 Human subject evidence anchor
candidate: score >= 0.65, at least 2 Human subject evidence anchors, and at least 1 stable Human subject signal
```

Context-only evidence never creates `emerging` or `candidate`.

## Owner Lifecycle Class

V0.14C.1 derives `ownerLifecycleClass` from the existing owner state:

```text
active/stable/expanding/split/promotable -> active
pressured/seatless/declining/fading -> at_risk
collapsed/remnant/abandoned -> legacy
missing or unexpected -> unknown
```

`split` remains an active/living condition. `collapsed`, `remnant`, and `abandoned` are legacy.

## Candidate Use

Each candidate signal includes `candidateUse`:

```text
active -> active_candidate
at_risk -> at_risk_candidate
legacy -> legacy_candidate
unknown -> active_candidate deterministic fallback
```

`legacy_candidate` is historical context and must not be read as a living civilization unlock candidate.

The `unknown` fallback keeps exports deterministic when an owner state is missing. It is an audit compatibility label only.

## Dominance Ranking

Each owner may expose one `dominantCandidate` and up to three `secondaryCandidates`.

`topCandidates` remains for compatibility and is capped at four, ordered by dominance ranking.

`dominanceScore` is a derived 0..1 ranking score. It does not replace the base candidate `score`.

Ranking prefers:

```text
candidate status before emerging
higher dominanceScore
higher base score
more stable Human subject anchors
more active Human subject anchors
more unique Human subject anchors
more context anchors
stable candidate id tie-break
```

Context evidence alone cannot make a candidate dominant because context-only anchors still cannot own candidates.

## Ambiguity Rule

If the top two candidate directions have dominance scores within `0.08`, the owner exports:

```text
candidateDominance.ambiguous = true
candidateDominance.ambiguityReason = "Top two candidate directions have similar dominance scores."
```

This is a readability flag for cases where one owner has multiple plausible candidate directions.

## Evidence Summary

V0.14C.1 keeps old `evidenceCounts` and adds `evidenceSummary`:

```text
uniqueSubjectAnchorCount
uniqueContextAnchorCount
stableSubjectAnchorCount
activeSubjectAnchorCount
totalSubjectSamples
totalContextSamples
displayedSubjectAnchorCount
displayedContextAnchorCount
```

Unique counts are based on exported anchor refs. Sample counts come from accumulated proto-culture signal samples where available. Displayed counts match the capped evidence arrays.

## Maturity Reason

Every candidate signal includes `maturityReason`.

Examples:

```text
Candidate: score >= 0.65 with enough stable Human subject evidence.
Emerging despite high score: only one unique Human subject anchor is resolved.
Emerging: not enough stable Human subject evidence is resolved.
```

This explains why a high score can still be `emerging`.

## V0.15 Maturity Gates

Each candidate signal includes a compact V0.15 maturity gate:

```text
not_ready
ready
ripe
volatile_ripe
legacy_seed
blocked
```

`maturityStage` answers whether a candidate is merely present, ready for future systems to read, ripe enough to be a strong future target, unstable but mature, legacy-only, or blocked.

`maturityScore` is a deterministic 0..1 score derived from existing candidate score, dominance score, stable Human subject evidence, active Human subject evidence, unique Human subject anchors, accumulated subject samples, dominant status, and clear dominance.

Ready requires a dominant `candidate` signal with at least one stable Human subject anchor, at least two unique Human subject anchors, and `maturityScore >= 0.68`.

Ripe is stricter: active or unknown lifecycle, non-ambiguous dominance margin at least `0.08`, strong Human subject evidence, base candidate `score >= 0.94`, and `maturityScore >= 0.86`.

At-risk owners with strong mature direction export `volatile_ripe` instead of stable `ripe`.

Legacy owners with strong mature direction export `legacy_seed` instead of active `ready` or `ripe`.

Ambiguous owners may be `ready` or `blocked`, but do not become stable `ripe`.

Secondary candidates default to `not_ready`; this keeps one owner from appearing to mature in every plausible direction at once.

Context-only evidence cannot mature. POIs, scars, rivers, Springs, Great Forests, Rot Sources, forests, and Beast ranges may support context evidence, but cannot own `ready`, `ripe`, `volatile_ripe`, or `legacy_seed`.

## Active vs Legacy Interpretation

`active_candidate` and `at_risk_candidate` describe living or pressured owner contexts.

`legacy_candidate` describes collapsed, remnant, or abandoned owner context. It is useful for later interpretation of ruins, old seats, and remembered identity, but it is not a live civilization candidate.

## Export Integration

`humanCultureCandidateSummary` is included in:

```text
snapshot.placeMemory
recording.placeMemory
lightweight proto-culture summary export placeMemory
current tick place review placeMemory
multi-seed proto-culture audit runs and aggregate candidate totals
```

The object stays compact: owner summaries, candidate signals, evidence anchor ids, aggregate counts, dominance counts, maturity-stage counts, and context-only audit signals. It does not include full anchors, full snapshots, frames, terrain rows, or unit rows.

## Future Path

Future civilization modules may read these summaries as candidate gate input, but V0.14C through V0.15 do not unlock or activate any civilization variant.

The system may say:

```text
This Human polity is becoming a river-bound candidate.
This Human polity has a ready river-bound candidate.
This Human lineage has a legacy_seed memory-bound candidate.
```

It must not say:

```text
This Human polity has unlocked River Civilization.
```
