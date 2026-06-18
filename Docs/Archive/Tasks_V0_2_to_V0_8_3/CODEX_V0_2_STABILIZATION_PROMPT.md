# CODEX_V0_2_STABILIZATION_PROMPT.md

Copy this prompt into Codex to implement the first stabilization patch.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
```

Act as Executor.

We inspected two exported recordings:

```text
tri_species_recording_ticks_0000_0056.json
tri_species_recording_ticks_0000_0110.json
```

Observed problem:

```text
Humans go extinct around tick 24/25 in both recordings.
FIELD becomes 0 at the same time.
Beast and Spirit both expand, but the counter cycle does not close.
The system becomes Beast/Spirit only.
```

This means V0.1 is structurally imbalanced.

Implement V0.2 stabilization patch.

Do not add new species, new terrain types, tarot, multi-screen map, lore, or visual polish.

---

## Design diagnosis

Likely causes:

### 1. Dead raiders still rewrite terrain

Current order is:

```text
movement -> terrain rewrite -> conflict
```

So a Beast can enter FIELD, rewrite it to WILD, then die.
A Spirit can enter FIELD, rewrite it to MARK, then die.

This makes Beast/Spirit terrain damage too strong.

### 2. Supported Humans die under Spirit pressure

Current rule:

```text
If Human has spirit pressure and h >= 2:
    Human disappears
    terrain becomes BORDER
```

This is too punishing.

Supported Human clusters should resist Spirit.
Only isolated Humans should be converted.

### 3. MARK terrain alone pressures Humans too strongly

Current conversion uses:

```text
s + m >= 2
```

This means terrain MARK alone can help convert / remove Humans even without active Spirit presence.

V0.2 should require at least one neighboring Spirit for Human conversion.

### 4. Beast reproduction and WILD persistence are too strong

Beast grows very fast and WILD persists forever.
Once Humans are gone, Beast has no effective predator.

---

## Required V0.2 rule changes

### Change 1: Reorder tick phases

Change tick order from:

```text
1. Movement
2. Terrain rewrite
3. Conflict / death / conversion
4. Reproduction
5. Terrain decay
```

To:

```text
1. Movement
2. Conflict / death / conversion
3. Terrain rewrite by surviving units
4. Reproduction
5. Terrain decay
```

Important:

```text
Only surviving units rewrite the terrain under themselves.
```

If a Beast moves onto FIELD but is killed by Humans during conflict, FIELD should not become WILD.

If a Spirit moves onto FIELD but is removed by Beasts during conflict, FIELD should not become MARK.

If a Human is converted to Spirit during conflict, that conversion still sets terrain to MARK immediately.

If a conflict creates BORDER, terrain becomes BORDER immediately.

Update comments and README to reflect the new tick order.

---

### Change 2: Supported Humans resist Spirit instead of disappearing

Replace current Human-vs-Spirit rule.

Old:

```text
If s + m >= 2 and h < 2:
    Human becomes Spirit
    terrain becomes MARK

If s + m >= 2 and h >= 2:
    Human disappears
    terrain becomes BORDER
```

New:

```text
If s >= 1 and s + m >= 2 and h < 2:
    Human becomes Spirit
    terrain becomes MARK

If s >= 1 and s + m >= 2 and h >= 2:
    Human survives
    terrain unchanged
```

No BORDER is created for supported Humans under Spirit pressure in V0.2.

Reason:

```text
BORDER was killing supported Human clusters too quickly.
```

---

### Change 3: MARK cannot pressure Humans without active Spirit

Human conversion now requires:

```text
s >= 1
```

Full condition:

```text
s >= 1
and s + m >= 2
and h < 2
```

This means MARK terrain can amplify Spirit, but cannot act alone.

---

### Change 4: Beast reproduction stricter

Change Beast reproduction from:

```text
terrain is WILD
neighboring Beast count is 2 or 3
neighboring Human count < 2
```

To:

```text
terrain is WILD
neighboring Beast count is exactly 3
neighboring Human count < 2
```

Human reproduction may remain:

```text
2 or 3 neighboring Humans
terrain is FIELD
spiritPressure < 2
```

Spirit reproduction remains:

```text
exactly 2 neighboring Spirits
terrain is MARK
neighboring Beast count < 2
```

Reason:

```text
Beast growth was too fast in recordings.
```

---

### Change 5: Add WILD decay

In V0.1, WILD persists forever.

In V0.2:

```text
If WILD has no Beast in current cell or 8-neighborhood:
    WILD -> EMPTY
```

This makes Beast terrain require Beast presence.

---

## Update documentation

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add a version note:

```text
Rules version: TRI_SPECIES_WORLD_SIM_V0.2
```

Mention the V0.2 stabilization changes.

---

## Expected visual effect

After this patch:

```text
Humans should not reliably go extinct by tick 25.
FIELD should survive longer.
Beast should still raid FIELD, but suicide raids should not erase terrain.
Spirit should still convert isolated Humans, but not erase supported Human clusters.
WILD should shrink where Beasts are absent.
The system should retain all three species longer.
```

---

## Test target

Run a default simulation for at least 150 ticks.

Export recording JSON.

Target outcome is not perfect balance, but:

```text
At tick 100:
- Humans should preferably still exist.
- FIELD should preferably be greater than 0.
- No single unit type should occupy more than roughly 60% of all cells.
```

If the target fails, report the failure and export the JSON anyway.

---

## Completion report

After implementation, report:

```text
files changed
exact rule changes made
how to run
how to test 150 ticks
whether JSON export still works
any deviations from this prompt
```
