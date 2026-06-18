const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
  }

  toggle(name, force) {
    const classes = new Set((this.owner.className || "").split(/\s+/).filter(Boolean));
    if (force) classes.add(name);
    else classes.delete(name);
    this.owner.className = Array.from(classes).join(" ");
  }
}

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.value = "";
    this.checked = false;
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

  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "24",
    beastCount: "18",
    spiritCount: "0",
    fieldPatchCount: "3",
    wildPatchCount: "5",
    markPatchCount: "2",
    blockCount: "20",
    randomSeed: "903",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
    viewMode: "macro",
  })) {
    document.getElementById(id).value = value;
  }
  document.getElementById("movementToggle").checked = true;
  document.getElementById("macroOverlayToggle").checked = false;

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
    performance,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, context, document };
}

function emptyWorld(sim, fertility = 1) {
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

function buildLowFertilityBeastWorld(sim) {
  const world = emptyWorld(sim, 1);
  for (const [x, y] of [[18, 11], [20, 11], [22, 11], [19, 13], [21, 13], [23, 13]]) {
    world[y][x] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.BEAST, 12, "pack", 1);
  }
  for (const [x, y] of [
    [17, 11], [19, 11], [21, 11], [23, 11],
    [18, 12], [20, 12], [22, 12],
    [18, 14], [20, 14], [22, 14], [24, 14],
  ]) {
    world[y][x] = sim.createCell(sim.TERRAIN.WILD, null, 8, "normal", 1);
  }
  return world;
}

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.match(indexHtml, /id="macroOverlayToggle" type="checkbox"(?! checked)/, "Macro debug icon checkbox should be unchecked by default");
assert.match(indexHtml, /Show Macro Debug Icons/, "Macro overlay wording should identify debug icons");

const loaded = loadSim();
const sim = loaded.sim;
const activeWorld = buildLowFertilityBeastWorld(sim);
setInternalWorld(loaded, activeWorld, 25);

let snapshot = sim.createSnapshotExport();
let recoveryRegion = snapshot.macroWorld.regions.find((region) => region.type === "beast_recovery_zone");
assert.ok(recoveryRegion, "low-fertility Beast/WILD activity should still create a beast recovery region");
assert.equal(recoveryRegion.state, "active_recovery", "strong Beast/WILD score should be active recovery");
assert.ok(recoveryRegion.metrics.avgFertility < 2.5, "test fixture should prove the old average-fertility hard gate would fail");
assert.ok(recoveryRegion.metrics.recoveryScore >= 26, "beast recovery metrics should expose the soft score");

const quietWorld = emptyWorld(sim, 1);
setInternalWorld(loaded, quietWorld, 75);
snapshot = sim.createSnapshotExport();
recoveryRegion = snapshot.macroWorld.regions.find((region) => region.type === "beast_recovery_zone");
assert.ok(recoveryRegion, "recent Beast recovery region should be retained briefly when current influence dips");
assert.equal(recoveryRegion.state, "quiet_habitat", "retained region should become quiet before fading");
assert.equal(snapshot.macroWorld.display.masks.wildRecovery, 1, "display summary should count retained visible recovery regions");

const masks = sim.buildMacroDisplayMasks(quietWorld);
const retainedCells = countMaskCells(masks, "macro-cell-wild");
assert.ok(retainedCells > 0, "Macro View should draw retained recovery regions from macroWorld memory");
assert.ok(retainedCells < 180, "retained recovery region should not paint most of the map green");

setInternalWorld(loaded, quietWorld, 100);
snapshot = sim.createSnapshotExport();
recoveryRegion = snapshot.macroWorld.regions.find((region) => region.type === "beast_recovery_zone");
assert.ok(recoveryRegion, "retained Beast recovery region should last up to 100 ticks unseen");
assert.equal(recoveryRegion.state, "fading_recovery", "older retained region should enter fading state");

setInternalWorld(loaded, quietWorld, 126);
snapshot = sim.createSnapshotExport();
recoveryRegion = snapshot.macroWorld.regions.find((region) => region.type === "beast_recovery_zone");
assert.equal(recoveryRegion, undefined, "stale Beast recovery regions should not persist forever");

console.log("v0.9.3 macro view stability tests passed");
