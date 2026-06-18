# CODEX_START_FROM_ZERO_PROMPT.md

Copy this whole prompt into Codex after creating a new empty project folder.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Act as Executor.

Build the first visual demo for the single-screen tri-species cellular automata prototype.

Do not implement the Zelda-style multi-screen system yet.

## Technical requirements

Use only plain HTML/CSS/JavaScript.

Create this file structure:

```text
index.html
style.css
sim.js
README.md
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
CODEX_START_FROM_ZERO_PROMPT.md
```

If the `.md` files already exist, preserve them.

No framework.  
No build step.  
No network calls.  
No external libraries.

The demo should run by opening `index.html` in a browser.

## Simulation requirements

Implement the rules in `TRI_SPECIES_WORLD_SIM_RULES.md`.

World:

```text
single grid
default 60 x 40
cell = terrain + optional unit
```

Terrain:

```text
EMPTY `.`
FIELD `F`
WILD `W`
MARK `M`
BORDER `X`
BLOCK `#`
```

Units:

```text
Human `H`
Beast `B`
Spirit `S`
empty
```

Tick order:

```text
1. Movement
2. Terrain rewrite
3. Conflict / death / conversion
4. Reproduction
5. Terrain decay
6. Render and statistics update
```

Use synchronous updates.  
Do not mutate the current world while computing decisions for the same phase.

## UI requirements

Show:

```text
grid
terrain background color
unit letter/glyph on top
statistics panel
legend
```

Controls:

```text
Play / Pause
Step
Reset
Randomize
Tick speed slider
```

Optional controls:

```text
initial Human count
initial Beast count
initial Spirit count
overcrowding threshold
toggle movement on/off
```

Statistics:

```text
tick
Human count
Beast count
Spirit count
FIELD count
WILD count
MARK count
BORDER count
```

## Initialization

Default initialization should create readable clusters:

```text
Human cluster near left-center with FIELD nearby.
Beast cluster near right-center with WILD nearby.
Spirit cluster near bottom-center with MARK nearby.
Some EMPTY space between clusters.
A few BLOCK obstacles are optional.
```

Randomize should create a different playable starting state, but avoid pure uniform noise.

## Code organization

In `sim.js`, keep functions readable.

Suggested functions:

```text
createDefaultWorld()
randomizeWorld()
cloneWorld(world)
getNeighbors(x, y)
countNeighborUnits(world, x, y)
countNeighborTerrains(world, x, y)
planMovements(world)
applyTerrainRewrite(world)
applyConflict(world)
applyReproduction(world)
applyTerrainDecay(world)
stepWorld()
renderWorld()
updateStats()
```

Document in comments which functions correspond to:

```text
movement
terrain rewrite
conflict
reproduction
decay
rendering
```

## README.md

Write a README explaining:

```text
how to run
what the prototype tests
what H / B / S mean
what F / W / M / X mean
the tick order
which rules are implemented
any simplifications
what to observe
```

## Important constraints

Do not add lore.

Do not add tarot.

Do not add multi-screen map.

Do not rename the species into fantasy names.

Do not add more terrain types.

Do not add hidden resource bars.

Do not implement “faith”, “village”, “forest”, or “story” systems.

This first version is only for validating the tri-species grid automata.

## Completion report

After implementation, report:

```text
files created or modified
how to run
which rules from TRI_SPECIES_WORLD_SIM_RULES.md are implemented
any simplifications
suggested first test observations
```
