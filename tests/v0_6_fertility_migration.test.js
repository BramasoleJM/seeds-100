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

  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  set innerHTML(value) { this._innerHTML = value; if (value === "") this.children = []; }
  get innerHTML() { return this._innerHTML; }
}

function loadSim(random = () => 0) {
  const elements = new Map();
  const document = {
    body: new FakeElement(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement() { return new FakeElement(); },
    addEventListener() {},
  };
  document.getElementById("speed").value = "180";
  document.getElementById("movementToggle").checked = false;
  document.getElementById("humanCount").value = "32";
  document.getElementById("beastCount").value = "32";
  document.getElementById("spiritCount").value = "24";
  document.getElementById("overcrowding").value = "6";
  document.getElementById("keyframeEvery").value = "25";
  const mathObject = Object.create(Math);
  mathObject.random = random;
  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {},
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
    setInterval() { return 1; },
    clearInterval() {},
    Math: mathObject,
    Date,
    performance,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return context.window.__triSpeciesSim;
}

function emptyWorld(sim, fertility = 2) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility))
  );
}

let sim = loadSim(() => 0);
let world = emptyWorld(sim, 0);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 100, "normal", 0);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8.3 early Human decline should not create immediate Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "V0.8.3 early Human decline should create MARK");
let frame = sim.createRecordingExport().frames.find((item) => item.tick === 1);
assert.ok(frame.fertility && frame.fertility.levels, "recording frame should include discrete fertility stats");
assert.equal(frame.events.naturalDeaths.H, 1, "poor fertility decline should count as natural death");

sim = loadSim(() => 0);
world = emptyWorld(sim, 4);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 4);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 4);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 4);
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 4);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], sim.UNIT.HUMAN, "Human birth should happen on fertile FIELD when birth roll succeeds");

sim = loadSim(() => 0);
world = emptyWorld(sim, 1);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 1);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 1);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 1);
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 1);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "Human birth should require sufficient fertility");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 3);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.fertilityRows[10][10], "4", "Beast should restore fertility on its cell");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 5);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 5);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.7.1 MARK should not passively create Spirit");

assert.equal("DEPLETED" in sim.TERRAIN, false, "V0.6 must not add DEPLETED terrain");

console.log("v0.6 fertility/migration tests passed");
