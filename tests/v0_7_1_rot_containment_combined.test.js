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

function loadSim(random = () => 0, movement = false) {
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
    randomSeed: "711",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = movement;

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

let sim = loadSim(() => 0);
let world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 100, "normal", 3);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
let snapshot = sim.createSnapshotExport();
let frame = sim.createRecordingExport().frames.find((item) => item.tick === 1);
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8.3 early Human death should not create immediate Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "V0.8.3 early Human death should create MARK");
assert.equal(frame.events.spiritsCreatedByDeath, 0, "early grace should block death-created Spirit");
assert.equal(frame.events.spiritSpawnBlockedByEarlyGrace, 1, "early grace block should be counted");

sim = loadSim(() => 0, true);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 20);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 20);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.S, 0, "MARK should not passively spawn Spirit in V0.7.1");

sim = loadSim(() => 0, true);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.SPIRIT, 3, "manifestation", 3, 0, 7);
world[10][11] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "active Spirit movement should leave MARK trail");

sim = loadSim(() => 0.99);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.SPIRIT, 4, "manifestation", 3, 0, 5);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "Spirit should disappear when lifespan ends");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "Spirit death should leave MARK");

console.log("v0.7.1 rot containment combined tests passed");
