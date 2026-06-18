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

function emptyWorld(sim) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null))
  );
}

let sim = loadSim(() => 0);
let world = emptyWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 90);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8.3 early old Human death should not create immediate Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.MARK, "V0.8.3 early old Human death should leave MARK");
let frame = sim.createRecordingExport().frames.find((item) => item.tick === 1);
assert.equal(frame.events.naturalDeaths.H, 1, "recording should count natural Human death");

sim = loadSim(() => 0);
world = emptyWorld(sim);
for (const [x, y] of [[10, 10], [9, 10], [10, 9], [11, 10], [10, 11]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 1);
}
world[9][9] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 1);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.counts.units.H, 5, "V0.6 settler departure should not create a new Human");
assert.equal(snapshot.roles[10][10].startsWith("settler_seeking"), true, "pressured Human field cluster should mark an existing Human as seeking settler");

sim = loadSim(() => 0.99);
world = emptyWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, null);
world[9][9] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 10);
world[9][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 10);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "Beast reproduction should be probabilistic and fail on high roll");

sim = loadSim(() => 0);
world = emptyWorld(sim);
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 70);
  }
}
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 3, 5);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 3, 5);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.7.1 MARK should not passively manifest Spirit");
frame = sim.createRecordingExport().frames.find((item) => item.tick === 1);
assert.equal(frame.events.spiritManifestations, 0, "V0.7.1 should not count MARK-spawned Spirit manifestations");

sim = loadSim(() => 0.99);
world = emptyWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 8, "manifestation", 2, 0, 8);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.7 Spirit should fade when its short lifespan ends");

assert.equal("DEPLETED" in sim.TERRAIN, false, "V0.5 must not add DEPLETED terrain");

console.log("v0.5 lifecycle/group tests passed");
