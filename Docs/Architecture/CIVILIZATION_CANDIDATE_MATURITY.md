# Civilization Candidate Maturity

V0.15 adds observer-only maturity gates on top of `placeMemory.humanCultureCandidateSummary`.

This is not a civilization system. It does not unlock modules, mutate owners, add gameplay, or change H/B/S ecology.

## Scope

The maturity layer reads the existing V0.14C.1 Human culture candidate export:

```text
dominantCandidate
secondaryCandidates
candidateDominance
dominanceScore
candidateUse
ownerLifecycleClass
evidenceSummary
maturityReason
```

It derives compact review fields only.

## Candidate Signal Fields

Each candidate signal may include:

```text
maturityStage
maturityScore
readiness
maturityReasons
maturityBlockers
```

`maturityScore` is a deterministic 0..1 export score. It combines the existing candidate score, dominance score, stable Human subject evidence, active Human subject evidence, unique Human subject anchors, accumulated subject samples, dominant status, and clear dominance.

It does not feed back into candidate scoring or proto-culture memory.

## Maturity Stages

```text
not_ready
ready
ripe
volatile_ripe
legacy_seed
blocked
```

`not_ready` means a signal is present but is secondary, emerging, or not the owner direction.

`ready` means the dominant candidate has enough Human-owned subject evidence and score clarity for future systems to read it.

`ripe` means an active owner has a ready dominant candidate plus stronger evidence, stronger sample duration, and clear dominance.

`volatile_ripe` means an at-risk owner has a strong mature direction, but should not be treated as stable ripe.

`legacy_seed` means a legacy owner has a strong historical direction that may later support ruins, ancestral memory, or lost-civilization interpretation. It is not an active civilization.

`blocked` means the dominant direction is missing candidate status, lacks stable Human subject evidence, lacks enough Human subject anchors, is context-only, or is blocked by ambiguity / unclear dominance.

## Owner Fields

Each owner may include:

```text
maturedCandidate
readyCandidates
ripeCandidates
volatileRipeCandidates
legacySeedCandidates
blockedCandidates
notReadyCandidates
maturitySummary
```

`maturedCandidate` selects the strongest review-stage candidate in this order:

```text
ripe
volatile_ripe
legacy_seed
ready
```

`maturitySummary` keeps compact stage counts and a short reason for manual audit.

## Lifecycle Rules

Owner lifecycle changes the final maturity stage:

```text
active/stable/expanding/split/promotable -> active gates can become ready or ripe
pressured/seatless/declining/fading -> strong mature direction becomes volatile_ripe
collapsed/remnant/abandoned -> strong mature direction becomes legacy_seed
missing or unexpected -> unknown uses the active-style deterministic fallback
```

Unknown lifecycle is an audit fallback only. It is not a claim of active ownership or gameplay readiness.

## Subject Evidence Versus Context

Human culture maturity is Human-owned.

Allowed subject evidence:

```text
seat
village
domain
outpost
old_seat
remnant
Human lineage memory
Human polity memory
rememberedHumanIdentity tied back to a Human owner
```

Context evidence may support or color a candidate:

```text
poi
monument
spring
great_forest
rot_source
scar
beast_range
river
spirit_scar
```

Context-only evidence cannot create `ready`, `ripe`, `volatile_ripe`, or `legacy_seed`.

## Aggregate Fields

`humanCultureCandidateSummary` and the multi-seed audit aggregate include compact maturity counts:

```text
maturityStageCounts
readinessCounts
maturityByCandidateType
readyCandidateTypeCounts
ripeCandidateTypeCounts
volatileRipeCandidateTypeCounts
legacySeedCandidateTypeCounts
blockedCandidateTypeCounts
notReadyCandidateTypeCounts
ownerLifecycleMaturityCounts
ambiguousMaturityCounts
```

`runCivilizationMaturityAuditForSeedsForTest` wraps the existing proto-culture audit helper and exposes the same compact runs plus a `civilizationCandidateMaturitySummary` aggregate for manual review.

## Threshold Summary

Ready requires:

```text
dominant candidate
candidate status
at least one stable Human subject anchor
at least two unique Human subject anchors
maturityScore >= 0.68
```

Ripe requires ready-like evidence plus:

```text
active or unknown lifecycle
clear non-ambiguous dominance margin >= 0.08
strong Human subject evidence
maturityScore >= 0.86
base candidate score >= 0.94
```

Strong Human subject evidence means at least one stable Human subject anchor plus either:

```text
two stable anchors and enough unique anchors or samples
or accumulated subject samples >= 12
```

At-risk owners with strong mature direction become `volatile_ripe`. Legacy owners with strong mature direction become `legacy_seed`.

Ambiguous owners may be downgraded to `ready` or `blocked`; they do not become stable `ripe`.

## Non-Goals

V0.15 does not add:

```text
civilization modules
civilization unlocks
civilization gameplay
AI calls
tarot
story or myth events
resources
buildings
NPCs
quests
new terrain
new units
save/load
network calls
external dependencies
multi-screen maps
```

V0.15 does not change:

```text
movement
tick order
lifecycle
conflict
conversion
terrain rewrite
reproduction
fertility
POI effects
river blockers
terrain types
unit types
terrain decay
Explore movement
map seed behavior
protoCultureHint scoring
protoCultureMemory updates
Human identity ownership
wake report sparsity
```
