# CODEX V0.14C.1 Human Culture Candidate Maturity & Dominance Audit Task

## Executor instruction

Use this document as the implementation brief for V0.14C.1.

This stage is an observer-only export / audit / readability patch on top of the existing V0.14C Human Culture Candidate Rollup.

It is not a civilization system, civilization unlock, AI system, tarot mechanic, story event layer, myth layer, resource economy, building layer, NPC layer, quest system, new terrain, new unit, save/load system, network feature, or multi-screen map.

Before editing implementation code, read:

```text
AGENTS.md
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/HUMAN_CULTURE_CANDIDATES.md
sim.js V0.14C humanCultureCandidateSummary helpers
tests/v0_14c_human_culture_candidate_rollup.test.js
```

If V0.14C `humanCultureCandidateSummary` is missing, stop and report that V0.14C must be applied first. Do not reimplement V0.14C from scratch.

## Goal

Make existing Human culture candidate exports easier to read by adding:

```text
ownerLifecycleClass
candidateUse
one dominantCandidate per owner
capped secondaryCandidates
candidateDominance
dominanceScore
evidenceSummary
maturityReason
dominance / maturity aggregate counts
```

This must not change base candidate scoring except by adding derived audit/readability fields.

## Hard constraints

Do not change:

```text
H/B/S movement
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
semantic trait derivation behavior
place archetype priority
protoCultureHints scoring
protoCultureMemory update rules
wake report sparsity
V0.14C base candidate scoring
```

Do not add:

```text
civilization modules
civilization unlock effects
civilization gameplay
AI calls
tarot mechanics
story events
myth events
resources
buildings
NPCs
quests
new terrain
new unit types
network calls
external libraries
save/load
multi-screen map
```

## Required behavior

Every owner in `humanCultureCandidateSummary.byPolity` and `humanCultureCandidateSummary.byLineage` should include:

```text
ownerLifecycleClass
dominantCandidate
secondaryCandidates
candidateDominance
topCandidates
candidateSignals
```

Every candidate signal should include:

```text
candidateUse
ownerLifecycleClass
dominanceScore
evidenceSummary
maturityReason
```

Keep existing V0.14C fields for compatibility.

Caps:

```text
dominantCandidate: max one per owner
secondaryCandidates: max 3
topCandidates: max 4, ordered by dominance ranking
candidateDominance.secondary: max 3
```

## Lifecycle mapping

```text
active/stable/expanding/split/promotable -> active
pressured/seatless/declining/fading -> at_risk
collapsed/remnant/abandoned -> legacy
missing or unexpected -> unknown
```

Candidate use:

```text
active -> active_candidate
at_risk -> at_risk_candidate
legacy -> legacy_candidate
unknown -> active_candidate fallback
```

Unknown fallback is deterministic audit behavior and must be documented.

## Context-only rule

Do not let context-only anchors own Human culture candidates.

These remain context-only or context evidence:

```text
POI
scar
river
forest
beast_range
ordinary place
```

Only Human polity or Human lineage ids can own candidate signals.

## Aggregate additions

Add to `humanCultureCandidateSummary`:

```text
dominantCandidateTypeCounts
secondaryCandidateTypeCounts
candidateUseCounts
ownerLifecycleCounts
ambiguousOwnerCount
highScoreEmergingCount
```

Add the same dominance/maturity aggregate fields to multi-seed audit candidate totals.

## Tests

Add:

```text
tests/v0_14c_1_culture_candidate_maturity_dominance.test.js
```

Cover:

```text
one dominant candidate per owner
candidateUse follows lifecycle
collapsed owners are legacy
high-score emerging has clear maturityReason
evidenceSummary clarifies unique/displayed/sample counts
aggregate dominance fields exist in multi-seed audit
context-only anchors still cannot own candidates
JSON exports stay compact and stringifiable
```

## Documentation

Update:

```text
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/HUMAN_CULTURE_CANDIDATES.md
```

Emphasize observer-only export/readability scope, no civilization unlocks, and no bottom-layer simulation changes.

## Required verification

Run:

```text
node --check sim.js
node tests/v0_14c_1_culture_candidate_maturity_dominance.test.js
node tests/v0_14c_human_culture_candidate_rollup.test.js
node tests/v0_14b_proto_culture_hints.test.js
node tests/v0_14b_1_proto_culture_summary.test.js
node tests/v0_14b_2_explore_river_proto_audit_usability.test.js
node tests/v0_14a_semantic_place_layer.test.js
node tests/v0_14a_1_semantic_place_tuning.test.js
node tests/json-export.test.js
```

## Final report

Report:

```text
files changed
tests run and results
new export fields
known simplifications
confirmation that bottom simulation rules did not change
```
