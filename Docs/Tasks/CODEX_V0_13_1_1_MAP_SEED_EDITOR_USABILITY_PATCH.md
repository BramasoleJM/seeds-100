# CODEX V0.13.1.1 Map Seed Editor Usability Patch

## Summary

Implement a narrow usability patch for the V0.13.1 Map Seed Editor.

The current editor is too hard to use:

```text
clicking the map only edits activeMapSeed / JSON
the user must press Apply Seed before seeing results
Explore/local viewport clicks can map to wrong world coordinates
mountains/rivers require blind one-cell clicking
there is no quick way to start from a random editable preset
```

This patch should make map seed editing feel direct and testable.

Rules version:

```text
TRI_SPECIES_WORLD_SIM_V0.13.1.1_MAP_SEED_EDITOR_USABILITY_PATCH
```

Do not change Place Memory, Wake Report, POI text, sleep rules, H/B/S simulation rules, or ecology balance in this task.

## Hard Scope

Do implement:

```text
map brush edits immediately affect current world
seed JSON stays synced after edits
correct click coordinates in all view modes, including Explore local viewport
drag painting for Mountain / River / Erase / H / B / S
Generate Random Preset button
Clear Seed button
better status text
tests for editor coordinate mapping and live application
```

Do not implement:

```text
undo / redo
multi-layer selection UI
full map editor
save/load system beyond existing seed JSON export/import
new terrain
new species
dynamic POIs
Insight
LLM text
season system
new player powers
```

## Problem 1: Brush Edits Are Not Live

Current behavior:

```js
applyMapSeedBrush()
  activeMapSeed = normalizeMapSeed(seed)
  refreshMapSeedTextarea()
  showStatus(`Map seed ${brush} at ${x},${y}. Apply seed to rebuild.`)
```

The map does not update until Apply Seed.

Required behavior:

```text
When the user paints with a brush, the current world immediately reflects the edit.
The seed JSON updates immediately.
The user should not need to press Apply Seed to see the result.
```

Implementation guidance:

After updating `activeMapSeed`, apply the single-cell effect to the current world and map feature state without full reset where possible:

```text
H / B / S:
  set world[y][x].unit and suitable terrain FIELD/WILD/MARK

Mountain:
  set world[y][x] to BLOCK
  remove any unit at that cell
  remove river at that cell

River:
  add to mapFeatures.rivers
  remove unit at that cell
  do not change terrain to WATER

POI:
  add/update worldPOIs at that center

Erase:
  remove seed entry at cell
  remove river feature at cell
  remove POI centered at cell
  if mountain was erased, restore cell to EMPTY or to base seed/default empty cell
  if unit seed was erased, remove unit and restore neutral terrain unless another seed object owns the cell
```

For correctness, it is acceptable to rebuild the world from `activeMapSeed` after each brush edit if performance is acceptable on 40x25:

```js
const next = applyMapSeedToWorld(activeMapSeed, { setAsCurrent: false });
world = cloneWorld(next, { includeMetadata: true });
currentInitialWorld = cloneWorld(next, { includeMetadata: true });
mapFeatures = cloneMapFeatures(next.mapFeatures);
worldPOIs = clonePOIs(next.pointsOfInterest);
```

But avoid resetting player position if possible. If rebuilding is simpler, preserve player position when passable:

```text
oldPlayer = playerObserver
rebuild world
if oldPlayer position still passable, keep it
else reposition player
```

Do not reset tick or placeMemory on every brush stroke unless absolutely necessary. Editing should feel live, not like restarting the simulation every click.

Status text should say:

```text
Painted Mountain at 12,8.
Painted River at 13,8.
Erased seed item at 13,8.
```

Do not say "Apply seed to rebuild" after brush edits.

## Problem 2: Coordinate Mapping Is Wrong In Local Viewport

Current behavior:

```js
function handleGridCellClick(index) {
  const x = index % WIDTH;
  const y = Math.floor(index / WIDTH);
}
```

This only works for the full 40x25 grid. It is wrong when the grid is 15x11 Explore viewport.

Required behavior:

```text
Clicks use actual world coordinates stored on the rendered cell.
```

Implementation guidance:

In render functions, cells already get:

```js
el.dataset.worldX = String(...)
el.dataset.worldY = String(...)
```

Update click handling to read:

```js
function cellWorldPositionFromElement(cellEl, fallbackIndex) {
  const x = Number(cellEl?.dataset?.worldX);
  const y = Number(cellEl?.dataset?.worldY);
  if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  return {
    x: fallbackIndex % WIDTH,
    y: Math.floor(fallbackIndex / WIDTH)
  };
}
```

Change event binding so `handleGridCellClick` receives the element or event target:

```js
cell.addEventListener("click", (event) => handleGridCellClick(i, event.currentTarget));
```

All brush painting and runtime intervention must use this world position.

## Problem 3: No Drag Painting

Required behavior:

```text
Mountain, River, Erase, H, B, S can be painted by dragging over cells.
POI brushes should place on click, not repeated drag spam.
```

Implementation guidance:

Add simple pointer state:

```js
let mapSeedPointerPainting = false;
let lastPaintedSeedCellKey = null;
```

Events:

```text
pointerdown on cell:
  if brush active, paint cell
  set painting true for draggable brushes

pointerenter or pointermove over cell:
  if painting and brush is draggable, paint cell if new cell

pointerup / pointercancel / pointerleave document:
  painting false
  lastPaintedSeedCellKey = null
```

Draggable brushes:

```js
["mountain", "river", "erase", "H", "B", "S"]
```

Non-draggable brushes:

```js
["spring", "rot_source", "great_forest", "monument"]
```

Prevent duplicate writes when dragging through the same cell repeatedly.

## Problem 4: No Quick Editable Starting Point

Add two buttons in Map Seed Editor:

```text
Generate Random Preset
Clear Seed
```

Generate Random Preset:

```text
creates a deterministic-ish editable seed with:
  mountain bands / clusters
  at least one river path
  one spring
  one rot source
  one great forest
  one monument
  small H/B/S seed clusters
applies it immediately
updates seed JSON
```

It does not need to be perfect. It just gives the user a starting canvas to edit.

Use existing random seed / RNG helpers if available. If not, use `Math.random` for now.

Clear Seed:

```text
sets activeMapSeed to empty default
applies it immediately
updates seed JSON
clears mountains/rivers/POIs/seeded units
```

Do not remove non-seed UI state unnecessarily.

## Problem 5: Apply Seed Should Still Exist But Change Meaning

Keep Apply Seed.

Its role:

```text
parse the JSON textarea
apply the whole seed immediately
reset/rebuild world from that JSON
```

But normal painting should not require Apply Seed.

Rename button text if helpful:

```text
Apply JSON Seed
```

This is optional if tests or UI simplicity prefer keeping the current label.

## Tests

Add:

```text
tests/v0_13_1_1_map_seed_editor_usability_patch.test.js
```

Required tests:

1. Brush edit updates active seed and current world immediately.

Fixture:

```text
paint Mountain at 7,7
```

Expected:

```text
activeMapSeed.mountains includes 7,7
world[7][7].terrain === BLOCK
seed JSON includes 7,7
```

2. River brush updates mapFeatures immediately.

Expected:

```text
activeMapSeed.rivers includes cell
mapFeatures.rivers includes cell
world terrain is not WATER
isCellBlockedForMovement returns true for river cell
```

3. H/B/S brush updates unit immediately.

Expected:

```text
paint H sets unit H and terrain FIELD
paint B sets unit B and terrain WILD
paint S sets unit S and terrain MARK
```

4. Erase removes visible seed object immediately.

Expected:

```text
erase mountain restores passable non-BLOCK cell
erase river removes map feature
erase POI removes worldPOI centered there
erase unit removes unit
```

5. Explore viewport coordinate mapping uses dataset worldX/worldY.

Expected:

```text
cell with dataset worldX=22 worldY=14 paints seed at 22,14,
not index % WIDTH fallback
```

Expose helper if needed:

```js
cellWorldPositionFromElementForTest(fakeCell, index)
```

6. Drag paint skips duplicate same-cell writes and applies multiple cells.

Expected:

```text
paint sequence over 3 cells creates 3 river/mountain entries
revisiting same cell does not duplicate
```

7. Generate Random Preset creates usable seed and applies it.

Expected:

```text
seed has at least one river, spring, rot_source, great_forest, monument, mountain, and unit
worldPOIs includes generated POIs
mapFeatures.rivers not empty
```

8. Clear Seed clears seed and world features.

Expected:

```text
activeMapSeed units/mountains/rivers/pois empty
worldPOIs empty or back to seed-empty state
mapFeatures.rivers empty
```

Run:

```text
node tests/safety.test.js
node tests/json-export.test.js
node tests/v0_13_1_map_seed_place_memory_wake_report.test.js
node tests/v0_13_1_1_map_seed_editor_usability_patch.test.js
```

## Manual QA

Run the app and verify:

```text
1. Open Map Seed Editor.
2. Click Generate Random Preset.
3. The world immediately shows mountains, river, POIs, and units.
4. Select Mountain and drag over the map.
5. Mountain cells appear immediately.
6. Select River and drag a line.
7. River appears immediately and blocks movement.
8. Select Erase and drag over mountain/river.
9. Cells clear immediately.
10. Select Spring/Rot Source/Great Forest/Monument and click cells.
11. POIs appear immediately.
12. Switch to Explore View and paint a visible local cell.
13. The edited world coordinate is the clicked local cell, not an unrelated top-left cell.
14. Export Seed JSON contains the edited result.
15. Apply Seed still works when editing JSON manually.
```

## Files To Touch

Expected:

```text
index.html
style.css
sim.js
tests/v0_13_1_1_map_seed_editor_usability_patch.test.js
README.md
TRI_SPECIES_WORLD_SIM_RULES.md
```

Documentation updates should be brief:

```text
Map Seed Editor now paints live.
Brushes can drag-paint mountains/rivers/units/erase.
Random Preset and Clear Seed were added.
```

## Do Not Touch

Do not change:

```text
Place Memory wake report logic
POI player text logic
sleep duration logic
H/B/S ecology balance
Macro View visual rules
Explore movement rules
```

This patch is only for making seed editing usable.

