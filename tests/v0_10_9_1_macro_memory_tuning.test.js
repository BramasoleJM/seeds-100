const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
  }

  toggle(name, force) {
    const classes = new Set((this.owner.className || "").split(/\s+/).filter(Boolean));
    if (force) classes.add(name);
    else classes.delete(name);
    this.owner.className = Array.from(classes).join(" ");
  }
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.title = "";
    this.value = "";
    this.checked = false;
    this.listeners = {};
    this._innerHTML = "";
    this.className = "";
    this.classList = new FakeClassList(this);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim({ viewMode = "macro" } = {}) {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    addEventListener() {},
  };

  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "30",
    beastCount: "20",
    spiritCount: "0",
    fieldPatchCount: "5",
    wildPatchCount: "6",
    markPatchCount: "3",
    blockCount: "18",
    randomSeed: "1037746564",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode,
    interventionUnit: "H",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = true;
  document.getElementById("macroOverlayToggle").checked = false;

  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {},
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    Math,
    Date,
    performance,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document };
}

function blankWorld(sim, fertility = 1) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function repeatMemory(sim, world, count) {
  let frame = null;
  for (let i = 0; i < count; i += 1) {
    frame = sim.updateMacroMemoryForTest(world, { force: true, mode: "macro" });
  }
  return frame;
}

function runTicks(sim, count) {
  for (let i = 0; i < count; i += 1) sim.stepWorld();
}

function traceValue(memory, channel, x, y) {
  return memory.traces[channel][y][x];
}

let { sim } = loadSim({ viewMode: "macro" });
assert.equal(sim.MACRO_MEMORY_CONFIG.version, "0.10.9.1", "macro memory tuning constants should expose V0.10.9.1");
assert.ok(sim.MACRO_MEMORY_CONFIG.decay <= 0.99, "macro memory should forget slightly faster than V0.10.9");
assert.ok(sim.MACRO_MEMORY_CONFIG.terrainGain <= 0.018, "terrain gain should be tuned lower");
assert.ok(sim.MACRO_MEMORY_CONFIG.shapeBodyGain <= 0.024, "shape body gain should be tuned lower");
assert.ok(sim.MACRO_MEMORY_CONFIG.shapeCoreGain <= 0.04, "shape core gain should be tuned lower");
assert.ok(sim.MACRO_MEMORY_CONFIG.poiGain <= 0.022, "POI gain should be tuned lower");
assert.ok(sim.MACRO_MEMORY_CONFIG.conflictGain <= 0.028, "conflict gain should be tuned lower");
assert.ok(sim.MACRO_MEMORY_CONFIG.faintThreshold >= 0.36, "faint threshold should be stricter");
assert.ok(sim.MACRO_MEMORY_CONFIG.strongThreshold >= 0.62, "strong threshold should be much stricter");

let humanWorld = blankWorld(sim, 1);
humanWorld[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 2);
let oneFrame = repeatMemory(sim, humanWorld, 1);
assert.ok(traceValue(oneFrame, "human", 10, 10) < sim.MACRO_MEMORY_CONFIG.faintThreshold, "one-frame Human/FIELD noise should stay below visible threshold");
let visibleHuman = repeatMemory(sim, humanWorld, 30);
assert.ok(traceValue(visibleHuman, "human", 10, 10) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "repeated Human/FIELD signal should still become visible memory");
assert.ok(traceValue(visibleHuman, "human", 10, 10) < sim.MACRO_MEMORY_CONFIG.strongThreshold, "strong memory should require more repeated signal than V0.10.9");
let strongHuman = repeatMemory(sim, humanWorld, 35);
assert.ok(traceValue(strongHuman, "human", 10, 10) >= sim.MACRO_MEMORY_CONFIG.strongThreshold, "long repeated Human/FIELD signal should still become strong memory");

let beastWorld = blankWorld(sim, 1);
beastWorld[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 0, "pack", 3);
let overlapOnlyWorld = blankWorld(sim, 1);
overlapOnlyWorld[10][10] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 1);
sim.resetWorld(humanWorld);
repeatMemory(sim, humanWorld, 65);
repeatMemory(sim, beastWorld, 30);
let overlapOnlyMemory = repeatMemory(sim, overlapOnlyWorld, 10);
assert.ok(traceValue(overlapOnlyMemory, "human", 10, 10) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "fixture should retain human memory");
assert.ok(traceValue(overlapOnlyMemory, "beast", 10, 10) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "fixture should retain beast memory");
assert.ok(traceValue(overlapOnlyMemory, "conflict", 10, 10) < sim.MACRO_MEMORY_CONFIG.faintThreshold, "historical human+beast overlap alone should not create active conflict memory");
let overlapMask = sim.buildMacroDisplayMasks(overlapOnlyWorld, "macro", []);
assert.equal(overlapMask.cellClasses[10][10].includes("memory-conflict-strong"), false, "overlap alone should not emit strong conflict class");

let borderWorld = blankWorld(sim, 1);
borderWorld[10][10] = sim.createCell(sim.TERRAIN.BORDER, null, 0, "normal", 1);
let borderMemory = repeatMemory(sim, borderWorld, 35);
assert.ok(traceValue(borderMemory, "conflict", 10, 10) >= sim.MACRO_MEMORY_CONFIG.strongThreshold, "repeated BORDER should grow strong conflict memory");

let adjacencyWorld = blankWorld(sim, 1);
adjacencyWorld[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 2);
adjacencyWorld[10][11] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 0, "pack", 3);
sim.resetWorld(adjacencyWorld);
let adjacencyMemory = repeatMemory(sim, adjacencyWorld, 30);
assert.ok(traceValue(adjacencyMemory, "conflict", 10, 10) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "current Human-Beast adjacency should grow conflict memory");
assert.ok(traceValue(adjacencyMemory, "conflict", 11, 10) >= sim.MACRO_MEMORY_CONFIG.faintThreshold, "current Human-Beast adjacency should mark both sides");

let rotWorld = blankWorld(sim, 1);
rotWorld[8][8] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2);
rotWorld.pointsOfInterest = [{ id: "test_rot", type: "rot_source", x: 8, y: 8, radius: 4, innerRadius: 1, strength: "strong", state: "active", createdAtTick: 0 }];
sim.resetWorld(rotWorld);
repeatMemory(sim, rotWorld, 10);
let warmRot = sim.macroSummary().poiStates.find((poi) => poi.type === "rot_source");
assert.equal(warmRot.state, "forming", "rot source should use conservative warmup label before enough memory accumulates");
runTicks(sim, 60);
repeatMemory(sim, rotWorld, 80);
let matureRot = sim.macroSummary().poiStates.find((poi) => poi.type === "rot_source");
assert.ok(["dominant", "spreading", "contained"].includes(matureRot.state), "mature rot source should leave warmup once memory is sufficient");

let contestedRotWorld = blankWorld(sim, 1);
contestedRotWorld[8][8] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2);
contestedRotWorld[8][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 2);
contestedRotWorld[9][8] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 0, "pack", 3);
contestedRotWorld.pointsOfInterest = rotWorld.pointsOfInterest;
sim.resetWorld(contestedRotWorld);
runTicks(sim, 60);
repeatMemory(sim, contestedRotWorld, 90);
let contestedRot = sim.macroSummary().poiStates.find((poi) => poi.type === "rot_source");
assert.equal(contestedRot.state, "contested", "rot source should prefer contested over dominant when conflict pressure is high");

let springWorld = blankWorld(sim, 1);
springWorld[7][7] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 4);
springWorld.pointsOfInterest = [{ id: "test_spring", type: "spring", x: 7, y: 7, radius: 4, strength: "strong", state: "active", createdAtTick: 0, blocksMovement: true }];
sim.resetWorld(springWorld);
repeatMemory(sim, springWorld, 20);
let earlySpring = sim.macroSummary().poiStates.find((poi) => poi.type === "spring");
assert.notEqual(earlySpring.state, "corrupted", "spring corrupted label should not fire on mild early rot contamination");
runTicks(sim, 60);
repeatMemory(sim, springWorld, 90);
let matureSpring = sim.macroSummary().poiStates.find((poi) => poi.type === "spring");
assert.equal(matureSpring.state, "corrupted", "spring corrupted label should require sustained rot memory");

sim.clearMacroTimeline();
sim.startMacroTimeline();
repeatMemory(sim, contestedRotWorld, 10);
sim.recordMacroTimelineFrame({ force: true, mode: "macro" });
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should remain stable");
assert.ok(timeline.frames[0].macroSummary.macroMemory, "macroSummary.macroMemory should remain present");
assert.ok(timeline.frames[0].macroSummary.poiStates, "macroSummary.poiStates should remain present");
assert.ok(!("traces" in timeline.frames[0].macroSummary.macroMemory), "macro timeline should not export full trace arrays");
assert.ok(timeline.frames[0].macroSummary.macroMemory.coverage, "macroMemory summary may include compact coverage percentages");

sim.clearRecording();
sim.startRecording();
repeatMemory(sim, contestedRotWorld, 10);
sim.recordFrame();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.macroMemorySummary, "recording macroMemorySummary should remain present");
assert.ok(!("traces" in recording.macroMemorySummary), "recording macroMemorySummary should stay compact");
assert.ok(!("traceRows" in recording.macroMemorySummary), "recording macroMemorySummary should not export trace rows");
assert.ok(!("traceRows" in recording.pointsOfInterest[0]), "pointsOfInterest should remain compact");

console.log("v0.10.9.1 macro memory tuning tests passed");
