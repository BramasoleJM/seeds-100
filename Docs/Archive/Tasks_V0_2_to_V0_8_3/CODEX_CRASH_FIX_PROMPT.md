# CODEX_CRASH_FIX_PROMPT.md

把这段 prompt 复制给 Codex，用来修复 index.html 打开后浏览器崩溃 / 卡死的问题。

---

Read the current project files first.

Act as Executor.

The current `index.html` demo crashes or freezes the browser when opened. Do not change the simulation design rules unless necessary for performance safety. First make the demo safe to open, pause, inspect, and step manually.

## Goal

Fix browser crash / freeze.

The demo must:

```text
1. Open safely.
2. Start paused by default.
3. Not run simulation automatically on page load.
4. Let the user click Step once without freezing.
5. Let Play run at a capped speed.
6. Avoid unbounded memory growth.
7. Avoid rebuilding huge DOM every tick if possible.
```

## Likely crash causes to check

Inspect and fix these if present:

```text
- setInterval starts automatically on page load.
- Play button can create multiple intervals without clearing old ones.
- tickSpeed can become 0 or extremely low.
- renderWorld recreates thousands of DOM nodes every tick.
- history panel appends unlimited text rows every tick.
- recording stores full terrainRows / unitRows every tick.
- keyframes are stored too often.
- movement planning has an infinite loop or repeated retry loop.
- randomize / initialization creates too many units.
- update loop calls stepWorld recursively or through render side effects.
```

## Required safety changes

### 1. Default paused

On page load:

```js
isPlaying = false;
```

Do not call `play()` automatically.

### 2. Safe grid size default

Temporarily reduce default grid size to:

```text
gridWidth = 40
gridHeight = 25
```

Add controls or constants so we can later restore 60 x 40.

### 3. Tick speed clamp

Clamp tick speed:

```js
tickSpeedMs = Math.max(100, tickSpeedMs);
```

The fastest simulation speed should not go below 100ms per tick for now.

### 4. Single interval guard

Make sure Play cannot create multiple intervals.

Pattern:

```js
let intervalId = null;

function start() {
  if (intervalId !== null) return;
  intervalId = setInterval(() => stepWorld(), tickSpeedMs);
}

function stop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
```

If tick speed changes while playing, stop and restart one interval.

### 5. Add emergency stop

Add keyboard shortcut:

```text
Space = Play / Pause
Esc = Pause
```

### 6. Limit history display

If there is a visible history log, keep only the latest 100 rows.

Do not append unlimited DOM nodes.

### 7. Limit recording memory

Recording should store:

```text
counts every tick
full keyframe only every keyframeEvery ticks
```

Default:

```text
keyframeEvery = 25
maxRecordedFrames = 2000
```

If recording exceeds maxRecordedFrames, stop recording automatically and show a warning.

Do not store full world state every tick.

### 8. Render optimization

If current rendering uses one DOM element per cell and rebuilds all cells every tick, replace it with one of these safer options:

Preferred:
```text
Canvas rendering
```

Acceptable:
```text
Create DOM cell elements once, then update their class/textContent each render.
Do not recreate the whole grid DOM every tick.
```

For canvas:
- Draw terrain background color.
- Draw unit letter on top.
- Use a fixed cell size.
- Rendering 40 x 25 should be smooth.

### 9. Step budget

Ensure `stepWorld()` has no unbounded loops.

Any search or movement decision must inspect only local neighbor cells, not loop until success.

### 10. Error guard

Wrap the tick loop:

```js
try {
  stepWorld();
} catch (err) {
  stop();
  console.error(err);
  showStatus("Simulation stopped due to error. Check console.");
}
```

## Add visible performance status

Show:

```text
Tick: N
Playing: true/false
Grid: 40 x 25
Units: H/B/S counts
Terrains: F/W/M/X counts
Recording: ON/OFF
```

Also show warnings:

```text
Simulation paused due to error.
Recording stopped: max frame limit reached.
```

## Test checklist

After patching, verify:

```text
1. Opening index.html does not start simulation.
2. Step advances exactly one tick.
3. Play runs without freezing for at least 300 ticks.
4. Pause stops the interval.
5. Pressing Play many times does not create multiple intervals.
6. Export Snapshot JSON still works.
7. Export Recording JSON does not include full grid every tick.
8. Browser memory does not grow rapidly during 300 ticks.
```

## Do not do

Do not add new rules.
Do not add multi-screen map.
Do not add tarot.
Do not add lore.
Do not beautify before fixing stability.

## Completion report

Report:

```text
- root cause found, if any
- files changed
- safety limits added
- how to run
- how to test 300 ticks
- any remaining risk
```
