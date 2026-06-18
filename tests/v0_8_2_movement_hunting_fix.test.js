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
    randomSeed: "882",
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

function emptyWorld(sim, fertility = 2) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility))
  );
}

let sim = loadSim(() => 0);
let world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 4, "settler_seeking_crisis", 3);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 4, "normal", 3);
world[10][11] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4);
let moved = sim.planMovements(world);
assert.equal(moved[10][10].unit, null, "settler with suffix should not be trapped by normal FIELD stay logic");
assert.equal(moved[10][11].unit, sim.UNIT.HUMAN, "settler with suffix should move toward fertile WILD");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.HUMAN, 2, "settler_seeking_prosperity", 4);
world[10][9] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3);
world[9][10] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3);
let founded = sim.applyTerrainRewrite(world);
assert.equal(founded[10][10].terrain, sim.TERRAIN.FIELD, "founding should recognize settler role suffixes");
assert.equal(founded[10][10].role, "normal", "founding should return the settler to normal role");

sim = loadSim(() => 0);
world = emptyWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 4, "normal", 3);
world[10][9] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 4, "normal", 3);
world[9][10] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 4, "normal", 3);
world[10][12] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 4, "pack", 4);
world[10][11] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4);
moved = sim.planMovements(world);
let humansAdjacentToBeast = 0;
for (let y = 0; y < moved.length; y += 1) {
  for (let x = 0; x < moved[y].length; x += 1) {
    if (moved[y][x].unit !== sim.UNIT.BEAST) continue;
    humansAdjacentToBeast += sim.countNeighborUnits(moved, x, y).H;
  }
}
assert.ok(humansAdjacentToBeast > 0, "grouped Humans should be able to approach Beast pressure");

sim = loadSim(() => 0);
world = emptyWorld(sim, 4);
world[10][11] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 4, "pack", 4);
world[11][11] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 4, "pack", 4);
world[10][12] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4);
let reproduction = sim.applyReproduction(world);
assert.equal(reproduction[10][12].unit, null, "Beast birth should require exactly one neighboring Beast");

{
  const values = [0.1, 0.99];
  sim = loadSim(() => values.length ? values.shift() : 0.99);
}
world = emptyWorld(sim, 4);
world[10][10] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.BEAST, 4, "pack", 4);
let rewritten = sim.applyTerrainRewrite(world);
assert.equal(rewritten[10][10].terrain, sim.TERRAIN.EMPTY, "Beast fertility restore should not always paint EMPTY into WILD");

console.log("v0.8.2 movement/hunting fix tests passed");
