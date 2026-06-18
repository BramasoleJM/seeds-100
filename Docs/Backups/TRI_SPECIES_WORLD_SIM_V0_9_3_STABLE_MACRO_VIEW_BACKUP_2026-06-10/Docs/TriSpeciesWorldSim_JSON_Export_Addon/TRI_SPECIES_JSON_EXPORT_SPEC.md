# TRI_SPECIES_JSON_EXPORT_SPEC.md

> Add-on spec for exporting simulation data from the tri-species cellular automata demo.
> Purpose: let the designer export JSON snapshots or history records and send them back for analysis.

---

## 1. Why JSON export is needed

Screenshots show visual results, but they do not show enough structural data.

JSON export should let us inspect:

```text
tick-by-tick population change
terrain change
extinction timing
overgrowth timing
whether one species dominates too quickly
whether BORDER cells are useful
whether movement / reproduction / death rules are too strong
```

The exported JSON should be readable by ChatGPT or any simple script.

---

## 2. Required export buttons

Add these buttons to the UI:

```text
Export Snapshot JSON
Start Recording
Stop Recording
Export Recording JSON
Clear Recording
```

Minimum acceptable version:

```text
Export Snapshot JSON
Export Recording JSON
```

If recording is simpler to implement as “always record while simulation runs”, that is acceptable for V0.

---

## 3. Snapshot JSON

A snapshot records the current world state at one tick.

Suggested filename:

```text
tri_species_snapshot_tick_0120.json
```

Schema:

```json
{
  "type": "tri_species_snapshot",
  "version": "0.1",
  "createdAt": "2026-06-08T00:00:00.000Z",
  "tick": 120,
  "params": {
    "gridWidth": 60,
    "gridHeight": 40,
    "tickSpeedMs": 120,
    "overcrowdingThreshold": 6,
    "movementEnabled": true
  },
  "counts": {
    "units": {
      "H": 100,
      "B": 80,
      "S": 30
    },
    "terrains": {
      ".": 1300,
      "F": 400,
      "W": 500,
      "M": 160,
      "X": 30,
      "#": 10
    }
  },
  "world": {
    "terrainRows": [
      "....FFFFWWMM",
      "....FFFFWWMM"
    ],
    "unitRows": [
      "....HH..B.S.",
      ".....H..B..."
    ]
  }
}
```

Important:

```text
terrainRows and unitRows must have the same dimensions.
terrainRows[y][x] is the terrain at cell x,y.
unitRows[y][x] is the unit at cell x,y.
Use "." in unitRows to mean no unit.
```

---

## 4. Recording JSON

A recording stores multiple samples across time.

Suggested filename:

```text
tri_species_recording_ticks_0000_0300.json
```

Schema:

```json
{
  "type": "tri_species_recording",
  "version": "0.1",
  "createdAt": "2026-06-08T00:00:00.000Z",
  "params": {
    "gridWidth": 60,
    "gridHeight": 40,
    "tickSpeedMs": 120,
    "overcrowdingThreshold": 6,
    "movementEnabled": true
  },
  "startTick": 0,
  "endTick": 300,
  "sampleEvery": 1,
  "summary": {
    "initialCounts": {
      "units": {"H": 40, "B": 40, "S": 24},
      "terrains": {".": 1800, "F": 220, "W": 260, "M": 100, "X": 0, "#": 20}
    },
    "finalCounts": {
      "units": {"H": 120, "B": 60, "S": 0},
      "terrains": {".": 900, "F": 1000, "W": 450, "M": 0, "X": 30, "#": 20}
    },
    "extinctionTick": {
      "H": null,
      "B": null,
      "S": 180
    }
  },
  "frames": [
    {
      "tick": 0,
      "counts": {
        "units": {"H": 40, "B": 40, "S": 24},
        "terrains": {".": 1800, "F": 220, "W": 260, "M": 100, "X": 0, "#": 20}
      }
    },
    {
      "tick": 1,
      "counts": {
        "units": {"H": 42, "B": 39, "S": 24},
        "terrains": {".": 1790, "F": 230, "W": 262, "M": 98, "X": 0, "#": 20}
      }
    }
  ],
  "keyframes": [
    {
      "tick": 0,
      "terrainRows": [],
      "unitRows": []
    },
    {
      "tick": 100,
      "terrainRows": [],
      "unitRows": []
    },
    {
      "tick": 200,
      "terrainRows": [],
      "unitRows": []
    }
  ]
}
```

---

## 5. Recording detail level

To keep JSON size reasonable:

```text
frames should store counts every tick.
keyframes should store full grid every N ticks.
```

Default:

```text
sampleEvery = 1
keyframeEvery = 25
```

The UI should expose:

```text
keyframeEvery input or slider
```

If not implemented in V0, default to 25.

---

## 6. Recommended analysis fields

Each frame should include counts.

Required frame fields:

```json
{
  "tick": 10,
  "counts": {
    "units": {
      "H": 0,
      "B": 0,
      "S": 0
    },
    "terrains": {
      ".": 0,
      "F": 0,
      "W": 0,
      "M": 0,
      "X": 0,
      "#": 0
    }
  }
}
```

Optional but useful fields:

```json
{
  "events": {
    "births": {"H": 0, "B": 0, "S": 0},
    "deaths": {"H": 0, "B": 0, "S": 0},
    "conversions": {"H_to_S": 0},
    "terrainChanges": {
      "EMPTY_to_FIELD": 0,
      "FIELD_to_WILD": 0,
      "WILD_to_FIELD": 0,
      "FIELD_to_MARK": 0,
      "MARK_to_WILD": 0
    }
  }
}
```

Optional event fields are not required for first implementation, but are very useful for debugging rules.

---

## 7. How to download JSON in browser

Use a Blob download.

Implementation idea:

```js
function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

---

## 8. What the designer should send back

When sharing results for analysis, send:

```text
1. Exported recording JSON
2. Screenshot if possible
3. Short note:
   - what tick range
   - what looked wrong
   - what parameters were used
```

Example note:

```text
Recording: ticks 0-300
Problem: Spirit goes extinct around tick 180.
Visual: Human FIELD takes over the left and center; Beast survives at right edge.
Params: default.
```

---

## 9. Success criteria

JSON export is successful if:

```text
Export Snapshot JSON downloads a file with full terrainRows and unitRows.
Export Recording JSON downloads a file with tick-by-tick counts.
The file can be uploaded to ChatGPT for analysis.
The JSON includes params, counts, and enough world data to reproduce or inspect the result.
```

---

## 10. Version

```text
JSON Export Spec Version: 0.1
Date: 2026-06-08
For rules version: TRI_SPECIES_WORLD_SIM_V0.1
```
