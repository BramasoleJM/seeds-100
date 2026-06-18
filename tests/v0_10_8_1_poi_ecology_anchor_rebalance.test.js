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

function makeBlankWorld(sim, fertility = 2) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function classes(document) {
  return document.getElementById("grid").children.map((cell) => cell.className);
}

const styleCss = fs.readFileSync("style.css", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");

let { sim, document } = loadSim({ viewMode: "macro", random: () => 0 });
let pois = sim.getWorldPOIsForTest();
assert.deepEqual(pois.map((poi) => poi.type).sort(), ["great_forest", "monument", "rot_source", "spring"], "initial POIs should be the four V0.10.8.1 anchors");
const greatForest = pois.find((poi) => poi.type === "great_forest");
assert.ok(greatForest, "great forest should be present");
assert.equal(greatForest.radius, 5, "great forest should use radius 5");
assert.equal(greatForest.coreRadius, 2, "great forest should use coreRadius 2");
assert.equal(greatForest.strength, "strong");
assert.equal(greatForest.state, "active");
assert.equal(greatForest.createdAtTick, 0);
const gfCell = sim.getMacroDisplayWorldForTest()[greatForest.y][greatForest.x];
assert.notEqual(gfCell.terrain, sim.TERRAIN.BLOCK, "great forest center should not be BLOCK");
assert.ok(gfCell.terrain === sim.TERRAIN.WILD || gfCell.unit === sim.UNIT.BEAST || gfCell.regionBias === sim.REGION_BIAS.REFUGE, "great forest should prefer WILD / Beast / refuge evidence");
let renderedClasses = classes(document);
assert.ok(renderedClasses.some((name) => name.includes("poi-great-forest")), "Macro View should render great forest classes");
assert.ok(renderedClasses.some((name) => name.includes("poi-rot-core")), "Macro View should render rot source priority classes");

let world = makeBlankWorld(sim, 3);
world[5][5] = sim.createCell(sim.TERRAIN.FIELD, null, 0, "normal", 3);
world[5][6] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 3);
world[5][7] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 3);
world[5][8] = sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", 3);
let next = sim.applyPOIEffectsForTest(world, [{ type: "spring", x: 5, y: 5, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }], { random: () => 0 });
assert.equal(next[5][5].terrain, sim.TERRAIN.FIELD, "spring should not change FIELD terrain");
assert.equal(next[5][5].fertility, 3, "spring FIELD support should cap at 3");
assert.equal(next[5][6].terrain, sim.TERRAIN.WILD, "spring should not change WILD terrain");
assert.equal(next[5][6].fertility, 4, "spring WILD support should recover to cap 4");
assert.equal(next[5][8].terrain, sim.TERRAIN.EMPTY, "spring should not change EMPTY terrain");
assert.equal(next[5][8].fertility, 4, "spring EMPTY near Beast/WILD support should recover to cap 4");

world = makeBlankWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.HUMAN, 2, "normal", 4);
next = sim.applyTerrainRewriteForTest(world, [{ type: "great_forest", x: 10, y: 10, radius: 5, coreRadius: 2, strength: "strong", state: "active", createdAtTick: 0 }]);
assert.equal(next[10][10].terrain, sim.TERRAIN.WILD, "great forest core should block ordinary Human WILD -> FIELD rewrite");

assert.equal(sim.POI_EFFECTS.GREAT_FOREST_WILD_DECAY_MULTIPLIER, 0.35, "great forest should expose WILD preservation multiplier");
assert.equal(sim.POI_EFFECTS.GREAT_FOREST_BEAST_SPAWN_CHANCE, 0.04, "great forest should expose Beast anchor spawn chance");

world = makeBlankWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.WILD, null, 0, "normal", 3);
world[10][11] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 3);
next = sim.applyPOIEffectsForTest(world, [{ type: "great_forest", x: 10, y: 10, radius: 5, coreRadius: 2, strength: "strong", state: "active", createdAtTick: 0 }], { random: () => 0 });
assert.equal(next[10][10].unit, sim.UNIT.BEAST, "great forest should be able to create a Beast under density gates");

world = makeBlankWorld(sim, 2);
world[10][10] = sim.createCell(sim.TERRAIN.MARK, null, 0, "normal", 2);
world[10][11] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 1, "normal", 2);
world[11][10] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 1, "pack", 2);
world.pointsOfInterest = [{ type: "rot_source", x: 10, y: 10, radius: 4, strength: "strong", state: "active", createdAtTick: 0 }];
sim.resetWorld(world);
let mask = sim.buildMacroDisplayMasks(world, "macro");
assert.ok(mask.cellClasses[10][10].includes("poi-rot-core"), "rot source center should use a core class");
assert.ok(mask.cellClasses[10][11].includes("poi-rot-inner"), "rot source radius 1 should use an inner-ring class");
assert.ok(mask.cellClasses[13][10].includes("poi-rot-outer"), "rot source outer radius should use an outer-ring class");
assert.ok(mask.cellClasses[10][11].includes("poi-contested-human"), "rot source should mark Human/FIELD contest");
assert.ok(mask.cellClasses[11][10].includes("poi-contested-beast"), "rot source should mark Beast/WILD contest");

assert.ok(/great forest: Beast\/WILD habitat and origin/.test(indexHtml), "legend should explain great forest");
assert.ok(/spring: neutral fertility amplifier/.test(indexHtml), "legend should explain neutral spring");
assert.ok(/rot source: core \/ inner ring \/ contested outer ring/.test(indexHtml), "legend should explain rot source rings");
assert.ok(/monument: Human\/FIELD memory support/.test(indexHtml), "legend should explain monument");
assert.ok(/poi-great-forest/.test(styleCss), "style should include great forest class");
assert.ok(/poi-rot-core/.test(styleCss), "style should include rot core class");

({ sim } = loadSim({ viewMode: "macro", random: () => 0 }));
const snapshot = sim.createSnapshotExport();
assert.equal(snapshot.pointsOfInterest.length, 4, "snapshot should export four POIs");
sim.clearRecording();
sim.startRecording();
sim.stepWorld();
sim.stopRecording();
const recording = sim.createRecordingExport();
assert.equal(recording.pointsOfInterest.length, 4, "recording should export four POIs");
sim.clearMacroTimeline();
sim.startMacroTimeline();
sim.stepWorld();
sim.stopMacroTimeline();
const timeline = sim.createMacroTimelineExport();
assert.equal(timeline.pointsOfInterest.length, 4, "macro timeline should export four POIs");
assert.deepEqual(Object.keys(timeline.frames[0]).sort(), ["counts", "maskCounts", "maskRows", "macroSummary", "regionBiasCounts", "tick"].sort(), "macro timeline frame top-level keys should remain stable");
assert.deepEqual(timeline.frames[0].macroSummary.poiSummary, {
  total: 4,
  byType: { monument: 1, rot_source: 1, spring: 1, great_forest: 1 },
}, "macro summary should include four compact POI counts");

console.log("v0.10.8.1 POI ecology anchor rebalance tests passed");
