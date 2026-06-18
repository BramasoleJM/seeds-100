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
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_9_3_STAGE_SUMMARY_CN.md
```

Current sealed stage summary. V0.9.3 is the stable Macro View build.

```text
Docs/Current/TRI_SPECIES_WORLD_SIM_V0_10_STAGE_PLAN_CN.md
```

Current next-stage plan. V0.10 should focus on Regional Substrate, not multi-screen Zelda.

```text
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_V0_10_SIDE_CHAT_MEMORY_CN.md
```

Active planning memory for V0.10. This is the most important discussion record for basin/refuge/hollow, soft constraints, and regional resilience.

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
TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

Recommended next stage:

```text
V0.10 Regional Substrate Prototype
```

V0.10 should add a hidden single-screen regional bias layer:

```text
basin  = Settlement Basin
refuge = Wild Refuge
hollow = Scar Hollow
none   = normal region
```

The goal is soft geographic influence, not hard scripting:

```text
basin makes settlement more likely.
refuge makes WILD / Beast recovery more likely.
hollow makes MARK / scar traces more persistent.
Macro View explains the results.
```

Do not add multi-screen maps, NPCs, quests, resource economy, buildings, tarot mechanics, save/load, network calls, or external libraries yet.
