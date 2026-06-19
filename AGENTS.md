# AGENTS.md

## Project role

You are working on a prototype for a tri-species cellular world simulation.

This project is rule-first.

Before editing code, read:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
```

That file is the single source of truth for simulation rules.

---

## Current scope

Implement only the single-screen tri-species cellular automata prototype.

Do not implement the Zelda-style multi-screen version yet.

---

## Executor behavior

When acting as Executor:

1. Read `TRI_SPECIES_WORLD_SIM_RULES.md`.
2. Implement exactly the requested rule set.
3. Do not invent lore, new species, new terrain, or new mechanics.
4. If a rule is ambiguous, choose the simplest option and document the simplification in `README.md`.
5. Keep the project simple and readable.
6. Prefer plain HTML/CSS/JavaScript.
7. Do not add external dependencies unless explicitly requested.
8. After changes, report:
   - files changed
   - how to run
   - which rule sections are implemented
   - known simplifications or deviations

---

## Observer-only interpretation policy

Observer-only interpretation layers are allowed only when explicitly requested.

Observer-only fields may include:

```text
semanticTraits
placeArchetype
interpretationHints
rememberedHumanIdentity
protoCultureHints
protoCultureMemory
```

These fields must not change H/B/S ecology, tick order, movement, lifecycle, conflict, conversion, terrain rewrite, reproduction, fertility, POI effects, river blockers, terrain types, unit types, terrain decay, or Explore movement.

Proto-culture hints are not civilizations, factions, AI, resources, buildings, NPCs, story events, myth events, quests, or tarot mechanics.

---

## Do not add yet

Do not add:

```text
Zelda-style multi-screen map
screen-to-screen propagation
tarot mechanics
NPCs
quests
story events
resource economy
village buildings
specific race names
final art
save/load
network calls
external libraries
```

---

## Change protocol

For rule changes:

1. State the observed problem.
2. Update `TRI_SPECIES_WORLD_SIM_RULES.md`.
3. Update code.
4. Run or explain how to test.
5. Report expected visual difference.

Change only one major rule per iteration unless explicitly asked.

---

## Visual priority

Every system effect should be visible.

Good:

```text
Human creates FIELD.
Beast turns FIELD into WILD.
Spirit turns FIELD into MARK.
Human count drops after Spirit pressure.
```

Bad:

```text
The world feels unstable.
The village loses faith.
Nature remembers conflict.
```

Translate abstract ideas into direct grid behavior.
