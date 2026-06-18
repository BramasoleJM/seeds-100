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
    this.className = "";
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
    randomSeed: "884",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = false;
  document.getElementById("macroOverlayToggle").checked = true;

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
  return { sim: context.window.__triSpeciesSim, context };
}

function emptyWorld(sim, fertility = 3) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility))
  );
}

function setInternalWorld(loaded, world, tick = 0) {
  loaded.context.__testWorld = world;
  loaded.context.__testTick = tick;
  vm.runInContext("world = __testWorld; tick = __testTick;", loaded.context);
}

let loaded = loadSim(() => 0.1);
let sim = loaded.sim;
let world = emptyWorld(sim, 3);
for (const [x, y] of [[10, 10], [9, 10], [10, 9], [8, 10], [10, 8], [8, 8], [12, 10]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3);
}
world[9][10].unit = sim.UNIT.HUMAN;
world[10][9].unit = sim.UNIT.HUMAN;
let reproduced = sim.applyReproduction(world);
assert.equal(reproduced[10][10].unit, null, "low-core FIELD birth chance should be reduced below a 0.10 roll");

loaded = loadSim(() => 0.13);
sim = loaded.sim;
world = emptyWorld(sim, 1);
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 1);
  }
}
world[10][10].role = "normal";
let settlers = sim.applySettlerSpawns(world);
assert.equal(settlers[10][10].role, "settler_seeking_crisis", "depleted crowding should create crisis migration pressure at a 0.13 roll");

loaded = loadSim(() => 0.01);
sim = loaded.sim;
world = emptyWorld(sim, 3);
for (const [x, y] of [[10, 10], [9, 10], [10, 9], [11, 10], [10, 11], [9, 9]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4, 31);
}
let decayed = sim.applyTerrainDecay(world);
assert.equal(decayed[10][10].terrain, sim.TERRAIN.WILD, "dense fertile WILD core should not decay at a 0.01 roll");

loaded = loadSim(() => 0.08);
sim = loaded.sim;
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 16);
decayed = sim.applyTerrainDecay(world);
assert.equal(decayed[10][10].terrain, sim.TERRAIN.EMPTY, "isolated MARK should decay quickly at a 0.08 roll");

loaded = loadSim(() => 0.02);
sim = loaded.sim;
world = emptyWorld(sim, 3);
for (const [x, y] of [[10, 10], [9, 10], [10, 9], [11, 10], [10, 11]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 1, 16);
}
decayed = sim.applyTerrainDecay(world);
assert.equal(decayed[10][10].terrain, sim.TERRAIN.MARK, "clustered low-fertility MARK should persist as a readable scar at a 0.02 roll");

loaded = loadSim(() => 0);
sim = loaded.sim;
world = emptyWorld(sim, 3);
for (const [x, y] of [[5, 5], [6, 5], [7, 5], [8, 5]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "settler_seeking_crisis", 3);
}
setInternalWorld(loaded, world, 0);
sim.analyzeMacroWorldNow();
world = emptyWorld(sim, 3);
setInternalWorld(loaded, world, 90);
let snapshot = sim.createSnapshotExport();
const oldRoute = snapshot.macroWorld.routes.find((route) => route.type === "migration_route");
assert.ok(oldRoute, "route memory should remain after settler samples stop");
assert.notEqual(oldRoute.state, "active_route", "route should not remain active after 75 inactive ticks");

loaded = loadSim(() => 0);
sim = loaded.sim;
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 4, "manifestation", 3);
setInternalWorld(loaded, world, 0);
sim.analyzeMacroWorldNow();
world = emptyWorld(sim, 3);
for (const [x, y] of [[10, 10], [9, 10], [10, 9], [11, 10], [10, 11]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2);
}
setInternalWorld(loaded, world, 80);
snapshot = sim.createSnapshotExport();
const scarEvent = snapshot.macroWorld.events.find((event) => event.type === "spirit_outbreak" || event.type === "spirit_scar");
assert.ok(scarEvent, "old Spirit outbreak should remain as aftermath/scar evidence when clustered MARK remains");
assert.notEqual(scarEvent.state, "active_outbreak", "Spirit outbreak should not remain active after Spirit disappears");

console.log("v0.8.4 readable macro pattern tests passed");
