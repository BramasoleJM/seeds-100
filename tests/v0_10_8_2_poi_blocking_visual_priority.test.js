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
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.title = "";
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

function loadSim({ viewMode = "macro", random = Math.random } = {}) {
  const elements = new Map();
  const document = {
    body: new FakeElement("body"),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement());
      return elements.get(id);
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    addEventListener() {},
  };

  for (const [id, value] of Object.entries({
    speed: "180",
    humanCount: "30",
    beastCount: "20",
    spiritCount: "0",
    fieldPatchCount: "5",
    wildPatchCount: "6",
    markPatchCount: "3",
    blockCount: "18",
    randomSeed: "1037746564",
    presetSelect: "balanced",
    overcrowding: "6",
    keyframeEvery: "25",
    viewMode,
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
    Math: Object.create(Math),
    Date,
    performance,
  };
  context.Math.random = random;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("sim.js", "utf8"), context, { filename: "sim.js" });
  return { sim: context.window.__triSpeciesSim, document };
}

function blankWorld(sim, fertility = 2) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

const styleCss = fs.readFileSync("style.css", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");

function ruleBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styleCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `${selector} should exist`);
  return match[1];
}

let { sim } = loadSim({ random: () => 0 });
const spring = { type: "spring", x: 5, y: 5, radius: 4, strength: "strong", state: "active", createdAtTick: 0, blocksMovement: true };
let world = blankWorld(sim, 2);
world[5][5] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2);
world[5][6] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 3);
world[4][5] = sim.createCell(sim.TERRAIN.EMPTY, sim.UNIT.HUMAN, 1, "normal", 3);
for (const n of [[4, 3], [5, 3], [6, 3], [4, 4], [6, 4], [4, 5], [6, 5]]) {
  world[n[1]][n[0]] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
}
world.pointsOfInterest = [spring];
sim.resetWorld(world);

assert.equal(sim.isPOIHardBlockerForTest(5, 5), true, "spring center should be a POI hard blocker");
assert.equal(sim.isCellBlockedForMovementForTest(world, 5, 5), true, "spring center should block movement");
assert.equal(sim.isCellBlockedForMovementForTest(world, 5, 6), false, "spring surrounding cells should not block movement");

const movementWorld = sim.planMovements(world);
assert.equal(movementWorld[4][5].unit, sim.UNIT.HUMAN, "Human should not move into spring center");
assert.equal(movementWorld[5][5].unit, null, "spring center should remain unoccupied after movement");

for (let y = 0; y < 25; y += 1) {
  for (let x = 0; x < 40; x += 1) {
    if ((x === 5 && y === 4) || (x === 5 && y === 5) || (x === 5 && y === 6)) continue;
    world[y][x] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
  }
}
sim.resetWorld(world);
assert.equal(sim.countReachableUnitInRadius(world, 5, 4, sim.UNIT.BEAST, 3), 0, "reachable sensing should not pass through spring center");
world[6][5].unit = sim.UNIT.BEAST;
assert.equal(sim.countReachableUnitInRadius(world, 5, 4, sim.UNIT.BEAST, 3), 0, "spring center should still block sensing after target appears beyond it");

assert.equal(sim.placeInterventionUnit(5, 5, sim.UNIT.HUMAN), false, "runtime intervention should reject spring center placement");

world = blankWorld(sim, 2);
world[5][5] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 2);
world[5][6] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 3);
let next = sim.applyPOIEffectsForTest(world, [spring], { random: () => 0 });
assert.equal(next[5][5].terrain, sim.TERRAIN.EMPTY, "spring center should not require a new terrain type");
assert.equal(next[5][6].fertility, 4, "spring surrounding cells should still receive fertility recovery");

world = blankWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
world[10][11] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 2);
world[11][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 2);
let mask = sim.buildMacroDisplayMasks(world, "macro", [{ type: "rot_source", x: 10, y: 10, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }]);
const blockClasses = mask.cellClasses[10][10];
assert.equal(blockClasses.includes("poi-influence"), false, "BLOCK should not receive POI influence classes");
assert.equal(blockClasses.includes("poi-center"), false, "BLOCK should not receive POI center classes");
assert.equal(blockClasses.includes("poi-rot-core"), false, "BLOCK should not receive rot source classes");

mask = sim.buildMacroDisplayMasks(world, "macro", [{ type: "rot_source", x: 11, y: 10, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }]);
assert.ok(mask.cellClasses[10][11].includes("poi-rot-core"), "rot source center should still use poi-rot-core");
assert.ok(mask.cellClasses[10][12].includes("poi-rot-inner"), "rot inner ring should still use poi-rot-inner");
assert.ok(mask.cellClasses[11][10].includes("poi-contested-beast"), "rot outer/inner ring may show Beast contest");

assert.ok(/terrain-block\.poi-influence/.test(styleCss), "CSS should include a terrain-block POI leakage safety rule");
assert.ok(/poi-center\.poi-spring/.test(styleCss), "CSS should include spring center source marker styling");
assert.ok(!/radial-gradient/.test(ruleBlock(".grid.macro-view .poi-great-forest.poi-influence")), "great forest influence should not use per-cell radial icon markers");
assert.ok(/background-image/.test(ruleBlock(".grid.macro-view .poi-rot-core")), "rot core should have dedicated visual-priority styling");
assert.ok(/Spring center is a blocked source/.test(indexHtml) || /spring center/i.test(indexHtml), "legend should mention spring center blocking");

({ sim } = loadSim({ random: () => 0 }));
const snapshot = sim.createSnapshotExport();
const exportedSpring = snapshot.pointsOfInterest.find((poi) => poi.type === "spring");
assert.equal(snapshot.pointsOfInterest.length, 4, "snapshot should still export four compact POIs");
assert.equal(exportedSpring.blocksMovement, true, "spring export may include compact blocksMovement metadata");
sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.stepWorld();
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame keys should remain stable");

console.log("v0.10.8.2 POI blocking and visual priority tests passed");
