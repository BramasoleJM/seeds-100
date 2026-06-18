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
    humanCount: "24",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "2",
    blockCount: "20",
    randomSeed: "7007",
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

function emptyWorld(sim, fertility = 2) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility))
  );
}

let sim = loadSim(() => 0.99);
let snapshot = sim.createSnapshotExport();
assert.deepEqual(Object.keys(snapshot.fertility.levels), ["0", "1", "2", "3", "4"], "fertility export should use discrete 0-4 levels");
assert.equal(typeof snapshot.world.fertilityRows[0], "string", "fertilityRows should be digit strings");
assert.match(snapshot.world.fertilityRows.join(""), /^[0-4]+$/, "fertilityRows should only contain 0-4 digits");

sim = loadSim(() => 0.99);
let world = emptyWorld(sim, 4);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.HUMAN, 1, "normal", 4);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.FIELD, "Human should found FIELD on fertile WILD");
assert.equal(snapshot.world.fertilityRows[10][10], "3", "FIELD should inherit land fertility and reduce it by one");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 100, "normal", 3);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
snapshot = sim.createSnapshotExport();
let frame = sim.createRecordingExport().frames.find((item) => item.tick === 1);
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8.3 early Human death should not create immediate Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "V0.8.3 early Human death should create MARK");
assert.equal(frame.events.spiritsCreatedByDeath, 0, "early grace should block death-created Spirit");

sim = loadSim(() => 0.99);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.BEAST, 1, "pack", 2);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.WILD, "Beast on MARK should clean it into WILD");
assert.equal(snapshot.world.fertilityRows[10][10], "4", "V0.8.2 Beast cleaning should raise fertility by two");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 5);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 5);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.S, 0, "V0.7.1 MARK should not passively spawn Spirit");

console.log("v0.7 rot-migration rebase tests passed");
