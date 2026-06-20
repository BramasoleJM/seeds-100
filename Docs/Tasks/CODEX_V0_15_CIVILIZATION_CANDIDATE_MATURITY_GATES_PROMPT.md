# CODEX V0.15 Civilization Candidate Maturity Gates Prompt

## Stage

`TRI_SPECIES_WORLD_SIM_V0.15_CIVILIZATION_CANDIDATE_MATURITY_GATES`

## Executor scope

Implement an observer-only maturity gate layer on top of the existing V0.14C.1 Human culture candidate summary.

This patch must answer, in compact JSON exports:

- which Human culture candidates are merely present;
- which are ready;
- which are ripe;
- which are volatile ripe;
- which are legacy seeds;
- which are blocked or not ready;
- why each candidate did or did not mature.

This is an export, audit, and readability patch only. It is not a civilization system, not an unlock layer, and not gameplay.

## Required reading before implementation

Read and follow:

- `AGENTS.md`
- `README.md`
- `TRI_SPECIES_WORLD_SIM_RULES.md`
- `Docs/README_DOCS.md`
- `Docs/Architecture/PROTO_CULTURE_HINTS.md`
- `Docs/Architecture/HUMAN_IDENTITY_STATES.md`
- `Docs/Architecture/OBJECT_SCHEMA.md`
- `Docs/Architecture/HUMAN_CULTURE_CANDIDATES.md`
- existing V0.14C.1 `humanCultureCandidateSummary`, dominance, and multi-seed audit code in `sim.js`
- `tests/v0_14c_1_culture_candidate_maturity_dominance.test.js`
- `tests/v0_14c_human_culture_candidate_rollup.test.js`

## Hard boundaries

Do not change:

- H/B/S movement
- tick order
- lifecycle
- conflict
- conversion
- terrain rewrite
- reproduction
- fertility
- POI effects
- river blockers
- terrain types
- unit types
- terrain decay
- Explore movement
- map seed semantics
- protoCultureHint scoring
- protoCultureMemory update rules
- Human identity ownership rules
- wake report sparsity

Do not add:

- civilization modules
- civilization unlocks
- civilization gameplay effects
- AI calls
- tarot
- story or myth events
- resources
- buildings
- NPCs
- quests
- new terrain
- new units
- save/load
- network calls
- external dependencies
- multi-screen map

Do not read, modify, or submit `compressed_recordings/`.

## Implementation requirements

1. Reuse the V0.14C.1 Human culture candidate fields:
   - `dominantCandidate`
   - `secondaryCandidates`
   - `candidateDominance`
   - `dominanceScore`
   - `candidateUse`
   - `ownerLifecycleClass`
   - `evidenceSummary`
   - `maturityReason`
2. Add a compact maturity evaluation to each candidate signal.
3. Add an owner-level maturity summary that answers:
   - what this owner is becoming;
   - whether it is mature enough for future systems to read;
   - why it is not mature yet.
4. Add summary-level and multi-seed aggregate maturity counts.
5. Keep context-only anchors as context only. POIs, scars, rivers, forests, and Beast ranges may support evidence, but cannot own or mature a Human civilization candidate by themselves.
6. Keep secondary candidates mostly `not_ready` or `blocked` unless there is a clearly documented deterministic reason.
7. Treat owner lifecycle explicitly:
   - active/stable owners may reach `ready` or `ripe`;
   - pressured/seatless/declining/fading owners with strong direction become `volatile_ripe`;
   - collapsed/remnant/abandoned owners with strong direction become `legacy_seed`;
   - ambiguous owners are blocked or downgraded and must not automatically become `ripe`.
8. Add a helper or extend the existing audit helper so a 5-seed / 200-tick / inspectEvery 25 JSON review can be generated for GPT review.
9. Save that generated review JSON to:
   - `Docs/Generated/ProtoCultureAudit/v015_civilization_candidate_maturity_audit_5seeds_200ticks_inspect25.json`

`Docs/Generated` should remain an unsubmitted generated output area.

## Documentation requirements

Add:

- `Docs/Architecture/CIVILIZATION_CANDIDATE_MATURITY.md`

Update:

- `README.md`
- `TRI_SPECIES_WORLD_SIM_RULES.md`
- `Docs/README_DOCS.md`
- `Docs/Architecture/OBJECT_SCHEMA.md`
- `Docs/Architecture/PROTO_CULTURE_HINTS.md`
- `Docs/Architecture/HUMAN_CULTURE_CANDIDATES.md`

Docs must state that V0.15 is observer-only and does not unlock or mutate civilizations.

## Test requirements

Add:

- `tests/v0_15_civilization_candidate_maturity_gates.test.js`

Cover at least:

1. ready is selective;
2. ripe is stricter than ready;
3. context-only evidence cannot mature;
4. legacy owners become `legacy_seed`;
5. ambiguity blocks or downgrades ripe;
6. at-risk strong owners become `volatile_ripe`;
7. export is compact, deterministic, and non-mutating;
8. multi-seed audit includes maturity distribution fields.

## Required verification

Run:

```text
node --check sim.js
node tests/v0_15_civilization_candidate_maturity_gates.test.js
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

- files changed;
- design choices;
- field structure;
- threshold logic;
- 5-seed audit summary;
- tests run and results;
- known simplifications;
- confirmation that bottom-layer simulation rules did not change.
