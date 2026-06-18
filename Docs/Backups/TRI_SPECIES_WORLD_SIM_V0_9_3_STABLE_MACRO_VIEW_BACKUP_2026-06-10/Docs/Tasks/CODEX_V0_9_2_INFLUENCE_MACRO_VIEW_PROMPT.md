# CODEX_V0_9_2_INFLUENCE_MACRO_VIEW_PROMPT.md

Copy this prompt into Codex.

This is a focused Macro View improvement after V0.9.1.

It is not a conceptual rebase.

It should make Macro View genuinely macro by displaying influence regions instead of raw terrain fragments.

Set patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
```

Keep version split clear:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Macro View patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
```

---

# Read first

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_MEMORY_CN.md
Docs/Tasks/CODEX_V0_9_1_MACRO_VIEW_FIELD_DECAY_PROMPT.md
sim.js
index.html
style.css
```

Act as Executor.

If this prompt conflicts with older task prompts, follow this prompt.

If this prompt conflicts with `TRI_SPECIES_WORLD_SIM_RULES.md`, update the rules file with a V0.9.2 section before changing code.

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

Do not remove Cell View.

Do not remove existing macroWorld export fields.

Do not replace the macro layer.

Macro View remains display-only.

Do not let Macro View masks alter simulation state.

---

# Observed problem

A recent V0.9.1 recording reached tick 608 with:

```text
H: 24 -> 91
B: 18 -> 32
S: 0 -> 0
FIELD: 92 -> 248
WILD: 110 -> 55
MARK: 38 -> 13
```

Beast activity was healthy:

```text
beastRandomMoves: 9032
beastRelocations: 320
beastDispersals: 343
wildCreatedByBeast: 150
beastRecoveryPatchCreated: 71
marksCleanedByBeast: 123
```

But Macro View still did not show Beast/WILD clearly.

Spatial analysis of final keyframe:

```text
WILD clusters: 46
largest pure WILD cluster: 4

WILD + Beast influence clusters:
largest influence regions: about 210, 166, 27
```

Current code issue:

```text
detectBeastRecoveryCandidates() starts from pure WILD flood fill with cells.length >= 8.
buildMacroDisplayMasks() also requires pure WILD components with cells.length >= 8.
```

Therefore:

```text
macroWorld.display.masks.wildRecovery = 0
```

This is wrong for the current Beast design. Beast is a mobile recovery force, so wild recovery should be read as:

```text
WILD + Beast presence + Beast influence + recent recovery / cleansing
```

not only pure WILD terrain.

---

# Design goal

Upgrade Macro View from:

```text
raw terrain component display
```

to:

```text
influence-region display
```

Macro View should show large readable regions:

```text
Human settlement influence
Beast / wild recovery influence
Spirit scar influence
Migration route
Human-Beast frontier
```

Expected visual difference:

```text
Macro View should look like broad map regions, not scattered cells.
Beast/WILD should become visible as one or more green influence regions.
Small WILD/FIELD/MARK fragments should be muted unless they belong to an influence region.
```

---

# Part A - Add display-only influence helpers

Add helper functions near existing macro display helpers.

Suggested helpers:

```js
function buildBooleanMask(predicate) { ... }
function dilateMask(mask, radius = 1) { ... }
function erodeOrRemoveSmallComponents(mask, minSize) { ... } // optional
function maskToCells(mask) { ... }
function connectedMaskComponents(mask) { ... }
function mergeAndFilterComponents(components, minSize) { ... }
```

Keep them simple and readable.

Alternative:

```text
If boolean masks feel too much, make floodFillCells accept a predicate that uses influence checks.
```

But the implementation should support dilation/expansion of display regions.

Important:

```text
These masks are display-only.
They must not write to world cells.
```

---

# Part B - Human settlement influence mask

Current settlement display is mostly acceptable, but make it more macro and less raw.

Build a Human influence mask:

```text
cell is Human settlement influence if:
    terrain is FIELD
    or unit is Human
    or within radius 1 of Human on FIELD
```

Then:

```text
Keep components with:
    size >= 12
    and nearby Human count >= 3
```

Display:

```text
macro-cell-settlement
```

Do not show tiny FIELD fragments as settlement.

For abandoned:

```text
FIELD component/influence with:
    size >= 8
    nearby Human count <= 1
```

Display:

```text
macro-cell-abandoned
```

Expected result:

```text
Settlements look like larger continuous blocks.
Small leftover FIELD noise does not dominate Macro View.
```

---

# Part C - Beast / wild recovery influence mask

This is the most important part.

Replace pure-WILD-only Macro View detection with Beast influence.

Build a wild recovery influence mask where a cell is included if any of these are true:

```text
terrain is WILD
unit is Beast
within radius 2 of a Beast
EMPTY with fertility >= 3 and within radius 2 of Beast
cell is near WILD and near Beast
```

Then dilate by radius 1 for display continuity.

Then filter:

```text
keep components with size >= 18
and at least one:
    Beast count in/near component >= 2
    WILD cells in component >= 4
    recent beastRecoveryPatchCreated / marksCleanedByBeast / beastRelocations is significant
```

Suggested component metrics:

```text
componentSize
beastCount
wildCells
avgFertility
nearbyField
recentRecovery
```

Display:

```text
macro-cell-wild
```

Expected result:

```text
Beast/WILD appears as 1-3 broad green recovery regions instead of vanishing because pure WILD is fragmented.
```

Do not lower this to tiny components.

Do not show the whole map as wild just because Beasts are scattered.

If too much map becomes wild:

```text
require Beast count >= 2 per component
or require WILD cells >= 6 per component
```

---

# Part D - Update beast recovery macro candidate detection

Current `detectBeastRecoveryCandidates()` uses:

```text
floodFillCells(source, cell.terrain === WILD)
filter cells.length >= 8
```

This misses Beast recovery when WILD is fragmented.

Change it to use the same Beast / wild influence components as Macro View.

Candidate:

```text
influence component size >= 18
and Beast count nearby >= 2 or WILD cells >= 6
and avg fertility >= 2.5
```

State:

```text
active_recovery:
    recent beastRecoveryPatchCreated + marksCleanedByBeast + beastAuraMarksCleaned + beastRelocations > 0

wild_frontier:
    component near FIELD/Human

beast_habitat:
    persistent Beast + WILD/fertility, low recent conflict
```

Metrics should include:

```js
{
  influenceArea,
  wildCells,
  beastCount,
  avgFertility,
  nearbyMark,
  nearbyField,
  recentRecovery,
  recentRelocations
}
```

Keep `type: "beast_recovery_zone"`.

Expected result:

```text
macroWorld.regions includes beast_recovery_zone when Beasts are visibly active even if pure WILD clusters are small.
```

---

# Part E - Spirit scar influence mask

Current MARK clusters may be small after cleanup.

Macro View should show scars as readable patches when MARK is clustered, but not show single MARK noise.

Build scar influence:

```text
terrain is MARK
or within radius 1 of clustered MARK
```

Keep components:

```text
MARK cells >= 5
or component size >= 10 and MARK cells >= 3
```

Display:

```text
macro-cell-scar
```

Do not display single MARK cells.

---

# Part F - Region precedence in Macro View

When multiple macro classes overlap, use visual precedence.

Recommended precedence:

```text
route overlay
frontier outline
spirit scar
abandoned settlement
active settlement
wild recovery
muted base terrain
```

Implementation can remain class-based, but CSS should make overlaps readable.

If class order causes settlement to hide wild/frontier too much, adjust CSS selectors.

Example:

```css
.grid.macro-view .macro-cell-wild { ... }
.grid.macro-view .macro-cell-settlement { ... }
.grid.macro-view .macro-cell-scar { ... }
.grid.macro-view .macro-cell-frontier { outline: ... }
.grid.macro-view .macro-cell-route { box-shadow: ... }
```

---

# Part G - Macro View color hierarchy

Current Macro View may still look like cell recoloring.

Adjust CSS so Macro View reads as a map:

```text
Base terrain cells:
    very muted, low saturation, low brightness.

Macro regions:
    high opacity, clearer color.

Wild recovery:
    stronger green than current if needed.

Frontier:
    outline, not full fill.

Route:
    visible dotted/line-like marking.
```

Do not use final art.

Do not add images.

Keep text legible.

---

# Part H - Optional small Beast recovery patch improvement

Only if needed after display changes.

Current `tryCreateSmallWildRecoveryPatch()` chooses adjacent EMPTY/MARK candidates and randomly converts one.

Improve it to prefer connection:

```text
Sort candidates so cells adjacent to existing WILD are tried first.
Then MARK candidates.
Then EMPTY candidates.
```

This should make WILD patches connect instead of creating isolated one-cell WILD.

Do not increase the maximum number of extra cells per cleansing action.

Do not increase chances unless tests show Beast/WILD still invisible.

Expected result:

```text
WILD remains controlled but forms slightly more connected recovery patches.
```

---

# Part I - Macro display summary export

Keep existing `macroWorld.display`.

Update mask counts to reflect influence regions:

```js
macroWorld.display.masks.wildRecovery
```

should count Beast/wild influence regions, not only pure WILD terrain components.

Recording frames should continue to include macro summary.

Do not break existing export schema.

---

# Part J - Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add V0.9.2 notes:

```text
V0.9.2 improves Macro View.
Macro View now displays influence regions instead of raw terrain fragments.
Beast recovery zones are detected from Beast presence, WILD, fertility, and recent recovery events.
Wild recovery can appear as a broad influence region even when WILD terrain is fragmented.
Small terrain fragments are filtered out in Macro View.
Cell View remains unchanged for low-level debugging.
```

---

# Test checklist

Run manually in browser:

```text
Balanced Asymmetric Ecology Test 0-300
Balanced Asymmetric Ecology Test 0-700
Human Migration Test 0-300
Beast Dispersion Test 0-300
Spirit Outbreak Test 0-250
No Spirit Control 0-250
```

Check:

```text
1. No console errors.
2. Cell View remains usable.
3. Macro View shows broad continuous regions, not scattered raw cells.
4. Beast/WILD recovery is visible in Macro View in Balanced and Beast Dispersion tests.
5. macroWorld.display.masks.wildRecovery is > 0 when Beasts are active and recovery events exist.
6. Macro View does not turn the entire map green.
7. Settlement regions are less noisy than raw FIELD.
8. Spirit scar regions show clusters, not single MARK specks.
9. Route and frontier remain readable above region fills.
10. Snapshot and recording JSON still include macroWorld and macroFrames.
```

Useful numeric checks:

```text
In a Balanced run with B >= 15 and beastRecoveryPatchCreated > 0:
    macroWorld.display.masks.wildRecovery should usually be >= 1.

In Beast Dispersion Test:
    wild recovery regions should be obvious in Macro View.

Pure WILD cluster size may remain small; that is acceptable if Beast influence regions are readable.
```

Failure signs:

```text
wildRecovery remains 0 despite active Beasts and recovery events.
Macro View becomes nearly identical to Cell View.
Macro View paints most of the map as wild recovery.
Icons or route/frontier overlays become unreadable.
JSON export breaks.
```

---

# Completion report

When finished, report:

```text
files changed
patch version
Macro View influence helper implementation
Human influence mask changes
Beast/wild influence mask changes
beast_recovery_zone detection changes
Spirit scar mask changes
CSS/color hierarchy changes
optional Beast recovery patch connection changes, if implemented
tests run
known simplifications or deviations
expected visual difference
```

Known acceptable simplifications:

```text
Influence regions may be approximate.
Dilation may use simple radius-neighborhood expansion.
No final art is required.
No new terrain is required.
No macro-to-ecology feedback is required.
```
