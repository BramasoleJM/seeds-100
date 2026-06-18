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

function loadSim({ viewMode = "macro" } = {}) {
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

function runTicks(sim, ticks) {
  for (let i = 0; i < ticks; i += 1) sim.stepWorld();
}

const indexHtml = fs.readFileSync("index.html", "utf8");
for (const id of ["startMacroTimeline", "stopMacroTimeline", "exportMacroTimeline", "clearMacroTimeline"]) {
  assert.ok(indexHtml.includes(`id="${id}"`), `index.html should include #${id}`);
}

let loaded = loadSim({ viewMode: "macro" });
let sim = loaded.sim;

assert.equal(typeof sim.startMacroTimeline, "function", "macro timeline should expose startMacroTimeline");
assert.equal(typeof sim.stopMacroTimeline, "function", "macro timeline should expose stopMacroTimeline");
assert.equal(typeof sim.clearMacroTimeline, "function", "macro timeline should expose clearMacroTimeline");
assert.equal(typeof sim.createMacroTimelineExport, "function", "macro timeline should expose createMacroTimelineExport");
assert.equal(typeof sim.getMacroDisplayFrameForTest, "function", "macro display frame should be inspectable");

assert.equal(sim.macroSummary().tick, 0, "reset should analyze macroWorld once at tick 0");
assert.equal(sim.getMacroDisplayFrameForTest().tick, 0, "reset should create a lightweight display frame");
runTicks(sim, 12);
assert.equal(sim.macroSummary().tick, 0, "heavy macroWorld analysis should stay throttled before tick 25");
assert.ok(sim.getMacroDisplayFrameForTest().tick >= 10, "lightweight display frame should update before heavy analysis");
runTicks(sim, 13);
assert.equal(sim.macroSummary().tick, 25, "heavy macroWorld analysis should still run at the analysis interval");

loaded = loadSim({ viewMode: "substrateMacro" });
sim = loaded.sim;
sim.clearRecording();
sim.clearMacroTimeline();
sim.startMacroTimeline();
runTicks(sim, 12);
const snapshot = sim.createSnapshotExport();
const openIndex = snapshot.world.terrainRows.join("").indexOf(".");
loaded.document.getElementById("grid").children[openIndex].click();
runTicks(sim, 18);
sim.stopMacroTimeline();

const recording = sim.createRecordingExport();
assert.equal(recording.frames.length, 0, "macro timeline recording should not require normal recording frames");

const timeline = sim.createMacroTimelineExport();
assert.equal(timeline.type, "tri_species_macro_timeline", "timeline export should use the dedicated type");
assert.equal(timeline.version, "0.1", "timeline export should keep a stable file version");
assert.equal(timeline.sampleEvery, 5, "timeline should declare visual sample cadence");
assert.equal(timeline.analysisEvery, 25, "timeline should declare semantic analysis cadence");
assert.deepEqual(timeline.grid, { width: 40, height: 25 }, "timeline should declare grid size");
assert.ok(timeline.regionalSubstrate, "regionalSubstrate should be exported once at top level");
assert.ok(Array.isArray(timeline.frames) && timeline.frames.length >= 6, "timeline should include compact visual frames");
assert.ok(Array.isArray(timeline.analysisFrames) && timeline.analysisFrames.some((frame) => frame.tick === 25), "timeline should include analysis frames at cadence");
assert.ok(timeline.interventions.length >= 1, "runtime interventions should appear in timeline metadata");

for (const frame of timeline.frames) {
  assert.ok(!("terrainRows" in frame), "timeline visual frames should not store full terrain rows");
  assert.ok(!("unitRows" in frame), "timeline visual frames should not store full unit rows");
  assert.ok(!("regionalSubstrate" in frame), "timeline visual frames should not repeat regionalSubstrate");
  assert.ok(frame.maskRows && Array.isArray(frame.maskRows.settlement), "timeline frame should include compact mask rows");
  assert.equal(frame.maskRows.settlement.length, 25, "mask rows should match grid height");
  assert.equal(frame.maskRows.settlement[0].length, 40, "mask row strings should match grid width");
  assert.ok(frame.maskCounts, "timeline frame should include mask counts");
  assert.ok(frame.macroSummary, "timeline frame should include compact macro summary");
}

for (const analysisFrame of timeline.analysisFrames) {
  assert.ok(analysisFrame.macroWorld, "analysis frames should include macroWorld snapshots");
  assert.ok(Array.isArray(analysisFrame.macroWorld.regions), "analysis macroWorld should include regions");
  assert.ok(Array.isArray(analysisFrame.macroWorld.routes), "analysis macroWorld should include routes");
  assert.ok(Array.isArray(analysisFrame.macroWorld.events), "analysis macroWorld should include events");
  assert.ok(Array.isArray(analysisFrame.macroWorld.memories), "analysis macroWorld should include memories");
}

console.log("v0.10.5 macro timeline / rule audit tests passed");
