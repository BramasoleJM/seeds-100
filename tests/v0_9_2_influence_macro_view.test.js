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
    randomSeed: "902",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
    viewMode: "macro",
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

function countMaskCells(masks, className) {
  return masks.cellClasses.flat().filter((value) => value.includes(className)).length;
}

let loaded = loadSim(() => 0);
let sim = loaded.sim;
let world = emptyWorld(sim, 3);

for (const [x, y] of [[20, 12], [22, 12], [21, 14]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.BEAST, 5, "pack", 4);
}
for (const [x, y] of [[19, 12], [23, 12], [21, 13], [22, 15]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 4);
}

setInternalWorld(loaded, world, 25);
let masks = sim.buildMacroDisplayMasks(world);
const wildMaskCells = countMaskCells(masks, "macro-cell-wild");
assert.equal(masks.counts.wildRecovery, 1, "Macro View should show one Beast/WILD influence region even when pure WILD fragments are small");
assert.ok(wildMaskCells >= 18, "wild recovery influence should be a broad display region");
assert.ok(wildMaskCells < 180, "wild recovery influence should not paint most of the map");

let snapshot = sim.createSnapshotExport();
const recoveryRegion = snapshot.macroWorld.regions.find((region) => region.type === "beast_recovery_zone");
assert.ok(recoveryRegion, "macroWorld should detect Beast recovery from influence, not only pure WILD components");
assert.ok(recoveryRegion.metrics.influenceArea >= 18, "beast recovery metrics should include influenceArea");
assert.ok(recoveryRegion.metrics.beastCount >= 2, "beast recovery metrics should include local Beast count");

loaded = loadSim(() => 0);
sim = loaded.sim;
world = emptyWorld(sim, 3);
for (const [x, y] of [[10, 10], [11, 10], [10, 11]]) {
  world[y][x] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2);
}
masks = sim.buildMacroDisplayMasks(world);
assert.equal(masks.counts.spiritScars, 1, "clustered MARK influence should produce a scar mask even when pure MARK count is only 3");
assert.ok(countMaskCells(masks, "macro-cell-scar") >= 10, "scar influence should be expanded into a readable patch");

console.log("v0.9.2 influence macro view tests passed");
