const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class FakeClassList {
  constructor(owner) { this.owner = owner; }
  toggle(name, force) {
    const classes = new Set((this.owner.className || "").split(/\s+/).filter(Boolean));
    if (force) classes.add(name);
    else classes.delete(name);
    this.owner.className = Array.from(classes).join(" ");
  }
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.textContent = "";
    this.title = "";
    this.value = "";
    this.checked = false;
    this.listeners = {};
    this._innerHTML = "";
    this.className = "";
    this.classList = new FakeClassList(this);
  }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  click() {}
  set innerHTML(value) { this._innerHTML = value; if (value === "") this.children = []; }
  get innerHTML() { return this._innerHTML; }
}

function loadSim() {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) { return new FakeElement(tagName); },
    addEventListener(name, fn) { this.body.addEventListener(name, fn); },
  };
  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "0",
    beastCount: "0",
    spiritCount: "0",
    fieldPatchCount: "0",
    wildPatchCount: "0",
    markPatchCount: "0",
    blockCount: "0",
    randomSeed: "1311",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode: "cell",
    interventionUnit: "",
    mapSeedBrush: "",
    mapSeedJson: "",
  })) document.getElementById(id).value = value;
  document.getElementById("movementToggle").checked = true;
  document.getElementById("lineageToggle").checked = true;
  document.getElementById("macroOverlayToggle").checked = true;
  const context = {
    console,
    document,
    window: {},
    Blob: class Blob {},
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
    setInterval() { return 1; },
    clearInterval() {},
    Math,
    Date,
    performance,
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document };
}

function hasPoint(points, x, y) {
  return points.some((point) => point.x === x && point.y === y);
}

const { sim, document } = loadSim();

sim.clearMapSeedForTest();
let result = sim.paintMapSeedBrushForTest(7, 7, "mountain");
let seed = sim.getActiveMapSeedForTest();
let world = sim.getWorldForTest();
assert.equal(result.painted, true, "mountain brush should report a paint action");
assert.equal(hasPoint(seed.mountains, 7, 7), true, "mountain brush should update active seed");
assert.equal(world[7][7].terrain, sim.TERRAIN.BLOCK, "mountain brush should update current world immediately");
assert.ok(document.getElementById("mapSeedJson").value.includes('"x": 7'), "seed JSON should sync immediately");
assert.equal(document.getElementById("statusMessage").textContent, "Painted Mountain at 7,7.", "paint status should be direct");

sim.paintMapSeedBrushForTest(8, 7, "river");
seed = sim.getActiveMapSeedForTest();
world = sim.getWorldForTest();
assert.equal(hasPoint(seed.rivers, 8, 7), true, "river brush should update active seed");
assert.equal(hasPoint(sim.getMapFeaturesForTest().rivers, 8, 7), true, "river brush should update mapFeatures immediately");
assert.notEqual(world[7][8].terrain, "WATER", "river brush must not create WATER terrain");
assert.equal(sim.isCellBlockedForMovementForTest(world, 8, 7, []), true, "live river should block movement");

sim.paintMapSeedBrushForTest(9, 7, "H");
sim.paintMapSeedBrushForTest(10, 7, "B");
sim.paintMapSeedBrushForTest(11, 7, "S");
world = sim.getWorldForTest();
assert.equal(world[7][9].unit, sim.UNIT.HUMAN, "Human brush should set unit immediately");
assert.equal(world[7][9].terrain, sim.TERRAIN.FIELD, "Human brush should set FIELD terrain immediately");
assert.equal(world[7][10].unit, sim.UNIT.BEAST, "Beast brush should set unit immediately");
assert.equal(world[7][10].terrain, sim.TERRAIN.WILD, "Beast brush should set WILD terrain immediately");
assert.equal(world[7][11].unit, sim.UNIT.SPIRIT, "Spirit brush should set unit immediately");
assert.equal(world[7][11].terrain, sim.TERRAIN.MARK, "Spirit brush should set MARK terrain immediately");

sim.paintMapSeedBrushForTest(12, 7, "spring");
assert.ok(sim.getWorldPOIsForTest().some((poi) => poi.x === 12 && poi.y === 7 && poi.type === sim.POI_TYPES.SPRING), "POI brush should create live POI");

for (const [x, y] of [[7, 7], [8, 7], [9, 7], [12, 7]]) {
  sim.paintMapSeedBrushForTest(x, y, "erase");
}
seed = sim.getActiveMapSeedForTest();
world = sim.getWorldForTest();
assert.equal(world[7][7].terrain === sim.TERRAIN.BLOCK, false, "erase should restore mountain cell to passable terrain");
assert.equal(hasPoint(seed.rivers, 8, 7), false, "erase should remove river from seed");
assert.equal(hasPoint(sim.getMapFeaturesForTest().rivers, 8, 7), false, "erase should remove river feature immediately");
assert.equal(world[7][9].unit, null, "erase should remove seeded unit immediately");
assert.equal(sim.getWorldPOIsForTest().some((poi) => poi.x === 12 && poi.y === 7), false, "erase should remove POI centered at cell");

const fakeExploreCell = { dataset: { worldX: "22", worldY: "14" } };
assert.deepEqual(sim.cellWorldPositionFromElementForTest(fakeExploreCell, 3), { x: 22, y: 14 }, "cell mapping should prefer dataset world coordinates");
assert.deepEqual(sim.cellWorldPositionFromElementForTest({ dataset: {} }, 3), { x: 3, y: 0 }, "cell mapping should fall back to index for full-grid cells");
document.getElementById("mapSeedBrush").value = "mountain";
sim.handleGridCellClickForTest(3, fakeExploreCell);
seed = sim.getActiveMapSeedForTest();
assert.equal(hasPoint(seed.mountains, 22, 14), true, "click handling should paint the cell's world coordinate");
assert.equal(hasPoint(seed.mountains, 3, 0), false, "click handling should not paint index fallback when dataset exists");

sim.clearMapSeedForTest();
const painted = sim.paintMapSeedDragSequenceForTest([
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
], "river");
seed = sim.getActiveMapSeedForTest();
assert.equal(painted, 3, "drag paint should skip duplicate same-cell writes");
assert.equal(seed.rivers.length, 3, "drag paint should apply multiple cells");

const randomSeed = sim.generateRandomMapSeedPresetForTest();
assert.ok(randomSeed.rivers.length > 0, "random preset should include a river");
assert.ok(randomSeed.mountains.length > 0, "random preset should include mountains");
assert.ok(randomSeed.units.length > 0, "random preset should include units");
assert.ok(randomSeed.pois.some((poi) => poi.type === sim.POI_TYPES.SPRING), "random preset should include spring");
assert.ok(randomSeed.pois.some((poi) => poi.type === sim.POI_TYPES.ROT_SOURCE), "random preset should include rot source");
assert.ok(randomSeed.pois.some((poi) => poi.type === sim.POI_TYPES.GREAT_FOREST), "random preset should include great forest");
assert.ok(randomSeed.pois.some((poi) => poi.type === sim.POI_TYPES.MONUMENT), "random preset should include monument");
assert.equal(sim.getMapFeaturesForTest().rivers.length > 0, true, "random preset should apply rivers immediately");
assert.equal(sim.getWorldPOIsForTest().length >= 4, true, "random preset should apply POIs immediately");

sim.clearMapSeedForTest();
seed = sim.getActiveMapSeedForTest();
assert.equal(seed.units.length, 0, "clear seed should remove units");
assert.equal(seed.mountains.length, 0, "clear seed should remove mountains");
assert.equal(seed.rivers.length, 0, "clear seed should remove rivers");
assert.equal(seed.pois.length, 0, "clear seed should remove POIs");
assert.equal(sim.getMapFeaturesForTest().rivers.length, 0, "clear seed should clear river features");
assert.equal(sim.getWorldPOIsForTest().length, 0, "clear seed should clear seed POIs");

console.log("v0.13.1.1 map seed editor usability tests passed");
