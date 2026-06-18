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

function loadSim({ seed = "1037746564", viewMode = "substrateMacro", keyframeEvery = "25" } = {}) {
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
    humanCount: "24",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "2",
    blockCount: "20",
    randomSeed: seed,
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

function archetypeCounts(snapshot) {
  const counts = {};
  for (const cell of snapshot.regionalSubstrate.layout.cells) {
    counts[cell.archetype] = (counts[cell.archetype] || 0) + 1;
  }
  return counts;
}

function countHeavyArchetypes(snapshot) {
  const counts = archetypeCounts(snapshot);
  return (counts.choke_pass || 0) + (counts.barrier_edge || 0);
}

function runTicks(sim, ticks) {
  for (let i = 0; i < ticks; i += 1) sim.stepWorld();
}

for (const seed of ["1037746564", "10203", "4"]) {
  const { sim } = loadSim({ seed });
  const snapshot = sim.createSnapshotExport();
  assert.ok(snapshot.counts.terrains["#"] <= 180, `seed ${seed} should avoid overblocking, got ${snapshot.counts.terrains["#"]}`);
  assert.ok(countHeavyArchetypes(snapshot) <= 3, `seed ${seed} should not overuse choke/barrier cells`);
  assert.ok(snapshot.regionalSubstrate.layout.cells.some((cell) => cell.regionBias === "basin" && cell.blockCount <= 13), "at least one basin should stay spacious");
  assert.ok(snapshot.regionalSubstrate.layout.cells.some((cell) => cell.regionBias === "refuge" && cell.blockCount <= 15), "at least one refuge should stay spacious");
}

let loaded = loadSim({ seed: "1037746564", viewMode: "substrateMacro", keyframeEvery: "2" });
let sim = loaded.sim;
runTicks(sim, 300);
let snapshot = sim.createSnapshotExport();
const usefulMacroObjects = snapshot.macroWorld.regions.length + snapshot.macroWorld.events.length + snapshot.macroWorld.routes.length;
assert.ok(usefulMacroObjects >= 8, `macroWorld should stay readable after 300 ticks, got ${usefulMacroObjects} useful objects`);
assert.ok(snapshot.macroWorld.display.masks.wildRecovery >= 1, "Macro View should keep visible Beast/WILD recovery when present");
assert.ok(snapshot.macroWorld.display.masks.settlements >= 1, "Macro View should keep visible settlement information when present");

sim.clearRecording();
sim.startRecording();
runTicks(sim, 3);
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.ok(recording.regionalSubstrate, "recording should keep top-level regionalSubstrate");
assert.ok(recording.frames.every((frame) => !("terrainRows" in frame) && !("unitRows" in frame) && !("regionalSubstrate" in frame)), "recording frames should remain compact");
assert.ok(recording.keyframes.some((keyframe) => Array.isArray(keyframe.terrainRows)), "recording keyframes should retain full terrain rows");
assert.ok(recording.keyframes.some((keyframe) => Array.isArray(keyframe.regionBiasRows)), "recording keyframes should retain regionBiasRows");

loaded = loadSim({ seed: "1037746564" });
sim = loaded.sim;
snapshot = sim.createSnapshotExport();
const openIndex = snapshot.world.terrainRows.join("").indexOf(".");
const blockIndex = snapshot.world.terrainRows.join("").indexOf("#");
loaded.document.getElementById("grid").children[openIndex].click();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows.join("")[openIndex], "H", "runtime intervention should still place H on non-BLOCK");
loaded.document.getElementById("interventionUnit").value = "B";
loaded.document.getElementById("grid").children[blockIndex].click();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows.join("")[blockIndex], ".", "runtime intervention should still reject BLOCK");

console.log("v0.10.4 regression repair tests passed");
