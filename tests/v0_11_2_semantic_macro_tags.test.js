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
  return { sim: context.window.__triSpeciesSim, document };
}

function blankWorld(sim, fertility = 1) {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => sim.createCell(sim.TERRAIN.EMPTY, null, 0, "normal", fertility, 0, null, sim.REGION_BIAS.NONE))
  );
}

function clusterWorld(sim) {
  const world = blankWorld(sim, 2);
  for (let y = 8; y <= 12; y += 1) {
    for (let x = 8; x <= 12; x += 1) {
      world[y][x] = sim.createCell(sim.TERRAIN.FIELD, sim.UNIT.HUMAN, 0, "normal", 3);
    }
  }
  for (let y = 15; y <= 18; y += 1) {
    for (let x = 26; x <= 30; x += 1) {
      world[y][x] = sim.createCell(sim.TERRAIN.WILD, sim.UNIT.BEAST, 0, "pack", 3);
    }
  }
  for (let y = 4; y <= 7; y += 1) {
    for (let x = 29; x <= 32; x += 1) {
      world[y][x] = sim.createCell(sim.TERRAIN.MARK, sim.UNIT.SPIRIT, 4, "manifestation", 1);
    }
  }
  world.pointsOfInterest = [
    { id: "poi_monument", type: "monument", x: 6, y: 18, radius: 4, state: "active", createdAtTick: 0 },
    { id: "poi_rot", type: "rot_source", x: 20, y: 6, radius: 4, innerRadius: 1, state: "active", createdAtTick: 0 },
    { id: "poi_spring", type: "spring", x: 20, y: 18, radius: 4, state: "active", createdAtTick: 0, blocksMovement: true },
    { id: "poi_forest", type: "great_forest", x: 34, y: 17, radius: 5, coreRadius: 2, state: "active", createdAtTick: 0 },
  ];
  world[3][3] = sim.createCell(sim.TERRAIN.BLOCK, null, 0, "normal", 0);
  return world;
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

const html = fs.readFileSync("index.html", "utf8");
assert.ok(html.includes("Show Semantic Tags") || html.includes("Show Map Tags"), "visible UI should label the overlay as Semantic Tags or Map Tags");
assert.ok(html.indexOf("macroOverlayToggle") < html.indexOf("<summary>Advanced / Debug</summary>"), "Semantic Tags control should be outside Advanced / Debug");

const { sim, document } = loadSim();
const world = clusterWorld(sim);
sim.resetWorld(world);
sim.refreshPopulationEvolutionFrameForTest(world, { force: true, mode: "macro" });
for (let i = 0; i < 3; i += 1) sim.updateHumanLineageMemoryForTest(world, { force: true, mode: "macro" });
const tags = sim.getSemanticTagsForTest(world, { mode: "macro" });

assert.ok(tags.length > 0, "semantic tags should be generated");
assert.ok(tags.length <= 24, "semantic tags should be capped");
assert.equal(tags.some((tag) => tag.label === "H core"), false, "H core should not be used as the Human domain tag");
assert.ok(tags.some((tag) => tag.label === "H seat" && tag.source === "lineage"), "H seat should come from Human lineage memory");
assert.ok(tags.some((tag) => tag.label === "Spring" && tag.source === "poi"), "POI tags should come from worldPOIs");
assert.equal(tags.some((tag) => tag.source === "legacy"), false, "semantic tags should not depend on legacy macro visibleIcons");

const frame = sim.getPopulationEvolutionFrameForTest();
const humanShape = frame.shapes.find((shape) => shape.type === "human" && shape.state !== "fading");
const humanCells = new Set([...humanShape.coreCells, ...humanShape.bodyCells, ...humanShape.edgeCells].map(cellKey));
const hDomain = tags.find((tag) => tag.label === "H domain");
if (hDomain) assert.ok(humanCells.has(`${hDomain.x},${hDomain.y}`), "H domain tag should anchor inside the Human population shape when visible");

const lineage = sim.getHumanLineageMemoryForTest().lineages.find((item) => item.id === sim.createHumanLineageSummaryForTest().dominantLineageId);
const activeCells = new Set(lineage.activeCells.map(cellKey));
const hSeat = tags.find((tag) => tag.label === "H seat");
assert.ok(activeCells.has(`${hSeat.x},${hSeat.y}`), "H seat should anchor inside selected lineage active cells");

for (const hidden of ["H now", "H origin", "H path", "H old", "H descendant"]) {
  assert.equal(tags.some((tag) => tag.label === hidden), false, `${hidden} should stay hidden in default semantic tags`);
}

for (const poi of world.pointsOfInterest) {
  const expected = poi.type === "rot_source" ? "Rot Source" : poi.type === "great_forest" ? "Great Forest" : poi.type === "spring" ? "Spring" : "Monument";
  const tag = tags.find((item) => item.sourceId === poi.id);
  assert.ok(tag, `${expected} POI tag should exist`);
  assert.equal(tag.x, poi.x, `${expected} tag should anchor at POI center x`);
  assert.equal(tag.y, poi.y, `${expected} tag should anchor at POI center y`);
}

assert.equal(tags.some((tag) => tag.x === 3 && tag.y === 3), false, "tags should not be emitted on BLOCK cells");

sim.renderMacroOverlayForTest();
const overlay = document.getElementById("macroOverlay");
assert.ok(overlay.children.some((child) => child.className.includes("semantic-tag")), "rendered overlay should use semantic-tag class");
assert.ok(overlay.children.some((child) => child.textContent === "H seat"), "rendered overlay should show lineage seat text tags");

const timelineFrame = sim.createMacroDisplayFrameForTest(world, "macro");
assert.ok(timelineFrame.macroSummary.semanticTags, "macroSummary should include compact semantic tags");
assert.ok(timelineFrame.macroSummary.semanticTags.length <= 24, "exported semantic tag summary should stay compact");

console.log("v0.11.2 semantic macro tags tests passed");
