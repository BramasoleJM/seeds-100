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
  constructor() {
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

  click() {
    if (this.listeners.click) this.listeners.click({ target: this, preventDefault() {} });
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim({ viewMode = "macro", keyframeEvery = "2" } = {}) {
  const elements = new Map();
  const document = {
    body: new FakeElement(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement() {
      return new FakeElement();
    },
    addEventListener() {},
  };

  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "30",
    beastCount: "22",
    spiritCount: "0",
    fieldPatchCount: "5",
    wildPatchCount: "5",
    markPatchCount: "3",
    blockCount: "18",
    randomSeed: "10301",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery,
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

let loaded = loadSim({ viewMode: "macro" });
let sim = loaded.sim;

assert.equal(sim.macroSummary().tick, 0, "reset should analyze macroWorld once at tick 0");
for (let i = 0; i < 24; i += 1) sim.stepWorld();
assert.equal(sim.macroSummary().tick, 0, "Macro View render should not force full macro analysis before the interval");
sim.stepWorld();
assert.equal(sim.macroSummary().tick, 25, "macro analysis should run at MACRO_ANALYSIS_INTERVAL during simulation");

const maskA = sim.buildMacroDisplayMasks(sim.getMacroDisplayWorldForTest(), "macro");
const maskB = sim.buildMacroDisplayMasks(sim.getMacroDisplayWorldForTest(), "macro");
assert.strictEqual(maskA, maskB, "macro display masks should be cached for the same macro tick and mode");
const maskSubstrate = sim.buildMacroDisplayMasks(sim.getMacroDisplayWorldForTest(), "substrateMacro");
assert.notStrictEqual(maskA, maskSubstrate, "display mode should be part of the macro mask cache key");

for (const frame of sim.getMacroRecentFramesForTest()) {
  assert.ok(!("terrainRows" in frame), "macroRecentFrames should not store terrainRows");
  assert.ok(!("unitRows" in frame), "macroRecentFrames should not store unitRows");
  assert.ok(!("fertilityRows" in frame), "macroRecentFrames should not store fertilityRows");
  assert.ok(!("terrainAgeRows" in frame), "macroRecentFrames should not store terrainAgeRows");
  assert.ok(!("regionBiasRows" in frame), "macroRecentFrames should not store regionBiasRows");
}

const staleMacroTick = sim.macroSummary().tick;
sim.stepWorld();
assert.equal(sim.macroSummary().tick, staleMacroTick, "macroWorld can remain stale between interval updates");
const snapshot = sim.createSnapshotExport();
assert.equal(snapshot.macroWorld.tick, snapshot.tick, "snapshot export should force current macroWorld data");

loaded = loadSim({ viewMode: "substrateMacro", keyframeEvery: "2" });
sim = loaded.sim;
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();

assert.ok(recording.regionalSubstrate, "recording export should keep top-level regionalSubstrate");
assert.ok(recording.frames.length >= 3, "recording should include compact frames");
for (const frame of recording.frames) {
  assert.ok(!("regionalSubstrate" in frame), "regionalSubstrate should not be repeated in every recording frame");
  assert.ok(!("terrainRows" in frame), "recording frames should remain compact");
  assert.ok(frame.macro, "recording frames should keep compact macro summaries");
}
assert.ok(recording.keyframes.length >= 2, "recording should still include keyframes");
assert.ok(recording.keyframes.some((keyframe) => Array.isArray(keyframe.terrainRows)), "keyframes should still include full terrain rows");
assert.ok(recording.keyframes.some((keyframe) => Array.isArray(keyframe.unitRows)), "keyframes should still include full unit rows");
assert.ok(recording.keyframes.some((keyframe) => Array.isArray(keyframe.regionBiasRows)), "keyframes should still include regionBiasRows");

const beforeInterventionTick = sim.macroSummary().tick;
assert.ok(sim.placeInterventionUnit(1, 1, sim.UNIT.BEAST), "runtime intervention should still place units");
assert.ok(sim.macroSummary().tick >= beforeInterventionTick, "runtime intervention should refresh macroWorld once");

console.log("v0.10.3 performance / macro throttling tests passed");
