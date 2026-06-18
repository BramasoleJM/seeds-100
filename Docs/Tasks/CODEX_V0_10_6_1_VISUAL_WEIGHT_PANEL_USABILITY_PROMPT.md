# CODEX V0.10.6.1 Visual Weight And Panel Usability Prompt

You are Executor for the Tri-Species WorldSim project.

Implement V0.10.6.1 as a small corrective UI / visual pass:

```text
1. restore ecological evolution readability in Macro View
2. keep regional substrate visible but much less dominant
3. make the control panel easier to use without pushing the simulation view away
```

This is a correction after V0.10.6 Macro Visual Communication.

Before editing code, read:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
Docs/Tasks/CODEX_V0_10_6_MACRO_VISUAL_COMMUNICATION_PROMPT.md
```

The project is rule-first. Update `TRI_SPECIES_WORLD_SIM_RULES.md` before changing display or UI behavior.

---

## User Feedback

The user reports three issues after V0.10.6:

```text
1. Regional base colors are too strong.
   Human / Beast / Spirit land colors are too weak.
   Macro View now makes evolution harder to see.

2. Regional areas are very large and regular.
   This suggests future discussion about map size and Zelda-1-like maps.
   Do not solve that in this patch.

3. The right panel is too long.
   The user has to scroll to the middle before seeing the left simulation subject.
```

The user chose option C:

```text
Fix visual weight and panel usability together, but do not touch map size.
```

---

## Hard Scope

Do not change:

```text
grid size
4 x 3 screen-cell substrate layout
regional substrate generation
movement rules
conflict rules
reproduction rules
terrain decay rules
fertility dynamics
macro timeline JSON shape
recording JSON shape
normal snapshot JSON shape except version/docs metadata if already present
```

Do not add:

```text
Zelda-style multi-screen map
screen-to-screen propagation
map editor
brush painting
save/load
new terrain types
new species
NPCs
quests
story events
resource economy
network calls
external libraries
canvas/WebGL rewrite
final art
```

Treat this as display/UI only.

---

## Part 1: Correct Macro View Visual Weight

Current problem:

```text
The region substrate is visually louder than ecological evolution.
In Macro View, basin / refuge / hollow read as large colored blocks.
FIELD / WILD / MARK and macro influence patches are not strong enough.
```

Required behavior:

```text
Macro View should primarily show evolving Human / Beast / Spirit land influence.
Regional substrate should be a quiet undertone, not the dominant layer.
Substrate + Macro View may show regional substrate more clearly than Macro View, but ecological influence must still remain visible there.
```

Implementation guidance:

```text
Lower Macro View region-basin / region-refuge / region-hollow saturation and brightness.
Reduce region texture contrast in Macro View.
Increase ecological overlay strength for:
  macro-cell-settlement
  macro-cell-wild
  macro-cell-scar
  macro-cell-abandoned if needed
Keep fringe softer than core/edge.
Make FIELD / WILD / MARK visual identity readable in Macro View even when the cell also has a region class.
Do not make all colors neon or one-note.
```

Recommended direction:

```text
Macro View:
  substrate = very low contrast map-paper tint
  ecological material = main visible color
  frontier / route / BLOCK = crisp reading aids

Substrate + Macro View:
  substrate = clearer than Macro View
  ecological material = still strong enough to see evolution
  screen-cell boundaries = visible but not screaming
```

Expected result:

```text
When watching Macro View, the user's first impression should be:
"I can see Human / Beast / Spirit areas changing."

Only secondarily should they notice:
"Those changes are happening over basin / refuge / hollow geography."
```

---

## Part 2: Do Not Solve Map Size Yet

The user raised a valid future topic:

```text
Current regions are too large and regular.
To approach Zelda 1 style, the map may need a larger total space or a different region generator.
```

For this patch:

```text
Do not change WIDTH or HEIGHT.
Do not change SUBSTRATE_LAYOUT_COLUMNS or SUBSTRATE_LAYOUT_ROWS.
Do not change screen-cell assignment or region area generation.
Do not change BLOCK generation.
```

Add a short note in `README.md` or a current planning doc:

```text
Future topic: map scale and less regular region generation should be discussed separately because it may affect performance, macro analysis, recording size, and UI layout.
```

Keep this note concise. Do not implement the future topic.

---

## Part 3: Panel Usability

Current problem:

```text
The panel is too long and makes observation awkward.
The simulation subject should be visible immediately and remain easy to watch.
```

Required behavior:

```text
On desktop, the simulation grid should stay visible in the first viewport.
The control panel may scroll internally instead of making the whole page awkward.
Common controls should be near the top.
Less frequent controls should be grouped and collapsible.
The panel should be shorter and easier to scan.
```

Recommended layout:

Keep always visible near the top:

```text
Play
Step
Reset
Randomize
View Mode
Runtime Intervention
Tick speed
Movement toggle
Status / Stats summary
```

Put lower-frequency sections into collapsible groups using native HTML `<details>` / `<summary>`:

```text
Initial Settings
Recording
Macro Timeline
Legend
Advanced / Debug
```

Default open / closed recommendation:

```text
Open by default:
  Core controls
  Status / Stats

Closed by default:
  Initial Settings
  Recording
  Macro Timeline
  Legend
  Advanced / Debug
```

Implementation notes:

```text
Use plain HTML/CSS/JavaScript.
Prefer native details/summary for collapsible groups.
Do not add external dependencies.
Do not hide controls completely; make them easy to expand.
Ensure existing element ids stay intact so sim.js continues to find controls.
If moving DOM nodes, keep all ids unchanged.
```

Desktop CSS guidance:

```text
.app should keep the grid and panel side by side.
.sim-shell can be position: sticky or otherwise kept at the top of the viewport.
.panel can use max-height: calc(100vh - padding) and overflow-y: auto.
Reduce panel gaps and padding slightly if needed.
```

Mobile CSS guidance:

```text
Keep single-column layout.
Simulation grid appears before panel.
Panel groups remain collapsible.
Do not make sticky layout fight mobile scrolling.
```

Expected result:

```text
Opening the page should show the simulation grid without needing to scroll.
The user should not need to scroll through every initialization and export control just to observe the world.
```

---

## Part 4: Rules And Docs

Update `TRI_SPECIES_WORLD_SIM_RULES.md` with a new section:

```text
V0.10.6.1 Visual Weight And Panel Usability
```

Document:

```text
This patch is display/UI only.
Macro View reduces substrate dominance and restores ecological influence as the primary visual signal.
Substrate + Macro View keeps stronger geography, but ecological evolution remains readable.
The panel uses grouped/collapsible sections so the simulation remains visible and easier to observe.
No simulation rules, map size, substrate generation, timeline shape, or recording shape are changed.
```

Update the rules version string to:

```text
TRI_SPECIES_WORLD_SIM_V0.10.6.1_VISUAL_WEIGHT_PANEL_USABILITY
```

Update `README.md` with:

```text
short V0.10.6.1 note
how to visually test Macro View vs Substrate + Macro View
how the panel is organized
future note about map scale / less regular regions
```

---

## Files Likely To Change

```text
TRI_SPECIES_WORLD_SIM_RULES.md
README.md
index.html
style.css
tests/v0_10_6_1_visual_weight_panel_usability.test.js
```

Possibly:

```text
sim.js
```

Only touch `sim.js` if layout changes require small event or status adjustments. Keep all existing ids stable.

---

## Tests

Add:

```text
tests/v0_10_6_1_visual_weight_panel_usability.test.js
```

Test at least:

```text
index.html still contains all required existing control ids.
Initial Settings / Recording / Macro Timeline / Legend are grouped in details/summary or equivalent collapsible sections.
Core controls and View Mode remain outside deeply hidden low-frequency groups.
style.css defines panel internal scrolling or sticky simulation behavior for desktop.
Macro View region colors are lower dominance than V0.10.6 values.
Macro ecological overlay opacity values remain stronger than Macro View region tint values.
Substrate + Macro View keeps region classes and macro-cell classes.
Macro Timeline export shape remains unchanged.
Recording export shape remains unchanged.
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_10_regional_substrate.test.js
node tests/v0_10_1_screen_cell_substrate.test.js
node tests/v0_10_2_terrain_readability_occlusion.test.js
node tests/v0_10_3_performance_macro_throttling.test.js
node tests/v0_10_4_regression_repair.test.js
node tests/v0_10_5_macro_timeline_rule_audit.test.js
node tests/v0_10_6_macro_visual_communication.test.js
node tests/v0_10_6_1_visual_weight_panel_usability.test.js
node tests/v0_9_3_macro_view_stability.test.js
```

If a listed file does not exist locally, run the nearest existing tests and report the difference.

---

## Manual Visual QA

After implementation:

```text
1. Open index.html.
2. Confirm the simulation grid is visible immediately on desktop without scrolling down.
3. Confirm common controls are near the top and usable.
4. Confirm Initial Settings / Recording / Macro Timeline / Legend are easy to expand.
5. Select Macro View.
6. Run 200-400 ticks.
7. Confirm ecological evolution is the main visual signal.
8. Confirm basin / refuge / hollow are only subtle undertones in Macro View.
9. Select Substrate + Macro View.
10. Confirm geography is clearer than Macro View but still does not hide FIELD / WILD / MARK evolution.
11. Export Snapshot JSON, Recording JSON, and Macro Timeline JSON once to confirm exports still work.
```

Expected visual difference:

```text
Macro View should feel alive again.
Regional color should stop overpowering the changing Human / Beast / Spirit land.
The page should feel like an observation tool rather than a long form.
```

---

## Report After Changes

After implementation, report:

```text
files changed
how to run
which V0.10.6.1 rule sections are implemented
tests run
whether timeline export shape was preserved
whether recording export shape was preserved
known simplifications or deviations
expected Macro View visual difference
expected panel usability difference
what remains for future map size / region-generation discussion
```

