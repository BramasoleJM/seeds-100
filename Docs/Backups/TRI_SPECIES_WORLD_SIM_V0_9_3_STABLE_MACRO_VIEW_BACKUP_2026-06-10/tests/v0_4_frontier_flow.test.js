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

function loadSim({ movement = true, random = () => 0 } = {}) {
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

let sim = loadSim({ random: () => 0 });
let world = emptyWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 3);
world[10][9] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 3);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 5);
let moved = sim.planMovements(world);
assert.equal(moved[10][10].unit, null, "V0.8 Beast should random-walk instead of always targeting a single MARK");

sim = loadSim({ random: () => 0 });
world = emptyWorld(sim);
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x].terrain = sim.TERRAIN.WILD;
  }
}
world[10][10] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][9] = { terrain: sim.TERRAIN.WILD, unit: sim.UNIT.BEAST };
world[10][11] = { terrain: sim.TERRAIN.EMPTY, unit: null };
moved = sim.planMovements(world);
assert.equal(moved[10][10].unit, null, "V0.7 Beast should random-walk instead of auto-staying in WILD");

sim = loadSim({ movement: false });
world = emptyWorld(sim);
for (let y = 9; y <= 11; y += 1) {
  for (let x = 9; x <= 11; x += 1) {
    world[y][x].terrain = sim.TERRAIN.WILD;
  }
}
world[10][10].unit = null;
world[9][9].unit = sim.UNIT.BEAST;
sim.resetWorld(world);
sim.stepWorld();
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[10][10], sim.UNIT.BEAST, "V0.8.2 dispersed Beast reproduction can occur with exactly 1 neighboring Beast when roll succeeds");

sim = loadSim({ movement: false, random: () => 0 });
world = emptyWorld(sim);
world[10][10] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 45);
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 70);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 70);
world[11][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 70);
world[11][11] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 70);
sim.resetWorld(world);
sim.stepWorld();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.terrainRows[10][10], sim.TERRAIN.BORDER, "contested empty cell should be able to form BORDER");

sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
const frame = recording.frames.find((item) => item.tick === 2);
assert.ok(frame.diagnostics, "recording frames should include anti-deadlock diagnostics");
assert.deepEqual(Object.keys(frame.diagnostics.birthCandidates), ["H", "B", "S"]);
assert.equal(typeof frame.diagnostics.actualMoves.H, "number");
assert.equal(typeof frame.diagnostics.frontierUnits.B, "number");
assert.equal(typeof frame.diagnostics.borderCandidates, "number");

assert.equal("DEPLETED" in sim.TERRAIN, false, "V0.4 must not add DEPLETED terrain");

console.log("v0.4 frontier-flow tests passed");
