const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.title = "";
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
    if (this.listeners.click) this.listeners.click();
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
  };

  document.getElementById("speed").value = "180";
  document.getElementById("movementToggle").checked = true;
  document.getElementById("humanCount").value = "32";
  document.getElementById("beastCount").value = "32";
  document.getElementById("spiritCount").value = "24";
  document.getElementById("overcrowding").value = "6";
  document.getElementById("keyframeEvery").value = "25";

  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    },
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
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return context.window.__triSpeciesSim;
}

const sim = loadSim();

assert.equal(typeof sim.countWorld, "function");
assert.equal(typeof sim.createSnapshotExport, "function");
assert.equal(typeof sim.startRecording, "function");
assert.equal(typeof sim.stopRecording, "function");
assert.equal(typeof sim.clearRecording, "function");
assert.equal(typeof sim.recordFrame, "function");
assert.equal(typeof sim.createRecordingExport, "function");

const snapshot = sim.createSnapshotExport();
assert.equal(snapshot.type, "tri_species_snapshot");
assert.equal(snapshot.version, "0.1");
assert.equal(snapshot.params.gridWidth, 40);
assert.equal(snapshot.params.gridHeight, 25);
assert.equal(snapshot.initialSettings.initialHumans, 32);
assert.equal(snapshot.initialSettings.initialBeasts, 32);
assert.equal(snapshot.initialSettings.initialSpirits, 24);
assert.equal(snapshot.world.terrainRows.length, 25);
assert.equal(snapshot.world.unitRows.length, 25);
assert.equal(snapshot.world.fertilityRows.length, 25);
assert.equal(snapshot.world.terrainRows[0].length, 40);
assert.equal(snapshot.world.unitRows[0].length, 40);
assert.equal(snapshot.counts.units.H, 32);
assert.equal(snapshot.counts.units.B, 32);
assert.equal(snapshot.counts.units.S, 24);

sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stepWorld();
sim.stopRecording();

const recording = sim.createRecordingExport();
assert.equal(recording.type, "tri_species_recording");
assert.equal(recording.version, "0.1");
assert.equal(recording.sampleEvery, 1);
assert.equal(recording.keyframeEvery, 25);
assert.ok(recording.frames.length >= 3);
assert.equal(recording.frames[0].tick, 0);
assert.equal(recording.startTick, 0);
assert.equal(recording.endTick, 2);
assert.equal(recording.summary.initialSettings.initialHumans, 32);
assert.deepEqual(Object.keys(recording.summary.extinctionTick), ["H", "B", "S"]);
assert.ok(recording.keyframes.length >= 1);
assert.equal(recording.keyframes[0].terrainRows.length, 25);
assert.equal(recording.keyframes[0].unitRows.length, 25);

console.log("json export tests passed");
