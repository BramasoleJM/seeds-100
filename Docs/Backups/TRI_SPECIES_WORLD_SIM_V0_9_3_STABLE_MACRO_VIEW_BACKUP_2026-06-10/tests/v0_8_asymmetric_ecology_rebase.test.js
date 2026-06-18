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

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim(random = () => 0) {
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
    humanCount: "32",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "1",
    blockCount: "20",
    randomSeed: "808",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = false;

  const mathObject = Object.create(Math);
  mathObject.random = random;
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
    Math: mathObject,
    Date,
    performance,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return context.window.__triSpeciesSim;
}

function emptyWorld(sim, fertility = 3) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility))
  );
}

let sim = loadSim(() => 0);
let world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 200, "pack", 3);
sim.resetWorld(world);
sim.stepWorld();
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], sim.UNIT.BEAST, "Beast should not naturally die from age");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.BEAST, 1, "pack", 2);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 3);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 3);
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 3);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
snapshot = sim.createSnapshotExport();
let frame = sim.createRecordingExport().frames.find((item) => item.tick === 1);
assert.equal(snapshot.world.unitRows[10][10], ".", "driven-away Beast should leave the cell");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.WILD, "Beast dispersal should return the cell to WILD");
assert.equal(snapshot.world.fertilityRows[10][10], "4", "Beast dispersal should restore fertility to 4");
assert.equal(frame.events.spiritsCreatedByBeastDeath, 0, "Beast dispersal must not create Spirit");
assert.equal(frame.events.beastDispersals, 1, "Beast dispersal should be counted");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 100, "normal", 3);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8.3 early natural death should not create Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "V0.8.3 early natural death should create MARK");

{
  const rolls = [0, 0.99];
  sim = loadSim(() => rolls.length ? rolls.shift() : 0.99);
}
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 100, "normal", 3);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "Human natural death can become MARK instead of Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "Human natural death that does not create Spirit should create MARK");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
for (const [x, y] of [[10, 10], [9, 10], [11, 10], [10, 9], [10, 11]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 3);
}
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.SPIRIT, 1, "manifestation", 3, 0, 5);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], sim.UNIT.HUMAN, "core Human should resist Spirit infection");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 30);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 30);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.S, 0, "MARK should still not spawn Spirit in V0.8");

console.log("v0.8 asymmetric ecology rebase tests passed");
