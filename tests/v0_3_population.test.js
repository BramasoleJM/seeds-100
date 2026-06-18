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

function loadSim({ movement = false, random = Math.random } = {}) {
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
  document.getElementById("movementToggle").checked = movement;
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
    Array.from({ length: 40 }, () => ({ terrain: sim.TERRAIN.EMPTY, unit: null }))
  );
}

function runOne(sim, world) {
  sim.resetWorld(world);
  sim.stepWorld();
  return sim.createSnapshotExport();
}

let sim = loadSim();
let world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.WILD, unit: null };
world[9][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[9][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][11] = { terrain: sim.TERRAIN.FIELD, unit: sim.UNIT.HUMAN };
let snapshot = runOne(sim, world);
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.5 Beast birth should require zero neighboring Humans");

sim = loadSim();
world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.WILD, unit: null };
world[9][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[9][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[9][11] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][9] = { terrain: sim.TERRAIN.BLOCK, unit: null };
world[10][11] = { terrain: sim.TERRAIN.BLOCK, unit: null };
world[11][9] = { terrain: sim.TERRAIN.BLOCK, unit: null };
world[11][10] = { terrain: sim.TERRAIN.BLOCK, unit: null };
world[11][11] = { terrain: sim.TERRAIN.BLOCK, unit: null };
snapshot = runOne(sim, world);
assert.equal(snapshot.world.unitRows[10][10], ".", "birth should require local room and low local unit count");

sim = loadSim();
world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.MARK, unit: null };
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x].terrain = sim.TERRAIN.MARK;
  }
}
world[9][9] = { terrain: sim.TERRAIN.MARK, unit: sim.UNIT.SPIRIT };
world[9][10] = { terrain: sim.TERRAIN.MARK, unit: sim.UNIT.SPIRIT };
snapshot = runOne(sim, world);
assert.equal(snapshot.world.unitRows[10][10], ".", "Spirit should not reproduce deep inside MARK without edge support");

sim = loadSim({ movement: true });
world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[9][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][11] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[11][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[9][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[11][11] = { terrain: sim.TERRAIN.FIELD, unit: null };
world[12][12] = { terrain: sim.TERRAIN.EMPTY, unit: sim.UNIT.BEAST };
const moved = sim.planMovements(world);
assert.equal(moved[11][11].unit, null, "movement should avoid target cells that would be over-clumped");

sim = loadSim();
world = emptyWorld(sim);
for (const [x, y] of [[10, 10], [9, 10], [10, 9], [11, 10], [10, 11], [9, 9]]) {
  world[y][x] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
}
snapshot = runOne(sim, world);
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8 dense Beast collapse should disperse, not create Spirit");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.WILD, "V0.8 Beast dispersal should restore WILD");

sim = loadSim({ random: () => 0 });
world = emptyWorld(sim);
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 70);
  }
}
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 70);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 70);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 70);
sim.resetWorld(world);
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
const frame = recording.frames.find((item) => item.tick === 1);
assert.equal(frame.events.births.H, 1, "recording should count Human births");
assert.deepEqual(Object.keys(frame.events.deaths), ["H", "B", "S"]);
assert.deepEqual(Object.keys(frame.events.conversions), ["H_to_S"]);

assert.equal("DEPLETED" in sim.TERRAIN, false, "V0.3 must not add DEPLETED terrain");

console.log("v0.3 population tests passed");
