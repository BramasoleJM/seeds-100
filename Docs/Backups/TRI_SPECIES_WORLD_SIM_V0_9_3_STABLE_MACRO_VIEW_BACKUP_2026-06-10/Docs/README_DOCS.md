# Tri-Species World Simulation Docs

This folder contains the initial documentation package for the first prototype.

## Files

```text
TRI_SPECIES_WORLD_SIM_RULES.md
```

Project rule source for Codex and implementation.

```text
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Chinese readable version for design discussion.

```text
AGENTS.md
```

Project instructions for Codex / coding agents.

```text
CODEX_START_FROM_ZERO_PROMPT.md
```

Prompt to paste into Codex when starting from an empty folder.

## Current direction

We are not building the Zelda-style multi-screen material simulation yet.

We first validate a single-screen tri-species cellular automata:

```text
Human makes FIELD.
Beast makes WILD.
Spirit makes MARK.

Human counters Beast.
Beast counters Spirit.
Spirit counters Human.
```

After this base system feels alive, we can consider moving back to screen-space / Zelda-style regional simulation.
