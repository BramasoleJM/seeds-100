# CODEX_ADD_JSON_EXPORT_PROMPT.md

Copy this prompt into Codex after the first demo exists.

---

Read these files first:

```text
AGENTS.md
TRI_SPECIES_WORLD_SIM_RULES.md
TRI_SPECIES_JSON_EXPORT_SPEC.md
```

Act as Executor.

Add JSON export and recording support to the existing tri-species cellular automata demo.

Do not change simulation rules unless required to collect statistics.

Do not add new species, terrain types, lore, tarot, or multi-screen systems.

## Goal

Add the ability to export:

```text
1. Current snapshot JSON
2. Evolution recording JSON
```

The exported JSON should be suitable for sending to ChatGPT for rule analysis.

## UI additions

Add buttons:

```text
Export Snapshot JSON
Start Recording
Stop Recording
Export Recording JSON
Clear Recording
```

If the simulation is already playing, recording should capture frames while it runs.

If Step is clicked while recording, it should also capture the stepped frame.

Add a small recording status indicator:

```text
Recording: ON/OFF
Recorded frames: N
```

Add an input or slider:

```text
keyframeEvery
```

Default:

```text
25
```

## Snapshot export

Implement a function:

```js
createSnapshotExport()
```

It should return:

```js
{
  type: "tri_species_snapshot",
  version: "0.1",
  createdAt,
  tick,
  params,
  counts,
  world: {
    terrainRows,
    unitRows
  }
}
```

Where:

```text
terrainRows is an array of strings.
unitRows is an array of strings.
"." in unitRows means no unit.
```

Add:

```js
exportSnapshotJson()
```

It should download a file named like:

```text
tri_species_snapshot_tick_0120.json
```

## Recording export

Maintain an in-memory recording object.

Each recorded frame should include at minimum:

```js
{
  tick,
  counts
}
```

Every `keyframeEvery` ticks, also include full grid data:

```js
{
  tick,
  terrainRows,
  unitRows
}
```

Implement:

```js
startRecording()
stopRecording()
clearRecording()
recordFrame()
createRecordingExport()
exportRecordingJson()
```

Exported recording shape:

```js
{
  type: "tri_species_recording",
  version: "0.1",
  createdAt,
  params,
  startTick,
  endTick,
  sampleEvery: 1,
  keyframeEvery,
  summary,
  frames,
  keyframes
}
```

The summary should include:

```js
initialCounts
finalCounts
extinctionTick: {
  H,
  B,
  S
}
```

Use `null` if a species never went extinct during the recording.

## Params to include

Include current UI parameters:

```text
gridWidth
gridHeight
tickSpeedMs
overcrowdingThreshold
movementEnabled
```

If some do not exist yet, include what exists and add TODO comments.

## Count function

Ensure there is a reusable function:

```js
countWorld(world)
```

It should return:

```js
{
  units: { H, B, S },
  terrains: { ".", F, W, M, X, "#" }
}
```

Use this same function for UI stats and JSON export.

## Download helper

Add:

```js
downloadJson(filename, data)
```

Use a browser Blob download.

## README update

Update README.md with a section:

```text
JSON export
```

Explain:

```text
how to export snapshot
how to start/stop recording
what file to send back for analysis
```

## Completion report

After implementation, report:

```text
files changed
functions added
how to test export
any simplifications
```
