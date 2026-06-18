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

function loadSim(seed = "10101") {
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
    humanCount: "36",
    beastCount: "24",
    spiritCount: "0",
    fieldPatchCount: "6",
    wildPatchCount: "6",
    markPatchCount: "3",
    blockCount: "12",
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

function settings(seed) {
  return {
    initialHumans: 36,
    initialBeasts: 24,
    initialSpirits: 0,
    initialFieldPatches: 6,
    initialWildPatches: 6,
    initialMarkPatches: 3,
    initialBlockCount: 12,
    randomSeed: seed,
    presetName: "Balanced Asymmetric Ecology Test",
  };
}

function exitCompatible(a, b) {
  return a === b;
}

function screenCellIdFor(layout, x, y) {
  const cell = layout.cells.find((item) =>
    x >= item.bounds.minX &&
    x <= item.bounds.maxX &&
    y >= item.bounds.minY &&
    y <= item.bounds.maxY
  );
  return cell ? cell.id : null;
}

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.match(indexHtml, /<option value="substrateMacro">Substrate \+ Macro View<\/option>/, "Substrate + Macro View should still exist");
assert.match(indexHtml, /id="interventionUnit"/, "runtime intervention selector should still exist");

let loaded = loadSim("10101");
let sim = loaded.sim;
const worldA = sim.createInitialWorld(settings(10101));
const worldB = sim.createInitialWorld(settings(10101));
const worldC = sim.createInitialWorld(settings(10102));

sim.resetWorld(worldA);
const snapshotA = sim.createSnapshotExport();
sim.resetWorld(worldB);
const snapshotB = sim.createSnapshotExport();
sim.resetWorld(worldC);
const snapshotC = sim.createSnapshotExport();

assert.deepEqual(snapshotA.world.regionBiasRows, snapshotB.world.regionBiasRows, "same seed should keep substrate rows deterministic");
assert.deepEqual(snapshotA.regionalSubstrate, snapshotB.regionalSubstrate, "same seed should keep screen-cell layout deterministic");
assert.notDeepEqual(snapshotA.regionalSubstrate.layout.cells.map((cell) => `${cell.archetype}:${cell.regionBias}`).join("|"), snapshotC.regionalSubstrate.layout.cells.map((cell) => `${cell.archetype}:${cell.regionBias}`).join("|"), "different seeds should be able to vary screen-cell layout");

assert.ok(["0.10.1", "0.10.2", "0.10.4"].includes(snapshotA.regionalSubstrate.version));
assert.equal(snapshotA.regionalSubstrate.layout.columns, 4);
assert.equal(snapshotA.regionalSubstrate.layout.rows, 3);
assert.equal(snapshotA.regionalSubstrate.layout.cells.length, 12);

for (const cell of snapshotA.regionalSubstrate.layout.cells) {
  assert.ok(cell.id, "screen cell should have id");
  assert.equal(typeof cell.gridX, "number");
  assert.equal(typeof cell.gridY, "number");
  assert.ok(cell.bounds && Number.isInteger(cell.bounds.minX) && Number.isInteger(cell.bounds.maxY), "screen cell should export bounds");
  assert.ok(cell.archetype, "screen cell should export archetype");
  assert.ok(["none", "basin", "refuge", "hollow"].includes(cell.regionBias), "screen cell should export valid regionBias");
  assert.ok(cell.exits && cell.exits.north && cell.exits.south && cell.exits.west && cell.exits.east, "screen cell should export four exits");
}

const byPos = new Map(snapshotA.regionalSubstrate.layout.cells.map((cell) => [`${cell.gridX},${cell.gridY}`, cell]));
for (const cell of snapshotA.regionalSubstrate.layout.cells) {
  const east = byPos.get(`${cell.gridX + 1},${cell.gridY}`);
  const south = byPos.get(`${cell.gridX},${cell.gridY + 1}`);
  if (east) assert.ok(exitCompatible(cell.exits.east, east.exits.west), "east/west exits should match");
  if (south) assert.ok(exitCompatible(cell.exits.south, south.exits.north), "south/north exits should match");
}

assert.ok(snapshotA.regionBiasCounts.basin > 0, "screen-cell substrate should include basin cells");
assert.ok(snapshotA.regionBiasCounts.refuge > 0, "screen-cell substrate should include refuge cells");
assert.ok(snapshotA.regionBiasCounts.hollow > 0, "screen-cell substrate should include hollow cells");
const blockCount = snapshotA.counts.terrains["#"];
assert.ok(blockCount >= 20, "screen-cell substrate should create visible BLOCK barriers");
assert.ok(blockCount < 220, "screen-cell substrate should not make the map mostly BLOCK");

const basinCells = snapshotA.regionalSubstrate.layout.cells.filter((cell) => cell.regionBias === "basin");
if (basinCells.length >= 2) {
  const occupiedBasinIds = new Set();
  snapshotA.world.unitRows.forEach((row, y) => {
    [...row].forEach((unit, x) => {
      if (unit === "H") {
        const id = screenCellIdFor(snapshotA.regionalSubstrate.layout, x, y);
        if (basinCells.some((cell) => cell.id === id)) occupiedBasinIds.add(id);
      }
    });
  });
  assert.ok(occupiedBasinIds.size >= 2, "initial Human placement should use multiple basin screen cells when available");
}

loaded = loadSim("10103");
sim = loaded.sim;
const custom = Array.from({ length: 25 }, () =>
  Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2))
);
custom[0][0] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
sim.resetWorld(custom);
loaded.document.getElementById("interventionUnit").value = "S";
loaded.document.getElementById("grid").children[1].click();
let snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[0][1], "S", "intervention should still place selected unit on non-BLOCK");
loaded.document.getElementById("interventionUnit").value = "B";
loaded.document.getElementById("grid").children[0].click();
snapshot = sim.createSnapshotExport();
assert.equal(snapshot.world.unitRows[0][0], ".", "intervention should still reject BLOCK cells");

console.log("v0.10.1 screen-cell substrate tests passed");
