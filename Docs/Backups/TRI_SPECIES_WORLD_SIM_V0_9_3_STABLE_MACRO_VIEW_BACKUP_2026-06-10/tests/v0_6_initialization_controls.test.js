const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.value = "";
    this.checked = true;
    this.listeners = {};
    this._innerHTML = "";
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }

  click() {
    if (this.listeners.click) this.listeners.click({ preventDefault() {} });
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim() {
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

  document.getElementById("speed").value = "180";
  document.getElementById("movementToggle").checked = true;
  document.getElementById("humanCount").value = "24";
  document.getElementById("beastCount").value = "18";
  document.getElementById("spiritCount").value = "0";
  document.getElementById("fieldPatchCount").value = "3";
  document.getElementById("wildPatchCount").value = "5";
  document.getElementById("markPatchCount").value = "3";
  document.getElementById("blockCount").value = "20";
  document.getElementById("randomSeed").value = "12345";
  document.getElementById("presetSelect").value = "balanced";
  document.getElementById("overcrowding").value = "6";
  document.getElementById("keyframeEvery").value = "25";

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

function applyCounts(document, { h, b, s, f = 0, w = 0, m = 0, blocks = 0, seed = 77 }) {
  document.getElementById("humanCount").value = String(h);
  document.getElementById("beastCount").value = String(b);
  document.getElementById("spiritCount").value = String(s);
  document.getElementById("fieldPatchCount").value = String(f);
  document.getElementById("wildPatchCount").value = String(w);
  document.getElementById("markPatchCount").value = String(m);
  document.getElementById("blockCount").value = String(blocks);
  document.getElementById("randomSeed").value = String(seed);
}

let loaded = loadSim();
let { sim, document } = loaded;

applyCounts(document, { h: 0, b: 0, s: 0, f: 0, w: 0, m: 0, blocks: 0, seed: 10 });
sim.applyInitialSettings();
let snapshot = sim.createSnapshotExport();
assert.deepEqual(snapshot.counts.units, { H: 0, B: 0, S: 0 }, "all species should allow zero initial units");
assert.equal(snapshot.counts.terrains.F, 0, "zero FIELD patches should create no FIELD terrain at tick 0");
assert.equal(snapshot.counts.terrains.W, 0, "zero WILD patches should create no WILD terrain at tick 0");
assert.equal(snapshot.counts.terrains.M, 0, "zero MARK patches should create no MARK terrain at tick 0");

applyCounts(document, { h: 1, b: 0, s: 0, f: 0, w: 0, m: 0, blocks: 0, seed: 11 });
sim.applyInitialSettings();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.H, 1, "Initial Humans = 1 should place exactly one Human");

applyCounts(document, { h: 0, b: 1, s: 0, f: 0, w: 0, m: 0, blocks: 0, seed: 12 });
sim.applyInitialSettings();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.B, 1, "Initial Beasts = 1 should place exactly one Beast");

applyCounts(document, { h: 0, b: 0, s: 1, f: 0, w: 0, m: 0, blocks: 0, seed: 13 });
sim.applyInitialSettings();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.S, 1, "Initial Spirits = 1 should place exactly one active Spirit");
assert.ok(snapshot.counts.terrains.M >= 1, "Spirit without MARK patches should create a tiny MARK trace");

applyCounts(document, { h: 20, b: 10, s: 0, f: 3, w: 5, m: 5, blocks: 0, seed: 14 });
sim.applyInitialSettings();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.S, 0, "Initial Spirits = 0 should place no active Spirits");
assert.ok(snapshot.counts.terrains.M > 0, "MARK patches should exist as latent traces without Spirits");

const initialRows = JSON.stringify(snapshot.world);
for (let i = 0; i < 50; i += 1) sim.stepWorld();
sim.resetToCurrentInitialWorld();
snapshot = sim.createSnapshotExport();
assert.equal(JSON.stringify(snapshot.world), initialRows, "Reset should restore the last generated initial state exactly");

const seedBefore = snapshot.initialSettings.randomSeed;
sim.applyInitialSettings({ randomizeSeed: true });
snapshot = sim.createSnapshotExport();
assert.notEqual(snapshot.initialSettings.randomSeed, seedBefore, "Randomize should generate a new seed");
assert.ok(Array.isArray(snapshot.world.fertilityRows), "Snapshot should include fertilityRows");
assert.equal(snapshot.initialSettings.initialHumans, 20, "Snapshot should include initialSettings");

sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.equal(recording.summary.initialSettings.initialBeasts, 10, "Recording summary should include initialSettings");

console.log("v0.6 initialization controls tests passed");
