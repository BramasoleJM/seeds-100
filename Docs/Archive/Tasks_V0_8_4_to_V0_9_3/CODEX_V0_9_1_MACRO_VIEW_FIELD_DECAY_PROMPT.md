# CODEX_V0_9_1_MACRO_VIEW_FIELD_DECAY_PROMPT.md

Copy this prompt into Codex.

This is a focused follow-up after V0.8.4 readability shaping and V0.9 Macro World Layer.

It is not a conceptual rebase.

It should improve readability in three concrete ways:

```text
1. Abandoned FIELD should fade or become ruin/scar residue instead of staying visually identical to active farmland.
2. Beast recovery should leave a more visible macro pattern without flooding the map.
3. Add a Macro View display mode that filters low-level grid noise and shows continuous macro shapes.
```

Set patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
```

Keep version split clear:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
```

---

# Read first

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_MEMORY_CN.md
Docs/Tasks/CODEX_V0_8_4_READABLE_MACRO_PATTERNS_PROMPT.md
Docs/Tasks/CODEX_V0_9_MACRO_WORLD_LAYER_PROMPT.md
sim.js
index.html
style.css
```

Act as Executor.

If this prompt conflicts with older task prompts, follow this prompt.

If this prompt conflicts with `TRI_SPECIES_WORLD_SIM_RULES.md`, update the rules file with a V0.9.1 section before changing code.

---

# Hard constraints

Do not add new visible terrain.

Do not add DEPLETED terrain.

Do not add corpse overlay.

Do not restore 0-100 fertility.

Do not add economy/resources/buildings/NPCs/quests/tarot/story events.

Do not implement Zelda-style multi-screen maps.

Do not add screen-to-screen propagation.

Do not add external libraries.

Do not remove the existing Cell View.

Do not remove existing JSON export fields.

Do not replace the macro layer.

Macro View is a display mode, not a new simulation layer.

---

# Observed problem

A recent Balanced recording reached tick 674 with:

```text
H: 24 -> 70
B: 18 -> 24
S: 0 -> 0
FIELD: 61 -> 267
WILD: 141 -> 56
MARK: 32 -> 67
```

This is healthier than previous extinction runs.

But visual readability problems remain:

```text
FIELD clusters: 63, with many abandoned FIELD cells.
WILD clusters: 25, largest only around 14.
MARK clusters: 9, largest around 35.
About half the FIELD has no adjacent Human.
About one third of FIELD has no Human within radius 2.
Beast activity is strong in events, but visually WILD recovery is still subtle.
Cell View is too noisy for reading macro world structure.
```

Designer observations:

```text
1. Field no longer inhabited by Humans should probably become EMPTY instead of keeping FIELD color/status forever.
2. Beast evolution may not yet form a visible macro pattern.
3. A new display mode may be needed for macro patterns, filtering noise and showing continuous macro shapes.
```

---

# Design goal

Keep the existing simulation, but make the world readable in two modes:

```text
Cell View:
    Existing detailed grid view for debugging low-level rules.

Macro View:
    A map-reading view that de-emphasizes individual cell noise and emphasizes continuous macro regions, routes, scars, and frontiers.
```

Expected result:

```text
Old empty farmland fades from active FIELD.
Haunted/marked ruins can remain readable.
Beast recovery creates clearer WILD patches.
Macro View shows settlements, ruins, wild recovery, scars, routes, and frontiers as continuous regions/icons.
```

---

# Part A - Abandoned FIELD should decay by Human absence

Current issue:

```text
FIELD can remain visually identical to active farmland even when no Humans live nearby.
```

Add FIELD absence decay using existing terrain/fertility/terrainAge.

Definitions:

```text
active FIELD:
    Human in current cell or radius 1.

recently abandoned FIELD:
    no Human in radius 1, but Human in radius 2 or terrainAge is not old.

old abandoned FIELD:
    no Human in radius 2, terrainAge > 20, fertility <= 1.

haunted abandoned FIELD:
    no Human in radius 2, nearby MARK >= 2.
```

Implementation in `applyTerrainDecay()`:

```text
If FIELD has Human in radius 1:
    keep existing behavior.

If FIELD has no Human in radius 2:
    if nearby MARK >= 2:
        preserve briefly as ruin candidate, but with some chance convert to MARK.
    else if fertility <= 1 and terrainAge > 20:
        with moderate chance FIELD -> EMPTY.
    else if fertility == 0:
        FIELD -> EMPTY.
```

Recommended constants:

```js
const ABANDONED_FIELD_MIN_AGE = 20;
const ABANDONED_FIELD_DECAY_CHANCE = 0.08;
const HAUNTED_FIELD_TO_MARK_CHANCE = 0.04;
```

Important:

```text
Do not instantly delete all old FIELD.
Do not erase haunted ruins too quickly.
Do not require new terrain type.
```

Expected visual difference:

```text
FIELD color should increasingly mean active or recently used Human land.
Old unused FIELD should fade into EMPTY.
FIELD near MARK can become part of an abandoned/haunted ruin signature.
```

---

# Part B - Beast recovery should leave visible patches

Current issue:

```text
Beast activity is strong in events, but WILD recovery can be too visually subtle.
```

Do not increase Beast reproduction broadly.

Instead, strengthen visible recovery only when Beast cleans MARK or suppresses Spirit.

When Beast cleans MARK or Spirit via:

```text
disperseBeastAt()
applyBeastAuraCleansing()
Beast standing on MARK in applyTerrainRewrite()
```

Add a small recovery patch effect:

```text
After successful MARK/S cleansing:
    choose up to 1 adjacent EMPTY or MARK cell.
    If local WILD count radius 2 is not already high:
        with small chance convert it to WILD.
        raise fertility by 1.
```

Recommended helper:

```js
function tryCreateSmallWildRecoveryPatch(target, source, x, y) { ... }
```

Suggested rules:

```text
Candidate cells:
    adjacent EMPTY or MARK
    not BLOCK/BORDER
    no unit

Brake:
    if WILD count in radius 2 around cleansing site >= 7:
        do not add patch

Chance:
    MARK candidate -> WILD: 0.35
    EMPTY candidate -> WILD: 0.18

Limit:
    at most 1 extra cell per cleansing action
```

Track event:

```js
beastRecoveryPatchCreated
```

Add to clone/export events.

Expected visual difference:

```text
Beast cleanup should leave small WILD recovery patches.
WILD should become more legible as recovery zones without flooding the map.
```

Failure signs:

```text
WILD grows explosively.
Beast recovery paints the whole map green.
```

---

# Part C - Add View Mode control

Add a display control:

```text
View Mode: Cell View / Macro View
```

Recommended UI:

```html
<select id="viewMode">
  <option value="cell">Cell View</option>
  <option value="macro">Macro View</option>
</select>
```

Place near the existing Macro Icons toggle or simulation controls.

Default:

```text
Cell View
```

Existing rendering should remain unchanged in Cell View.

Macro View should use the same simulation state and same macroWorld.

---

# Part D - Macro View rendering

Macro View should not show every low-level terrain color equally.

It should:

```text
1. Fade ordinary low-level cells.
2. Highlight continuous macro regions.
3. Show macro icons/labels at region centers.
4. Hide or downplay tiny isolated terrain noise.
```

Simple acceptable implementation:

```text
Keep the same grid cells.
Add a `macro-view` class to the app/grid.
In Macro View, apply muted base styles to normal terrain cells.
Then add macro classes to cells that belong to visible macro regions/events/routes.
```

If macro region cells are not complete enough, derive display masks from current grid:

```text
settlement mask:
    FIELD components with area >= 8 and nearby H >= 3

abandoned mask:
    FIELD components with area >= 5 and nearby H <= 1

wild recovery mask:
    WILD components with area >= 8
    or WILD components near Beast cleansing/recovery macro object

spirit scar mask:
    MARK components with area >= 5

frontier mask:
    FIELD cells within radius 2 of WILD or Beast, only if macro frontier exists
```

Do not display isolated components below threshold as macro regions.

Macro View cell styling:

```text
settlement: warm/gold region tint
abandoned: gray/brown region tint
wild recovery: green region tint
spirit scar: purple region tint
frontier: thin contrasting outline or mixed tint
route: dotted/line-like markers along route cells if path exists
```

Keep text readable.

Do not use final art.

Do not make cards or a landing page.

---

# Part E - Macro region denoising

Add helper logic for Macro View display masks:

```text
connected components by terrain type
area threshold
nearby unit threshold
merge nearby same-type components if centers are close
hide tiny isolated fragments
```

Minimum thresholds:

```text
FIELD settlement component: area >= 8
FIELD abandoned component: area >= 5
WILD recovery component: area >= 8
MARK scar component: area >= 5
```

Optional merging:

```text
If same-type components are within 2 cells and both pass half threshold, merge for display.
```

This is display-only.

Do not let Macro View masks alter simulation state.

---

# Part F - Macro icons in Macro View

Existing macro icon overlay may remain optional in Cell View.

In Macro View:

```text
show visible macro icons by default
limit icons to high-confidence macro objects
avoid overlapping icons
prefer region icons over raw cell labels
```

If there is already a Macro Icons toggle:

```text
Cell View respects the toggle.
Macro View shows icons unless toggle is explicitly off.
```

Icon display priority:

```text
1. active Spirit outbreak / warning
2. settlement
3. abandoned settlement
4. beast recovery zone
5. spirit scar
6. migration route
7. human-beast frontier
```

---

# Part G - JSON export additions

Do not break existing schema.

Add display summary if useful:

```js
macroWorld.display = {
  viewModes: ["cell", "macro"],
  masks: {
    settlements: count,
    abandoned: count,
    wildRecovery: count,
    spiritScars: count,
    frontiers: count,
    routes: count
  }
}
```

This is optional.

Required:

```text
Snapshot and recording JSON must still include macroWorld.
Recording keyframes must still include macroWorld.
```

---

# Part H - Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add V0.9.1 notes:

```text
V0.9.1 adds Macro View.
Cell View remains the detailed simulation grid.
Macro View fades low-level noise and highlights continuous macro regions.
Abandoned FIELD without nearby Humans decays toward EMPTY.
FIELD near MARK can remain briefly as ruin/scar residue or become MARK.
Beast cleansing can create small WILD recovery patches.
No new terrain or final art is added.
```

---

# Test checklist

Run manually in browser:

```text
Balanced Asymmetric Ecology Test 0-300
Balanced Asymmetric Ecology Test 0-700
Human Migration Test 0-300
Beast Dispersion Test 0-250
Spirit Outbreak Test 0-250
No Spirit Control 0-250
```

Check:

```text
1. No console errors.
2. Cell View looks unchanged except for legitimate simulation rule changes.
3. Macro View can be selected and deselected.
4. Macro View visibly reduces noise compared with Cell View.
5. Macro View highlights settlement / abandoned / wild recovery / scar regions as continuous shapes.
6. Old FIELD with no Humans fades over time.
7. Haunted FIELD near MARK does not disappear instantly.
8. Beast cleansing can create visible small WILD recovery patches.
9. WILD does not flood the map.
10. macroWorld export still works.
11. Macro icons remain readable and not too dense.
```

Useful numeric checks:

```text
At long ticks, FIELD with no Human within radius 2 should be lower than before.
beastRecoveryPatchCreated should be > 0 in runs with MARK/Spirit cleansing.
WILD total should not grow explosively.
Macro View should show fewer visual regions than raw terrain components.
```

---

# Completion report

When finished, report:

```text
files changed
patch version
FIELD absence decay implementation
haunted FIELD / ruin behavior
Beast recovery patch implementation
new event counters
View Mode UI implementation
Macro View rendering / denoising implementation
JSON export changes
tests run
known simplifications or deviations
expected visual difference
```

Known acceptable simplifications:

```text
Macro View may use simple CSS and text icons.
Macro View masks may be derived from current grid rather than stored in macroWorld.
Routes may be approximate.
No final art is required.
No macro-to-ecology feedback is required beyond the FIELD decay and Beast recovery patch rules listed here.
```
