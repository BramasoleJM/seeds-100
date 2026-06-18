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

function loadSim({ viewMode = "macro", showLineage = true, showTags = true } = {}) {
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
  document.getElementById("lineageToggle").checked = showLineage;
  document.getElementById("macroOverlayToggle").checked = showTags;

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
  return { sim: context.window.__triSpeciesSim };
}

function blankWorld(sim, fertility = 1) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function mixedWorld(sim) {
  const world = blankWorld(sim, 2);
  for (let y = 8; y <= 13; y += 1) {
    for (let x = 8; x <= 13; x += 1) world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
  }
  for (let y = 15; y <= 18; y += 1) {
    for (let x = 25; x <= 30; x += 1) world[y][x] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 0, "pack", 3);
  }
  for (let y = 4; y <= 8; y += 1) {
    for (let x = 29; x <= 33; x += 1) world[y][x] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 4, "manifestation", 1);
  }
  world.pointsOfInterest = [
    { id: "poi_monument", type: "monument", x: 10, y: 10, radius: 4, state: "active", createdAtTick: 0 },
    { id: "poi_rot", type: "rot_source", x: 20, y: 6, radius: 4, innerRadius: 1, state: "active", createdAtTick: 0 },
    { id: "poi_spring", type: "spring", x: 20, y: 18, radius: 4, state: "active", createdAtTick: 0, blocksMovement: true },
    { id: "poi_forest", type: "great_forest", x: 34, y: 17, radius: 5, coreRadius: 2, state: "active", createdAtTick: 0 },
  ];
  return world;
}

function updateLineage(sim, source) {
  sim.refreshPopulationEvolutionFrameForTest(source, { force: true, mode: "macro" });
  return sim.updateHumanLineageMemoryForTest(source, { force: true, mode: "macro" });
}

const { sim } = loadSim();
sim.resetWorld(blankWorld(sim));
const world = mixedWorld(sim);
sim.resetWorld(world);
let memory = null;
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, world);
assert.ok(memory.lineages.some((lineage) => lineage.currentSeat), "fixture should establish a Human seat");

let blank = blankWorld(sim);
for (let i = 0; i < 6; i += 1) memory = updateLineage(sim, blank);
for (let i = 0; i < 3; i += 1) memory = updateLineage(sim, world);

const tags = sim.getSemanticTagsForTest(world, { mode: "macro" });
const labels = tags.map((tag) => tag.label);

assert.ok(labels.includes("H seat"), "default semantic tags should include H seat when a seat exists");
for (const hidden of ["H now", "H origin", "H path", "H old", "H descendant"]) {
  assert.equal(labels.includes(hidden), false, `${hidden} should be hidden from default visible tags`);
}
assert.ok(labels.filter((label) => label === "H domain").length <= 2, "H domain should be capped");
assert.ok(labels.filter((label) => label === "H old seat").length <= 2, "H old seat should be capped");
assert.ok(labels.filter((label) => label === "B range").length <= 1, "B range should be capped");
assert.ok(labels.filter((label) => label === "S scar").length <= 1, "S scar should be capped");
for (const poiLabel of ["Rot Source", "Spring", "Great Forest"]) {
  assert.ok(labels.includes(poiLabel), `${poiLabel} should remain visible as a major POI tag`);
}

const occupied = new Map();
for (const tag of tags) {
  const key = `${tag.x},${tag.y}`;
  assert.equal(occupied.has(key), false, `same-cell collision should suppress lower-priority tag at ${key}`);
  occupied.set(key, tag.label);
}

const hSeat = tags.find((tag) => tag.label === "H seat");
if (!labels.includes("Monument")) {
  assert.ok(Math.hypot(hSeat.x - 10, hSeat.y - 10) <= 1.25, "Monument may be suppressed only by higher-priority H seat collision");
}
assert.ok(!tags.some((tag) => tag.label === "H domain" && Math.hypot(tag.x - hSeat.x, tag.y - hSeat.y) <= 1.25), "near H domain should be suppressed by H seat");

const frame = sim.createMacroDisplayFrameForTest(world, "macro");
assert.ok(frame.macroSummary.semanticTags.length <= 24, "macroSummary.semanticTags should remain compact");
assert.deepEqual(frame.macroSummary.semanticTags.map((tag) => tag.label), labels, "macroSummary.semanticTags should reflect decluttered visible tags");

console.log("v0.11.4 semantic tag declutter tests passed");
