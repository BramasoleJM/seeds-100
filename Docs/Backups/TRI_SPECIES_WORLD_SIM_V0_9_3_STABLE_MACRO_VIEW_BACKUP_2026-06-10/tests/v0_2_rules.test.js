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
  document.getElementById("movementToggle").checked = false;
  document.getElementById("humanCount").value = "32";
  document.getElementById("beastCount").value = "32";
  document.getElementById("spiritCount").value = "24";
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
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document };
}

function emptyWorld(sim) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null))
  );
}

function runOne(world, sim) {
  sim.resetWorld(world);
  sim.stepWorld();
  return sim.createSnapshotExport();
}

let loaded = loadSim();
let sim = loaded.sim;
let world = emptyWorld(sim);
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.FIELD, null);
  }
}
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.BEAST, 1, "pack");
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1);
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1);
let snapshot = runOne(world, sim);
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.WILD, "V0.8 Beast dispersal should return pressure cell to WILD");
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.8 Beast dispersal should not create Spirit");

loaded = loadSim();
sim = loaded.sim;
world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.FIELD, unit: sim.UNIT.HUMAN };
world[9][10] = { terrain: sim.TERRAIN.FIELD, unit: sim.UNIT.HUMAN };
world[10][9] = { terrain: sim.TERRAIN.FIELD, unit: sim.UNIT.HUMAN };
world[9][9] = { terrain: sim.TERRAIN.MARK, unit: sim.UNIT.SPIRIT };
world[11][11] = { terrain: sim.TERRAIN.MARK, unit: null };
snapshot = runOne(world, sim);
assert.equal(snapshot.world.unitRows[10][10], sim.UNIT.HUMAN, "supported Human should survive Spirit pressure");
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.FIELD, "supported Human should not create BORDER under Spirit pressure");

loaded = loadSim();
sim = loaded.sim;
world = emptyWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 3);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 3);
world[9][9] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 3);
world[11][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 3);
snapshot = runOne(world, sim);
assert.equal(snapshot.world.unitRows[10][10], sim.UNIT.HUMAN, "MARK without neighboring Spirit should not convert Human");

loaded = loadSim();
sim = loaded.sim;
world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.WILD, unit: null };
world[9][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
snapshot = runOne(world, sim);
assert.equal(snapshot.world.unitRows[10][10], ".", "V0.5 Beast reproduction is rare and should not be treated as guaranteed");

loaded = loadSim();
sim = loaded.sim;
world = emptyWorld(sim);
world[10][10] = { terrain: sim.TERRAIN.WILD, unit: null };
snapshot = runOne(world, sim);
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.WILD, "V0.7 WILD should persist as restored fertile land without immediate Beast support");

console.log("v0.2 rule tests passed");
