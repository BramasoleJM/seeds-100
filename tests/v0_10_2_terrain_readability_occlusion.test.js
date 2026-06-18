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

  click() {
    if (this.listeners.click) this.listeners.click({ target: this, preventDefault() {} });
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function loadSim(seed = "10202") {
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
    humanCount: "30",
    beastCount: "22",
    spiritCount: "0",
    fieldPatchCount: "5",
    wildPatchCount: "5",
    markPatchCount: "3",
    blockCount: "18",
    randomSeed: seed,
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "1",
    viewMode: "substrateMacro",
    interventionUnit: "H",
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
  return { sim: context.window.__triSpeciesSim, document };
}

function emptyWorld(sim) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2))
  );
}

function wallWorld(sim) {
  const world = emptyWorld(sim);
  for (let y = 0; y < 25; y += 1) {
    world[y][5] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
  }
  return world;
}

const css = fs.readFileSync("style.css", "utf8");
assert.match(css, /\.grid\.macro-view \.terrain-block/, "Macro View should explicitly preserve BLOCK visuals");
assert.match(css, /\.grid\.substrate-view \.terrain-block/, "Substrate + Macro View should explicitly preserve BLOCK visuals");

let loaded = loadSim();
let sim = loaded.sim;
let world = wallWorld(sim);
world[10][2].unit = sim.UNIT.BEAST;
world[10][8].unit = sim.UNIT.SPIRIT;
world[11][8].terrain = sim.TERRAIN.MARK;
world[12][8].terrain = sim.TERRAIN.MARK;

assert.ok(sim.reachableCellsInRadius(world, 2, 10, 8).every((cell) => cell.x < 5), "reachable radius should not cross an unbroken BLOCK wall");
assert.equal(sim.countReachableUnitInRadius(world, 2, 10, sim.UNIT.SPIRIT, 8), 0, "reachable unit count should ignore units behind BLOCK");
assert.equal(sim.countReachableTerrainInRadius(world, 2, 10, sim.TERRAIN.MARK, 8), 0, "reachable terrain count should ignore terrain behind BLOCK");
assert.equal(sim.findReachableNearestRot(world, 2, 10, 8), null, "reachable nearest rot should ignore Spirit/MARK behind BLOCK");

world[10][5] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2);
assert.ok(sim.countReachableUnitInRadius(world, 2, 10, sim.UNIT.SPIRIT, 8) > 0, "opening a passage should make the far side reachable");
assert.ok(sim.findReachableNearestRot(world, 2, 10, 8), "opening a passage should make rot reachable");

world = wallWorld(sim);
for (let y = 0; y < 25; y += 1) {
  for (let x = 0; x < 5; x += 1) {
    world[y][x].fertility = 1;
  }
}
world[10][2].unit = sim.UNIT.HUMAN;
world[10][2].role = "settler_seeking_crisis";
world[10][8].terrain = sim.TERRAIN.WILD;
world[10][8].fertility = 4;
assert.equal(sim.findSettlerTarget(world, 2, 10), null, "settler target search should not choose fertile land behind an unbroken BLOCK wall");

world[10][5] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2);
assert.ok(sim.findSettlerTarget(world, 2, 10), "settler target search can choose through a real passage");

loaded = loadSim("10203");
sim = loaded.sim;
const generated = sim.createInitialWorld({
  initialHumans: 30,
  initialBeasts: 22,
  initialSpirits: 0,
  initialFieldPatches: 5,
  initialWildPatches: 5,
  initialMarkPatches: 3,
  initialBlockCount: 18,
  randomSeed: 10203,
  presetName: "Balanced Asymmetric Ecology Test",
});
sim.resetWorld(generated);
const snapshot = sim.createSnapshotExport();
const cells = snapshot.regionalSubstrate.layout.cells;
assert.ok(["0.10.2", "0.10.4"].includes(snapshot.regionalSubstrate.version));
assert.ok(cells.every((cell) => Number.isInteger(cell.blockCount)), "regionalSubstrate cells should export blocker counts");
assert.ok(new Set(cells.map((cell) => cell.blockCount)).size >= 3, "screen-cell blocker silhouettes should vary across cells");
assert.ok(snapshot.counts.terrains["#"] >= 24, "generated map should keep visible BLOCK geography");
assert.ok(snapshot.counts.terrains["#"] < 240, "generated map should not become mostly BLOCK");

loaded.document.getElementById("viewMode").value = "substrateMacro";
sim.resetWorld(generated);
const blockIndex = snapshot.world.terrainRows.join("").indexOf("#");
const blockEl = loaded.document.getElementById("grid").children[blockIndex];
assert.ok(blockEl.className.includes("terrain-block"), "BLOCK cell should keep terrain-block class in Substrate + Macro View");
assert.ok(blockEl.className.includes("screen-edge") || blockEl.className.includes("region-"), "Substrate view should keep geography classes around BLOCK");

loaded.document.getElementById("interventionUnit").value = "S";
const openIndex = snapshot.world.terrainRows.join("").indexOf(".");
loaded.document.getElementById("grid").children[openIndex].click();
let afterIntervention = sim.createSnapshotExport();
assert.equal(afterIntervention.world.unitRows.join("")[openIndex], "S", "intervention should still place selected unit on non-BLOCK");
loaded.document.getElementById("interventionUnit").value = "B";
loaded.document.getElementById("grid").children[blockIndex].click();
afterIntervention = sim.createSnapshotExport();
assert.equal(afterIntervention.world.unitRows.join("")[blockIndex], ".", "intervention should still reject BLOCK cells");

console.log("v0.10.2 terrain readability / occlusion tests passed");
