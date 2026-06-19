# CODEX V0.14C Human Culture Candidate Rollup Task

## Summary

Implement `TRI_SPECIES_WORLD_SIM_V0.14C_HUMAN_CULTURE_CANDIDATE_ROLLUP`.

V0.14C adds an observer-only export / analysis layer that rolls up place-level `protoCultureMemory` into Human polity / lineage culture candidate signals.

This prepares future civilization variant gates, but it must not implement civilizations, civilization gameplay, unlocks, effects, factions, AI, resources, story, NPCs, quests, buildings, new terrain, new units, or multi-screen maps.

## Required Reading Before Editing

Read these first:

```text
AGENTS.md
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
tests/v0_14b_proto_culture_hints.test.js
tests/v0_14b_1_proto_culture_summary.test.js
tests/v0_14b_2_explore_river_proto_audit_usability.test.js
```

## Hard Constraints

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
semantic trait derivation
place archetype priority
protoCultureHints scoring
protoCultureMemory update rules
protoCultureSummary counts
wake report sparsity
```

Do not add:

```text
civilization modules
civilization gameplay
civilization unlock effects
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

V0.14C is only:

```text
observer-only
export-derived / analysis-derived
compact
deterministic
testable
```

## Goal

Answer this question in exports and audit helpers:

```text
Which Human polity or lineage is accumulating enough place-memory evidence to become a future civilization variant candidate?
```

The rollup is:

```text
PlaceMemory anchors
  -> Human polity / lineage ownership
  -> Human culture candidate signals
```

## New Export Object

Add compact `humanCultureCandidateSummary` to:

```js
snapshot.placeMemory.humanCultureCandidateSummary
recording.placeMemory.humanCultureCandidateSummary
protoCultureSummaryExport.placeMemory.humanCultureCandidateSummary
currentPlaceReview.placeMemory.humanCultureCandidateSummary
```

Also extend `runProtoCultureSummaryAuditForSeedsForTest` so each run includes `humanCultureCandidateSummary` and the aggregate includes compact candidate totals. This is a review convenience so the user can run multiple seeds and hand the JSON to GPT.

Do not store this as live mutable simulation state. Prefer deriving it at export / review time.

## Data Shape

Use this compact shape:

```js
humanCultureCandidateSummary: {
  version: "0.14C",
  totalPolities: 0,
  totalLineages: 0,
  politiesWithCandidates: 0,
  lineagesWithCandidates: 0,
  candidateTypeCounts: {},
  byPolity: [],
  byLineage: [],
  contextOnlySignals: []
}
```

Owner entries:

```js
{
  ownerType: "polity",
  ownerId: "human_polity_001",
  state: "active",
  rootLineageId: "human_lineage_001",
  rootPolityId: "human_polity_001",
  topCandidates: ["river_bound_polity"],
  candidateSignals: {
    river_bound_polity: {
      score: 0.72,
      status: "candidate",
      primaryHint: "river_bound",
      subjectEvidenceAnchors: ["seat:human_polity_001_seat", "village:human_village_002"],
      contextEvidenceAnchors: ["poi:poi_spring_003"],
      evidenceCounts: {
        subject: 2,
        context: 1,
        stableSubject: 2,
        activeSubject: 2
      },
      sourceHints: ["river_bound", "spring_refuge"],
      reason: "Stable Human seat and village evidence repeatedly show river-bound traits."
    }
  }
}
```

Keep arrays capped and deterministic.

Do not include full snapshots, full anchors, frames, terrain rows, unit rows, or long histories.

## Candidate Statuses

Only use:

```text
emerging
candidate
```

Never use:

```text
ripe
unlocked
active civilization
```

Definitions:

```text
emerging:
score >= 0.35
at least 1 Human subject evidence anchor

candidate:
score >= 0.65
at least 2 Human subject evidence anchors
at least 1 stable Human subject signal
```

If there is no subject evidence, status must be omitted or null.

Context-only evidence must never produce `emerging` or `candidate`.

## Evidence Roles

Subject evidence can support a Human owner:

```text
seat
village
domain
outpost
old_seat
remnant
```

Subject evidence must resolve to a Human polity id or Human lineage id through current or remembered identity.

Context evidence can support, but cannot own a candidate:

```text
poi
scar
beast_range
river
ordinary_place
```

Context evidence may add a small bonus only if subject evidence already exists.

## Candidate Types

Do not add more than these six:

```text
river_bound_polity
memory_bound_lineage
monument_centered_polity
forest_edge_polity
frontier_outpost_polity
split_lineage_polity
```

### `river_bound_polity`

Source hints:

```text
river_bound
spring_refuge
```

Required:

```text
at least 2 Human subject anchors with river_bound or spring_refuge evidence
```

Context bonus:

```text
spring POI
river place
river_village archetype
```

### `memory_bound_lineage`

Source hints:

```text
memory_bound
seatless_drift
scar_bound
```

Required:

```text
old_seat, remnant, seat, village, or domain subject evidence
lineage id or remembered lineage identity
```

Context bonus:

```text
old seat
haunted remnant
spirit scar
collapsed memory
```

### `monument_centered_polity`

Source hints:

```text
monument_centered
memory_bound
scar_bound
```

Required:

```text
at least 1 Human subject anchor with monument_centered
and at least 1 additional Human subject or Monument context anchor
```

### `forest_edge_polity`

Source hints:

```text
forest_edge
frontier_adapted
```

Required:

```text
at least 1 Human subject anchor with forest_edge
and either another Human subject anchor or Great Forest / Beast range context
```

### `frontier_outpost_polity`

Source hints:

```text
frontier_adapted
scar_bound
forest_edge
```

Required:

```text
at least 1 outpost subject anchor
and at least 1 active/stable frontier_adapted signal
```

### `split_lineage_polity`

Source hints:

```text
split_lineage
memory_bound
seatless_drift
```

Required:

```text
splitFromPolityId
or polityAncestryIds length > 1
or rootPolityId differs from ownerId
or split_polity trait
```

Also require:

```text
at least 1 Human subject anchor connected to the split polity / lineage
```

## Owner Resolution

Add deterministic owner resolver:

```js
function resolveCultureOwnerIdsForAnchor(anchor) {}
```

Priority:

```text
1. anchor.currentSnapshot.humanMemory.polity.id
2. anchor.currentSnapshot.humanMemory.lineage.id
3. anchor.currentSnapshot.rememberedHumanIdentity.polityId
4. anchor.currentSnapshot.rememberedHumanIdentity.lineageId
5. anchor.rememberedHumanIdentity.polityId
6. anchor.rememberedHumanIdentity.lineageId
7. anchor.sourceRef / anchor.sourceId if clearly a Human polity / lineage / village / outpost source
```

Do not invent owner ids.

If no Human owner can be resolved, the anchor may only be context evidence.

## Scoring

Keep scoring simple, deterministic, and compact.

Suggested scoring:

```text
subjectScores = top 3 scores from Human subject anchors for the candidate's source hints
contextScores = top 3 scores from context anchors for the candidate's source hints

base = average(subjectScores)
coverageBonus = min(0.2, 0.08 * max(0, subjectEvidenceCount - 1))
stableBonus = stableSubjectEvidenceCount > 0 ? 0.1 : 0
contextBonus = min(0.15, average(contextScores) * 0.2)

score = clamp01(round2(base + coverageBonus + stableBonus + contextBonus))
```

If `subjectScores` is empty:

```text
score = 0
status = null
```

Do not tune existing place-level protoCulture scoring.

## Suggested Helper Functions

Add pure helpers near current proto-culture summary helpers:

```js
const HUMAN_CULTURE_CANDIDATE_VERSION = "0.14C";

function createEmptyHumanCultureCandidateSummary() {}
function summarizeHumanCultureCandidatesForPlaceMemory(memory = placeMemory, polityMemory = humanPolityMemory, lineageMemory = humanLineageMemory) {}
function resolveCultureOwnerIdsForAnchor(anchor) {}
function classifyCultureEvidenceRole(anchor) {}
function extractCultureCandidateEvidenceFromAnchor(anchor) {}
function scoreCultureCandidateSignal(candidateType, evidence) {}
function createCultureCandidateSignal(candidateType, owner, evidence) {}
function compactCultureCandidateOwner(owner, signals) {}
```

Test hooks:

```js
summarizeHumanCultureCandidatesForPlaceMemoryForTest
resolveCultureOwnerIdsForAnchorForTest
```

## Tests

Add:

```text
tests/v0_14c_human_culture_candidate_rollup.test.js
```

Cover:

```text
summary helper exists
river_bound_polity candidate from seat + village subject evidence
POI context alone cannot create candidate
memory_bound_lineage candidate from old seat + village/domain
split_lineage_polity emerging/candidate from split ancestry evidence
frontier_outpost_polity from outpost evidence
recording export integration
lightweight proto-culture summary export integration
current place review integration
multi-seed audit includes candidate summaries / aggregate
no mutation of placeMemory
JSON.stringify works
```

Also run:

```text
node --check sim.js
node tests/v0_14b_proto_culture_hints.test.js
node tests/v0_14b_1_proto_culture_summary.test.js
node tests/v0_14b_2_explore_river_proto_audit_usability.test.js
node tests/v0_14c_human_culture_candidate_rollup.test.js
node tests/json-export.test.js
```

Run more cheap tests if practical.

## Documentation Updates

Update:

```text
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
Docs/README_DOCS.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
```

Add:

```text
Docs/Architecture/HUMAN_CULTURE_CANDIDATES.md
```

Docs must say:

```text
Human culture candidates are observer-only.
Only Human polity / lineage can own candidate signals.
POIs, scars, rivers, springs, forests, Beast ranges, and ordinary places are context only.
Only emerging / candidate statuses exist.
No civilization module or gameplay effect is implemented.
```

## Review Tool Requirement

The existing user review flow should work without a new UI:

```text
1. Run Macro View.
2. Click Inspect Current Places.
3. Export Proto-Culture Summary JSON.
4. Check placeMemory.humanCultureCandidateSummary.
```

Additionally, extend `runProtoCultureSummaryAuditForSeedsForTest` so automated multi-seed review JSON includes candidate summaries and aggregate candidate counts. This is the convenient review tool for larger samples.

## Acceptance Criteria

1. `node --check sim.js` passes.
2. Existing V0.14B / V0.14B.1 / V0.14B.2 tests pass.
3. New V0.14C test passes.
4. Recording export includes `placeMemory.humanCultureCandidateSummary`.
5. Snapshot export includes `placeMemory.humanCultureCandidateSummary`.
6. Lightweight proto-culture summary export includes `placeMemory.humanCultureCandidateSummary`.
7. Current tick place review includes `placeMemory.humanCultureCandidateSummary`.
8. Multi-seed audit helper includes candidate summaries and compact aggregate candidate counts.
9. Candidate owners are only Human polity / lineage owners.
10. POI / scar / beast_range / river context cannot create candidates without Human subject evidence.
11. Summary is compact, deterministic, and JSON-stringifiable.
12. Summary helper does not mutate world, placeMemory, humanLineageMemory, humanPolityMemory, or protoCultureMemory.
13. No existing protoCultureHint scoring or gate is changed.
14. No H/B/S ecology, Explore behavior, map seed behavior, or wake report sparsity is changed.
15. No civilizations, civilization modules, AI, tarot, story events, resources, buildings, NPCs, quests, new terrain, or new units are added.
16. Docs are updated.

## Checkpoint Plan

Work checkpoint by checkpoint:

1. Report plan before editing: files to touch, helpers, tests, docs, no simulation rule changes.
2. Add `Docs/Architecture/HUMAN_CULTURE_CANDIDATES.md` skeleton.
3. Add pure rollup helpers and test hooks.
4. Add V0.14C tests for pure helper and export integration.
5. Integrate summaries into snapshot / recording / lightweight export / current place review / multi-seed audit.
6. Finalize docs.
7. Run verification and report changed files, tests, known simplifications, and confirmation that no gameplay/civilization system was added.
