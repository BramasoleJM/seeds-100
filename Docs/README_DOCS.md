# Tri-Species World Simulation Docs

This folder contains project documentation, stage summaries, planning memory, archived task prompts, and stable backups.

The project is currently a `40 x 25` single-screen tri-species cellular world prototype. It is not yet a Zelda-style multi-screen overworld.

---

## Current Source Of Truth

Use the root-level files first:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
AGENTS.md
```

`TRI_SPECIES_WORLD_SIM_RULES.md` is the rule source of truth. Any rule change should be written there before code changes.

---

## Active Docs

```text
Docs/Architecture/ARCHITECTURE_MAP.md
Docs/Architecture/OBJECT_SCHEMA.md
Docs/Architecture/SEMANTIC_TRAITS.md
Docs/Architecture/PLACE_ARCHETYPES.md
Docs/Architecture/MACRO_PATTERNS.md
Docs/Architecture/HUMAN_IDENTITY_STATES.md
Docs/Architecture/PROTO_CULTURE_HINTS.md
```

These architecture docs describe the current observer layers and the V0.14B.1 audit direction.

---

## Root Duplicates

Some docs also exist at the project root for quick access:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
TRI_SPECIES_JSON_EXPORT_SPEC.md
CODEX_START_FROM_ZERO_PROMPT.md
CODEX_ADD_JSON_EXPORT_PROMPT.md
AGENTS.md
```

Prefer the root rule file when implementing. The copies under `Docs/` may be kept for packaging/history and should be synchronized only when intentionally updating documentation.

---

## Archive

```text
Docs/Archive/Memory/
```

Old planning memory. These files are useful for historical context but should not be treated as current direction.

```text
Docs/Archive/Tasks_V0_2_to_V0_8_3/
```

Older implementation prompts from stabilization through V0.8.3.

```text
Docs/Archive/Tasks_V0_8_4_to_V0_9_3/
```

Recent completed prompts covering readable macro patterns through Macro View Stability.

---

## Backups

```text
Docs/Backups/
```

Stable snapshots and backup zips. Do not edit backup contents during normal development.

---

## Current Direction

Current completed stage:

```text
TRI_SPECIES_WORLD_SIM_V0.14B.1_PROTO_CULTURE_READABILITY_AUDIT
```

Recommended next stage:

```text
Next observer-only audit or tuning task, after reviewing V0.14B.1 exported summaries.
```

V0.14B added compact `protoCultureHints` and anchor-level `protoCultureMemory` to Place Memory for Human-related inspected places.

V0.14B.1 adds compact export-derived `protoCultureSummary` inside `placeMemory` for recording and snapshot audit readability.

```text
protoCultureHints are observer-only interpretation signals.
protoCultureSummary is export-only audit data.
protoCultureHints are not civilizations, factions, AI, resources, buildings, NPCs, story events, myth events, quests, or tarot mechanics.
protoCultureHints and protoCultureSummary must not change H/B/S ecology, movement, fertility, POI behavior, terrain, units, tick order, river blockers, or Explore movement.
```

Do not add multi-screen maps, NPCs, quests, resource economy, buildings, civilization gameplay, AI calls, tarot mechanics, save/load, network calls, or external libraries yet.
