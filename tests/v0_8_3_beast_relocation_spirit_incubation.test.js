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
    randomSeed: "883",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = true;

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
world[10][10] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.SPIRIT, 0, "manifestation", 3, 0, 8);
world[10][11] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 3);
let moved = sim.planMovements(world);
assert.equal(moved[10][10].unit, sim.UNIT.SPIRIT, "dormant Spirit should not move");
assert.equal(moved[10][10].terrain, sim.TERRAIN.EMPTY, "dormant Spirit should not leave MARK trail");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 3);
world[10][11] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.SPIRIT, 0, "manifestation", 3, 0, 8);
let lifecycle = sim.applyLifecycleDeath(world);
assert.equal(lifecycle[10][10].unit, sim.UNIT.HUMAN, "dormant Spirit should not infect or kill adjacent Human");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 3);
world[10][11] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.SPIRIT, 3, "manifestation", 3, 0, 8);
world[9][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 3);
let conflict = sim.applyConflict(world);
assert.equal(conflict[10][10].unit, sim.UNIT.HUMAN, "primary conflict should not directly convert Human to Spirit");

sim = loadSim(() => 0);
world = emptyWorld(sim, 1);
world[10][10] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.HUMAN, 101, "normal", 1);
lifecycle = sim.applyLifecycleDeath(world);
assert.equal(lifecycle[10][10].unit, null, "early old-age Human should still die when roll succeeds");
assert.equal(lifecycle[10][10].terrain, sim.TERRAIN.MARK, "early non-spirit Human death should become MARK, not Spirit");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 5, "pack", 4);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 3);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 3);
world[9][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 5, "normal", 3);
world[12][12] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4);
conflict = sim.applyConflict(world);
assert.equal(sim.countWorld(conflict).units.B, 1, "dispersed Beast should relocate when a target exists");
assert.equal(conflict[10][10].unit, null, "relocated Beast should leave original cell");

sim = loadSim(() => 0);
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 5, "pack", 4);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2);
let cleansed = sim.applyBeastAuraCleansing(world);
assert.equal(cleansed[10][11].terrain, sim.TERRAIN.WILD, "Beast should cleanse adjacent MARK without stepping onto it");

console.log("v0.8.3 beast relocation / spirit incubation tests passed");
