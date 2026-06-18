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

function loadSim({ viewMode = "macro", seed = "1037746564" } = {}) {
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
    randomSeed: seed,
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

function classNames(document) {
  return document.getElementById("grid").children.map((cell) => cell.className);
}

function runTicks(sim, ticks) {
  for (let i = 0; i < ticks; i += 1) sim.stepWorld();
}

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.ok(indexHtml.includes("Regional substrate"), "legend should identify regional substrate swatches");
assert.ok(indexHtml.includes("Macro aids"), "legend should identify macro aid swatches");

let loaded = loadSim({ viewMode: "macro" });
let sim = loaded.sim;
let classes = classNames(loaded.document);

assert.ok(!classes.some((name) => /\bregion-(basin|refuge|hollow|none)\b/.test(name)), "Macro View should omit regional substrate classes in the population-primary visual contract");
assert.ok(classes.some((name) => /\bfertility-[0-4]\b/.test(name)), "rendered cells should include fertility level classes");

let masks = sim.buildMacroDisplayMasks(sim.getMacroDisplayWorldForTest(), "macro");
let maskClasses = masks.cellClasses.flat().join(" ");
assert.ok(/\bmacro-soft-(core|edge)\b/.test(maskClasses), "macro masks should mark ecological influence core or edge cells");
assert.ok(/\bmacro-soft-fringe\b/.test(maskClasses), "macro masks should add fringe cells for softer ecological edges");

const snapshot = sim.createSnapshotExport();
const blockIndex = snapshot.world.terrainRows.join("").indexOf("#");
assert.ok(blockIndex >= 0, "test world should include BLOCK cells");
assert.ok(!/\bmacro-soft-fringe\b/.test(classes[blockIndex]), "BLOCK cells should not receive soft fringe styling");
assert.ok(/\bterrain-block\b/.test(classes[blockIndex]), "BLOCK cells should keep terrain-block class");

loaded = loadSim({ viewMode: "substrateMacro" });
sim = loaded.sim;
classes = classNames(loaded.document);
assert.ok(classes.some((name) => /\bregion-(basin|refuge|hollow|none)\b/.test(name)), "Substrate + Macro View should still attach regional substrate classes");
assert.ok(classes.some((name) => /\bscreen-edge-(north|south|west|east)\b/.test(name)), "Substrate + Macro View should still show screen-cell boundaries");
assert.ok(classes.some((name) => /\bfertility-[0-4]\b/.test(name)), "Substrate + Macro View should include fertility classes");

runTicks(sim, 30);
masks = sim.buildMacroDisplayMasks(sim.getMacroDisplayWorldForTest(), "substrateMacro");
maskClasses = masks.cellClasses.flat().join(" ");
assert.ok(/\bmacro-cell-frontier\b/.test(maskClasses) || masks.counts.frontiers === 0, "frontier classes should still be available when detected");
assert.ok(/\bmacro-cell-route\b/.test(maskClasses) || masks.counts.routes === 0, "route classes should still be available when detected");

sim.clearMacroTimeline();
sim.startMacroTimeline();
runTicks(sim, 10);
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.equal(timeline.type, "tri_species_macro_timeline", "macro timeline export type should be preserved");
assert.ok(timeline.frames.every((frame) => !("terrainRows" in frame) && !("unitRows" in frame) && !("visualClassRows" in frame)), "timeline frame shape should stay compact and unchanged by visual classes");

sim.clearRecording();
sim.startRecording();
runTicks(sim, 2);
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.equal(recording.type, "tri_species_recording", "recording export type should be preserved");
assert.ok(recording.frames.every((frame) => !("terrainRows" in frame) && !("unitRows" in frame) && !("visualClassRows" in frame)), "recording frame shape should stay compact and unchanged by visual classes");

console.log("v0.10.6 macro visual communication tests passed");
