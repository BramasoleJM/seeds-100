# CODEX_V0_9_3_MACRO_VIEW_STABILITY_PROMPT.md

Copy this prompt into Codex.

This is a focused Macro View stability and cleanup patch after V0.9.2.

It is not a conceptual rebase.

It should make Beast/WILD macro regions stable and remove old debug marker clutter from normal Macro View.

Set patch version:

```text
TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

Keep version split clear:

```text
Ecology base: TRI_SPECIES_WORLD_SIM_V0.8.3_BEAST_RELOCATION_SPIRIT_INCUBATION
Readability patch: TRI_SPECIES_WORLD_SIM_V0.8.4_READABLE_MACRO_PATTERNS
Macro layer: TRI_SPECIES_WORLD_SIM_V0.9_MACRO_WORLD_LAYER
Display patch: TRI_SPECIES_WORLD_SIM_V0.9.1_MACRO_VIEW_FIELD_DECAY
Influence view patch: TRI_SPECIES_WORLD_SIM_V0.9.2_INFLUENCE_MACRO_VIEW
Stability patch: TRI_SPECIES_WORLD_SIM_V0.9.3_MACRO_VIEW_STABILITY
```

---

# Read first

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
Docs/Plan Memory/TRI_SPECIES_WORLDSIM_MEMORY_CN.md
Docs/Tasks/CODEX_V0_9_2_INFLUENCE_MACRO_VIEW_PROMPT.md
sim.js
index.html
style.css
```

Act as Executor.

If this prompt conflicts with older task prompts, follow this prompt.

If this prompt conflicts with `TRI_SPECIES_WORLD_SIM_RULES.md`, update the rules file with a V0.9.3 section before changing code.

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

Do not remove macroWorld export.

Do not replace the macro layer.

Macro View remains display-only.

Do not let Macro View masks alter simulation state.

---

# Observed problem

Recent Macro View is much closer to the goal, but two issues remain:

```text
1. Beast/WILD green regions can appear briefly, then disappear.
2. Old debugging marker symbols such as S, F, ->, *, R, W, ! still clutter the view.
```

In a recent run:

```text
B: 18 -> 16
WILD: 107 -> 58
beastRecoveryPatchCreated occurred
```

But final Macro View showed:

```text
wildRecovery = 0
```

Manual analysis of the final keyframe showed Beast/WILD influence components:

```text
component A: size about 224, wildCells about 29, beasts about 4, avg fertility about 1.71
component B: size about 130, wildCells about 17, beasts about 11, avg fertility about 1.69
```

Current failure cause:

```text
detectBeastRecoveryCandidates() still requires avgFertility >= 2.5 for the whole influence region.
Expanded influence regions include ordinary EMPTY/FIELD edge cells, so their average fertility falls below 2.5.
The region is then dropped even though Beast/WILD activity is visually and functionally real.
```

---

# Design goal

Macro View should be stable and map-like:

```text
Beast recovery regions should not flicker on/off from one threshold crossing.
Beast/WILD influence should use soft scoring, not one hard average-fertility gate.
Previously visible Beast recovery regions should persist briefly as fading/quiet regions.
Old letter/symbol macro icons should become debug-only, not normal Macro View clutter.
```

Expected visual difference:

```text
Green Beast/WILD regions remain visible while Beast activity continues nearby.
When activity fades, regions fade or change state instead of instantly disappearing.
Macro View looks cleaner without old marker letters covering the map.
```

---

# Part A - Replace Beast recovery hard gate with soft score

Current likely logic:

```js
if (cells.length < 18 || (...) || metrics.avgFertility < 2.5) return null;
```

Remove the hard `metrics.avgFertility < 2.5` rejection for Beast recovery influence components.

Instead compute a recovery score.

Suggested helper:

```js
function beastRecoveryScore(metrics, recentTotals) {
  const recentRecovery =
    (recentTotals.beastRecoveryPatchCreated || 0) +
    (recentTotals.marksCleanedByBeast || 0) +
    (recentTotals.beastAuraMarksCleaned || 0) +
    (recentTotals.beastAuraSpiritCleansed || 0);

  return (
    metrics.wildCells * 1.2 +
    metrics.beastCount * 8 +
    recentRecovery * 0.12 +
    (recentTotals.beastRelocations || 0) * 0.08 -
    Math.max(0, metrics.nearbyField - 80) * 0.04
  );
}
```

Thresholds:

```text
score >= 26:
    active_recovery

score >= 16:
    quiet_habitat or fading_recovery

score < 16:
    not a new candidate, but may be retained by memory if previously visible
```

Candidate minimums:

```text
influenceArea >= 18
and at least one:
    wildCells >= 6
    beastCount >= 2
    recentRecovery > 0
```

Do not allow the whole map to become Beast recovery.

If a component has huge area but very low Beast/WILD:

```text
reject it.
```

---

# Part B - Add Beast recovery hysteresis / fading memory

Current issue:

```text
beast_recovery_zone disappears immediately if the current candidate misses thresholds.
```

Add retention for existing Beast recovery macro objects.

In `analyzeMacroWorldNow()`, when an existing object is not seen:

```text
If object.type === "beast_recovery_zone"
and tick - object.lastSeenTick <= 100:
    keep it in regions as fading_recovery / quiet_habitat
    reduce confidence gradually
    keep center and bounds
    mark visible if confidence >= 0.45
```

Suggested:

```js
const inactiveTicks = tick - object.lastSeenTick;
const retained = {
  ...object,
  state: inactiveTicks <= 50 ? "quiet_habitat" : "fading_recovery",
  age: tick - object.firstSeenTick,
  confidence: Math.max(0.35, object.confidence * (inactiveTicks <= 50 ? 0.85 : 0.65)),
  metrics: { ...(object.metrics || {}), inactiveTicks },
};
retained.visible = retained.confidence >= 0.45;
```

This should prevent green regions from flickering.

Important:

```text
Do not keep stale Beast recovery forever.
After 100 ticks unseen, allow it to disappear or become a memory if desired.
```

---

# Part C - Use retained Beast recovery regions in Macro View masks

Current Macro View masks are built from the current world only.

For stable display:

```text
If macroWorld.regions contains visible beast_recovery_zone:
    use its cells if available.
    otherwise draw an approximate influence blob around its center/bounds.
```

Add helper:

```js
function cellsFromMacroRegion(region, fallbackRadius = 4) { ... }
```

Rules:

```text
If region.cells exists:
    mark those cells.

If region.bounds exists:
    mark cells inside bounds, possibly softened by distance to center.

If only center exists:
    mark radius 4 around center.
```

Use this only for Macro View display.

Do not alter simulation state.

Expected:

```text
Fading Beast recovery regions remain visible briefly instead of blinking off.
```

---

# Part D - Clean up old macro marker symbols

Current issue:

```text
The old macroOverlay displays letter/symbol icons such as S, F, ->, *, R, W, !.
These were useful for debugging but now clutter Macro View.
```

Change UI wording:

```text
Show Macro Icons
```

to:

```text
Show Debug Icons
```

or:

```text
Show Macro Debug Icons
```

Default:

```text
unchecked
```

Behavior:

```text
Cell View:
    Debug icons show only when checkbox is checked.

Macro View:
    Debug icons also show only when checkbox is checked.
    They should not appear by default.
```

Implementation:

```html
<input id="macroOverlayToggle" type="checkbox">
<span>Show Macro Debug Icons</span>
```

Ensure `renderMacroOverlay()` already respects unchecked state.

If needed, make debug icons visually subdued:

```css
.macro-icon {
  opacity: 0.75;
  transform: translate(-50%, -50%) scale(0.9);
}
```

Do not remove the debug overlay entirely.

---

# Part E - Macro View should rely on regions, not icons

In Macro View, the primary display should be:

```text
colored influence regions
frontier outlines
route markings
scar/settlement/wild masks
```

not icon letters.

Check CSS:

```text
macro-cell-wild should be visible enough.
base cells should be muted enough.
frontier/route overlays should not dominate.
```

Suggested adjustments:

```css
.grid.macro-view .cell {
  opacity: 0.22;
  filter: saturate(0.35) brightness(0.62);
}

.grid.macro-view .macro-cell-wild {
  background: #2fa366;
  box-shadow: inset 0 0 0 1px rgba(140, 255, 170, 0.55);
}
```

Tune if needed, but do not spend time on final art.

---

# Part F - Update macro display summary

`macroWorld.display.masks.wildRecovery` should count retained visible Beast recovery regions as well as current mask regions.

If `createMacroDisplaySummaryFromObjects()` already counts regions by type, ensure retained `beast_recovery_zone` appears in `macroWorld.regions`.

Recording frames should continue to include macro summaries.

Do not break export schema.

---

# Part G - Documentation update

Update:

```text
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_WORLD_SIM_READABLE_CN.md
README.md
```

Add V0.9.3 notes:

```text
V0.9.3 stabilizes Macro View.
Beast recovery zones use soft scoring instead of a hard average-fertility cutoff.
Beast recovery regions can persist briefly as quiet_habitat or fading_recovery.
Macro View uses retained macro regions to prevent flicker.
Old letter/symbol macro icons are now debug-only and disabled by default.
Macro View should be read primarily through colored regions, not marker letters.
```

---

# Test checklist

Run manually in browser:

```text
Balanced Asymmetric Ecology Test 0-300
Balanced Asymmetric Ecology Test 0-700
Beast Dispersion Test 0-300
Human Migration Test 0-300
Spirit Outbreak Test 0-250
No Spirit Control 0-250
```

Check:

```text
1. No console errors.
2. Cell View still works.
3. Macro View still works.
4. Macro Debug Icons are off by default.
5. Checking Macro Debug Icons shows old markers; unchecking hides them.
6. Beast/WILD green regions do not flicker off immediately when current influence dips slightly.
7. Beast recovery regions can enter quiet_habitat/fading_recovery before disappearing.
8. macroWorld.display.masks.wildRecovery is > 0 when Beast recovery regions are retained/visible.
9. Macro View does not paint the whole map green.
10. Recording JSON still exports macroWorld/macroFrames.
```

Useful numeric check:

```text
In a Balanced run where B >= 10 and WILD >= 25:
    If Beast recovery was visible recently, it should not disappear for at least one macro interval solely because avg influence fertility dipped below 2.5.
```

Failure signs:

```text
Beast recovery remains visible forever after Beasts leave.
Macro View becomes mostly green.
Debug icons still appear by default.
macroWorld export breaks.
```

---

# Completion report

When finished, report:

```text
files changed
patch version
Beast recovery soft scoring changes
Beast recovery hysteresis / fading behavior
Macro View retained-region rendering
debug icon UI cleanup
CSS/color changes
documentation updates
tests run
known simplifications or deviations
expected visual difference
```

Known acceptable simplifications:

```text
Fading recovery regions may use approximate radius/bounds display.
Soft score constants may be simple and documented.
Debug icons may remain text markers.
No final art is required.
No new terrain is required.
```
