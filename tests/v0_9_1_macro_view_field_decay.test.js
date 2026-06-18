const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
  }

  add(...names) {
    const classes = new Set((this.owner.className || "").split(/\s+/).filter(Boolean));
    for (const name of names) classes.add(name);
    this.owner.className = Array.from(classes).join(" ");
  }

  remove(...names) {
    const removeSet = new Set(names);
    this.owner.className = (this.owner.className || "")
      .split(/\s+/)
      .filter((name) => name && !removeSet.has(name))
      .join(" ");
  }

  toggle(name, force) {
    if (force) this.add(name);
    else this.remove(name);
  }

  contains(name) {
    return (this.owner.className || "").split(/\s+/).includes(name);
  }
}

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
    this.classList = new FakeClassList(this);
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
    randomSeed: "901",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
    viewMode: "cell",
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
  return { sim: context.window.__triSpeciesSim, context, document };
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

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.ok(indexHtml.includes('id="viewMode"'), "index.html should expose a View Mode control");
assert.ok(indexHtml.includes('value="macro"'), "View Mode control should include Macro View");

let loaded = loadSim(() => 0.05);
let sim = loaded.sim;
let world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 1, 25);
let decayed = sim.applyTerrainDecay(world);
assert.equal(decayed[10][10].terrain, sim.TERRAIN.EMPTY, "old FIELD without Humans in radius 2 should decay toward EMPTY");

loaded = loadSim(() => 0.03);
sim = loaded.sim;
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 0, 25);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 12);
world[11][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 12);
decayed = sim.applyTerrainDecay(world);
assert.equal(decayed[10][10].terrain, sim.TERRAIN.MARK, "haunted abandoned FIELD should be able to become MARK residue");

loaded = loadSim(() => 0);
sim = loaded.sim;
world = emptyWorld(sim, 3);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 5, "pack", 4);
world[10][11] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2, 12);
world[11][10] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3, 0);
let cleansed = sim.applyBeastAuraCleansing(world);
const recoveryEvents = vm.runInContext("currentTickEvents.beastRecoveryPatchCreated", loaded.context);
assert.ok(sim.countWorld(cleansed).terrains.W >= 2, "Beast cleansing should create a small extra WILD recovery patch");
assert.equal(recoveryEvents, 1, "Beast recovery patch creation should be counted");

loaded = loadSim(() => 0);
sim = loaded.sim;
world = emptyWorld(sim, 3);
for (let y = 7; y <= 10; y += 1) {
  for (let x = 7; x <= 10; x += 1) {
    world[y][x] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3, 5);
  }
}
world[8][8].unit = sim.UNIT.HUMAN;
world[8][9].unit = sim.UNIT.HUMAN;
world[9][8].unit = sim.UNIT.HUMAN;
setInternalWorld(loaded, world, 0);
loaded.document.getElementById("viewMode").value = "macro";
sim.resetWorld(world);
const masks = sim.buildMacroDisplayMasks(world);
assert.equal(masks.counts.settlements, 1, "Macro View masks should detect one settlement region");
const snapshot = sim.createSnapshotExport();
assert.equal(snapshot.macroWorld.display.viewModes[1], "macro", "macroWorld export should describe view modes");
assert.equal(snapshot.macroWorld.display.masks.settlements, 1, "macroWorld display summary should include settlement mask count");
const grid = loaded.document.getElementById("grid");
assert.ok(grid.className.includes("macro-view"), "grid should enter macro-view class when Macro View is selected");
assert.ok(Array.from(grid.children).some((cell) => cell.className.includes("macro-cell-settlement")), "Macro View should mark settlement cells with a macro class");

console.log("v0.9.1 macro view / field decay tests passed");
